'use strict';

// Keep the pinned native URL and byte-string implementation authoritative.
// These exact corrections cover independently executed contract failures.
const stringEdits = [
  {
    file: 'Source/Core/URL.cpp',
    before: [
      '\turl_dirty = false;',
      '\turl = _url;',
      '',
      '\t// Make sure an Empty URL is completely Empty.',
    ].join('\n'),
    after: [
      '\turl_dirty = false;',
      '\turl = _url;',
      '',
      '\t// Replacing a URL replaces every parsed component and parameter.',
      '\tprotocol.clear();',
      '\tlogin.clear();',
      '\tpassword.clear();',
      '\thost.clear();',
      '\tport = 0;',
      '\tpath.clear();',
      '\tfile_name.clear();',
      '\textension.clear();',
      '\tparameters.clear();',
      '',
      '\t// Make sure an Empty URL is completely Empty.',
    ].join('\n'),
  },
  {
    file: 'Source/Core/URL.cpp',
    before: [
      'void URL::ClearParameters()',
      '{',
      '\tparameters.clear();',
      '}',
    ].join('\n'),
    after: [
      'void URL::ClearParameters()',
      '{',
      '\tparameters.clear();',
      '\turl_dirty = true;',
      '}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/URL.cpp',
    before: '\tfor (String::size_type i = 0; value_c[i]; i++)',
    after: '\tfor (String::size_type i = 0; i < value.size(); i++)',
  },
  {
    file: 'Source/Core/URL.cpp',
    before: '\t\t\tsnprintf(hex, hex_buffer_size, "%%%02X", c);',
    after: '\t\t\tsnprintf(hex, hex_buffer_size, "%%%02X", ' +
      'static_cast<unsigned int>(static_cast<unsigned char>(c)));',
  },
  {
    file: 'Source/Core/StringUtilities.cpp',
    before: [
      'String StringUtilities::Replace(String subject, const String& search, ' +
        'const String& replace)',
      '{',
      '\tsize_t pos = 0;',
    ].join('\n'),
    after: [
      'String StringUtilities::Replace(String subject, const String& search, ' +
        'const String& replace)',
      '{',
      '\t// An empty search has no advancing match; leave the source intact.',
      '\tif (search.empty())',
      '\t\treturn subject;',
      '',
      '\tsize_t pos = 0;',
    ].join('\n'),
  },
  {
    file: 'Source/Core/StringUtilities.cpp',
    before: '\treturn size() == other.size() && ' +
      'strncmp(p_begin, other.p_begin, size()) == 0;',
    after: '\treturn size() == other.size() && ' +
      'memcmp(p_begin, other.p_begin, size()) == 0;',
  },
];

module.exports = { stringEdits };
