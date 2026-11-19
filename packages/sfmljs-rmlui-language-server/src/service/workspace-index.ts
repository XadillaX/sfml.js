'use strict';

/**
 * Filesystem-backed workspace index of RML ids and classes.
 *
 * The server owns this index so any LSP client gets cross-document selector
 * completion without editor-specific APIs. Scans run asynchronously and are
 * debounced after file change notifications.
 */

import { EventEmitter } from 'node:events';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { WorkspaceSymbols } from '../util/completion';
import { parseRml } from '../util/rml-parser';

const DEBOUNCE_MS = 200;
const EXCLUDED_DIRS = new Set([
  'node_modules', 'dist', 'build', 'third_party', '.git', '.rush',
]);

/**
 * Indexes ids and classes across all RML files under workspace roots.
 */
export class FsWorkspaceIndex {
  private readonly emitter = new EventEmitter();
  private timer: NodeJS.Timeout | undefined;
  private roots: string[] = [];
  private symbols: WorkspaceSymbols = { ids: [], classes: [] };

  /**
   * Replaces the workspace roots and rebuilds the index.
   *
   * @param newRoots Absolute filesystem paths of workspace roots.
   */
  public async setRoots(newRoots: string[]): Promise<void> {
    this.roots = newRoots;
    await this.rebuild();
  }

  /**
   * Returns the current symbol snapshot.
   *
   * @returns Cached ids and classes.
   */
  public getSymbols(): WorkspaceSymbols {
    return this.symbols;
  }

  /**
   * Schedules a debounced rebuild after a file change.
   */
  public scheduleRebuild(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      void this.rebuild();
    }, DEBOUNCE_MS);
  }

  /**
   * Registers an index-change listener.
   *
   * @param listener Callback invoked after each rebuild.
   */
  public onChange(listener: () => void): void {
    this.emitter.on('change', listener);
  }

  /**
   * Clears timers and listeners.
   */
  public dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.emitter.removeAllListeners();
  }

  private async rebuild(): Promise<void> {
    const ids = new Set<string>();
    const classes = new Set<string>();
    for (const root of this.roots) {
      await this.collect(root, ids, classes);
    }
    this.symbols = {
      ids: Array.from(ids).sort(),
      classes: Array.from(classes).sort(),
    };
    this.emitter.emit('change');
  }

  private async collect(
    directory: string,
    ids: Set<string>,
    classes: Set<string>,
  ): Promise<void> {
    let entries: Array<{ name: string; isDirectory(): boolean }>;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) {
          continue;
        }
        await this.collect(
          path.join(directory, entry.name),
          ids,
          classes,
        );
        continue;
      }
      if (!entry.name.endsWith('.rml')) {
        continue;
      }
      const file = path.join(directory, entry.name);
      try {
        const text = await fs.readFile(file, 'utf8');
        const parsed = parseRml(text);
        for (const id of parsed.ids) {
          ids.add(id);
        }
        for (const name of parsed.classes) {
          classes.add(name);
        }
      } catch {
        // Unreadable or malformed files do not invalidate the whole index.
      }
    }
  }
}
