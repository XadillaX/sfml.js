'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const download = require('download');

/**
 * Run tar with local paths, including on Windows drive-letter filesystems.
 * @param {string[]} args Tar arguments.
 * @param {string} cwd Temporary archive directory.
 * @return {string} Command output.
 */
function runTar(args, cwd) {
  const result = spawnSync('tar', args, {
    cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw result.error || new Error(`tar failed: ${result.stderr}`);
  }
  return result.stdout;
}

/**
 * Resolve the immutable archive shared by source and resource preparation.
 * @param {object} dependency Pinned upstream identity.
 * @return {string} Archive URL.
 */
function archiveUrl(dependency) {
  return dependency.url ||
    `https://codeload.github.com/${dependency.repository}/` +
    `legacy.tar.gz/${dependency.commit}`;
}

/**
 * Validate a tar listing before selecting any file for extraction.
 * @param {string} listing Tar member listing.
 * @return {object[]} Safe file members with upstream-relative filenames.
 */
function archiveMembers(listing) {
  const result = [];
  const seen = new Set();
  let root;
  for (const member of listing.split(/\r?\n/).filter(Boolean)) {
    const parts = member.replace(/\/$/, '').split('/');
    if (parts.some(part => !part || part === '.' || part === '..') ||
        /[\\\0]/.test(member)) {
      throw new Error(`Unsafe archive path: ${member}`);
    }
    root ??= parts[0];
    if (parts[0] !== root) {
      throw new Error('Archive must have one upstream root');
    }
    const filename = parts.slice(1).join('/');
    if (member.endsWith('/')) {
      continue;
    }
    if (!filename || seen.has(filename)) {
      throw new Error(`Duplicate or invalid archive member: ${member}`);
    }
    seen.add(filename);
    result.push({ member, filename });
  }
  return result.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * Verify an archive and enumerate it without extracting unrelated payloads.
 * @param {object} options Dependency, temp directory and optional download.
 * @param {object} options.dependency Pinned archive identity.
 * @param {string} options.directory Temporary directory.
 * @param {string} [options.archivePath] Existing archive path.
 * @param {Function} [options.fetchArchive] URL to archive buffer operation.
 * @return {Promise<object[]>} Safe upstream file inventory.
 */
async function prepareArchive({
  dependency, directory, archivePath, fetchArchive = download,
}) {
  const buffer = archivePath ? await fs.readFile(archivePath) :
    await fetchArchive(archiveUrl(dependency));
  if (createHash('sha256').update(buffer).digest('hex') !== dependency.sha256) {
    throw new Error('Upstream archive checksum mismatch');
  }
  await fs.writeFile(path.join(directory, 'upstream.tar.gz'), buffer);
  // Reject links before extraction or patching can follow an archive symlink.
  const types = runTar([ '-tvzf', 'upstream.tar.gz' ], directory);
  if (types.split(/\r?\n/).filter(Boolean)
    .some(line => ![ '-', 'd' ].includes(line[0]))) {
    throw new Error('Archive contains symbolic links or special files');
  }
  return archiveMembers(runTar([ '-tzf', 'upstream.tar.gz' ], directory));
}

/**
 * Extract only the selected regular files into a temporary source tree.
 * @param {string} directory Temporary archive directory.
 * @param {object[]} members Selected archive members.
 * @param {string} destination Child directory to create.
 * @return {Promise<string>} Extracted tree root.
 */
async function extractMembers(directory, members, destination) {
  await fs.writeFile(path.join(directory, 'members.txt'),
    `${members.map(entry => entry.member).join('\n')}\n`);
  const target = path.join(directory, destination);
  await fs.mkdir(target);
  runTar([ '-xzf', 'upstream.tar.gz', '--strip-components=1',
    '-C', destination, '-T', 'members.txt' ], directory);
  return target;
}

module.exports = {
  archiveUrl, archiveMembers, prepareArchive, extractMembers,
};
