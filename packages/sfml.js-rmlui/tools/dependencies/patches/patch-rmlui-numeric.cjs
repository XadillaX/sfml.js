'use strict';

// Native probes reproduce these defects in the pinned 6.3 numeric helpers.
// Keep component layout, aliases and the column-major rendering path intact.
const matrix = 'Matrix4<Component, Storage>';
const transpose = `typename ${matrix}::TransposeType`;
const inlines = 'Include/RmlUi/Core/Matrix4.inl';
const header = 'Include/RmlUi/Core/Matrix4.h';

/**
 * Build the exact original cross-storage arithmetic block and its correction.
 * @param {string} operation In-place addition or subtraction.
 * @return {object} Versioned source edit.
 */
function arithmeticEdit(operation) {
  const prefix = `\t${transpose}::ConstRows other_rows(other`;
  const loop = '\tfor (int i = 0; i < 4; ++i)\n\t{\n';

  return {
    file: inlines,
    before: `${prefix});\n${loop}` +
      `\t\trows[i] ${operation} other_rows[i];\n\t}`,
    after: `${prefix}.vectors);\n${loop}` +
      '\t\tfor (int j = 0; j < 4; ++j)\n' +
      `\t\t\trows[i][j] ${operation} other_rows[i][j];\n\t}`,
  };
}

/**
 * Compare mathematical components using each operand's own storage strategy.
 * @param {string} operation Equality or inequality.
 * @return {object} Versioned source edit.
 */
function comparisonEdit(operation) {
  const signature = [
    `bool ${matrix}::operator${operation}(const ${transpose}& other)`,
    ' const noexcept\n{\n',
    `\ttypename ${matrix}::ConstRows rows(vectors);\n`,
  ].join('');
  const predicate = Array.from({ length: 4 }, (_, index) =>
    `rows[${index}] ${operation} other_rows[${index}]`)
    .join(operation === '==' ? ' && ' : ' || ');

  return {
    file: inlines,
    before: signature +
      `\ttypename ${matrix}::ConstRows other_rows(other.vectors);\n` +
      `\treturn ${predicate};\n}`,
    after: signature +
      `\t${transpose}::ConstRows other_rows(other.vectors);\n\n` +
      '\tfor (int i = 0; i < 4; ++i)\n\t{\n' +
      '\t\tfor (int j = 0; j < 4; ++j)\n' +
      '\t\t{\n' +
      '\t\t\tif (rows[i][j] != other_rows[i][j])\n' +
      `\t\t\t\treturn ${operation === '!='};\n` +
      '\t\t}\n\t}\n' +
      `\treturn ${operation === '=='};\n}`,
  };
}

const numericEdits = [
  {
    file: header,
    before: [
      '\t\toperator const VectorType() const noexcept { return VectorType(',
      '(*this)[0], (*this)[1], (*this)[2], (*this)[3]); }',
    ].join(''),
    after: [
      '\t\toperator const VectorType() const noexcept',
      '\t\t{',
      '\t\t\treturn VectorType(vectors[0][idx], vectors[1][idx],',
      '\t\t\t\tvectors[2][idx], vectors[3][idx]);',
      '\t\t}',
    ].join('\n'),
  },
  {
    file: header,
    before: [
      '\tinline const ThisType operator/(Component other) const noexcept',
      '\t{',
      '\t\tThisType result(*this);',
      '\t\tresult *= other;',
      '\t\treturn result;',
      '\t}',
    ].join('\n'),
    after: [
      '\tinline const ThisType operator/(Component other) const noexcept',
      '\t{',
      '\t\tThisType result(*this);',
      '\t\tresult /= other;',
      '\t\treturn result;',
      '\t}',
    ].join('\n'),
  },
  {
    file: inlines,
    before: [
      `const typename ${matrix}::ThisType& ${matrix}::operator=(`,
      `\tconst ${transpose}& other) noexcept`,
      '{',
      '\tRows rows(vectors);',
      `\t${transpose}::Rows other_rows(other.vectors);`,
    ].join('\n'),
    after: [
      `const typename ${matrix}::ThisType& ${matrix}::operator=(`,
      `\tconst ${transpose}& other) noexcept`,
      '{',
      '\tRows rows(vectors);',
      `\t${transpose}::ConstRows other_rows(other.vectors);`,
    ].join('\n'),
  },
  arithmeticEdit('+='),
  arithmeticEdit('-='),
  comparisonEdit('=='),
  comparisonEdit('!='),
  ...[ '=', '+=', '-=' ].map(operation => {
    const prefix = [
      `const typename ${matrix}::ThisType& ${matrix}::operator${operation}(`,
      `\tconst ${transpose}& other) noexcept`,
      '{',
    ].join('\n');

    return {
      file: inlines,
      before: `${prefix}\n\tRows rows(vectors);`,
      after: [
        prefix,
        '\tif (static_cast<const void*>(this) == ' +
          'static_cast<const void*>(&other))',
        '\t{',
        '\t\tconst TransposeType snapshot(other);',
        `\t\treturn *this ${operation} snapshot;`,
        '\t}',
        '',
        '\tRows rows(vectors);',
      ].join('\n'),
    };
  }),
  {
    file: inlines,
    before: [
      '\tThisType matrix = ThisType::Identity();',
      '',
      '\tfor (int i = 0; i < 4; i++)',
      '\t\tmatrix[i][3] = perspective[i];',
      '',
      '\tfor (int i = 0; i < 4; i++)',
      '\t\tfor (int j = 0; j < 3; j++)',
      '\t\t\tmatrix[3][i] += translation[j] * matrix[j][i];',
    ].join('\n'),
    after: [
      '\tThisType matrix = ThisType::Identity();',
      '\tColumns columns(matrix.vectors);',
      '',
      '\tfor (int i = 0; i < 4; i++)',
      '\t\tcolumns[i][3] = perspective[i];',
      '',
      '\tfor (int i = 0; i < 4; i++)',
      '\t\tfor (int j = 0; j < 3; j++)',
      '\t\t\tcolumns[3][i] += translation[j] * columns[j][i];',
    ].join('\n'),
  },
  {
    file: inlines,
    before: [
      '\tThisType temp = ThisType::Identity();',
      '\tif (skew[2])',
    ].join('\n'),
    after: [
      '\tThisType temp = ThisType::Identity();',
      '\tColumns temp_columns(temp.vectors);',
      '',
      '\tif (skew[2])',
    ].join('\n'),
  },
  ...[
    'temp[2][1] = skew[2];',
    'temp[2][1] = 0;',
    'temp[2][0] = skew[1];',
    'temp[2][0] = 0;',
    'temp[1][0] = skew[0];',
  ].map(statement => ({
    file: inlines,
    before: `\t\t${statement}`,
    after: `\t\t${statement.replace('temp[', 'temp_columns[')}`,
  })),
  {
    file: inlines,
    before: '\t\t\tmatrix[i][j] *= scale[i];',
    after: '\t\t\tcolumns[i][j] *= scale[i];',
  },
  {
    file: 'Source/Core/Math.cpp',
    before: '\t\treturn (std::rand() / (float)RAND_MAX) * max_value;',
    after: [
      '\t\tconst float result = (std::rand() / (float)RAND_MAX) * max_value;',
      '\t\treturn Min(result, std::nextafter(max_value, 0.f));',
    ].join('\n'),
  },
];

module.exports = { numericEdits };
