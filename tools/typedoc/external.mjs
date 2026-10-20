/**
 * Translations for Node's inherited Error documentation.
 * Keep these outside node_modules; examples remain the upstream code blocks.
 * @param {object} reflection - TypeDoc reflection to inspect.
 */
export function externalTranslations(reflection) {
  if (!reflection.sources?.some(source =>
    source.fileName.endsWith('node_modules/@types/node/globals.d.ts'))) {
    return undefined;
  }
  const name = reflection.getFullName();
  const code = (reflection.comment?.summary || []).filter(part =>
    part.kind === 'code' && part.text.startsWith('```'));
  const text = value => ({ kind: 'text', text: value });
  if (name === 'SFMLError.captureStackTrace.captureStackTrace') {
    if (code.length !== 2) {
      throw new Error(
        'Node captureStackTrace documentation changed; review translations'
      );
    }
    return new Map([
      [
        '@zh',
        [
          text(
            '在 `targetObject` 上创建 `.stack` ' +
            '属性。访问该属性时，返回描述调用 `Error.captureStackTrace()` ' +
            '所在代码位置的字符串。\n\n'
          ),
          code[0],
          text(
            '\n\n堆栈首行以 `${myObject.name}: ' +
            '${myObject.message}` 为前缀。\n\n可选参数 ' +
            '`constructorOpt` 接受一个函数。指定后，生成的堆栈会省略 ' +
            '`constructorOpt` 之上的所有帧，也包括 `constructorOpt` ' +
            '本身。\n\n`constructorOpt` 可用于向用户隐藏错误生成的实现细节，例如：\n\n'
          ),
          code[1],
        ],
      ],
      [
        '@ja',
        [
          text(
            '`targetObject` に `.stack` ' +
            'プロパティを作成します。このプロパティを読み取ると、' +
            '`Error.captureStackTrace()` ' +
            'が呼ばれたコード位置を表す文字列が返されます。\n\n'
          ),
          code[0],
          text(
            '\n\nスタックの先頭行には `${myObject.name}: ' +
            '${myObject.message}` が付きます。\n\n省略可能な ' +
            '`constructorOpt` ' +
            '引数には関数を指定します。指定すると、`constructorOpt` ' +
            'より上のすべてのフレームと `constructorOpt` ' +
            '自体が、生成されるスタックトレースから除かれます。\n\n`constructorOpt` ' +
            'は、エラー生成の実装詳細をユーザーに見せないために利用できます。例：\n\n'
          ),
          code[1],
        ],
      ],
      [
        '@ko',
        [
          text(
            '`targetObject`에 `.stack` 속성을 만듭니다. 이 속성을 읽으면 ' +
            '`Error.captureStackTrace()`가 호출된 코드 위치를 나타내는 ' +
            '문자열을 반환합니다.\n\n'
          ),
          code[0],
          text(
            '\n\n스택의 첫 줄에는 `${myObject.name}: ' +
            '${myObject.message}` 접두사가 붙습니다.\n\n선택적 ' +
            '`constructorOpt` 인수는 함수를 받습니다. 지정하면 ' +
            '`constructorOpt` 위의 모든 프레임과 `constructorOpt` ' +
            '자체가 생성된 스택 추적에서 제외됩니다.\n\n`constructorOpt`는 오류 ' +
            '생성의 구현 세부 사항을 사용자에게 숨길 때 유용합니다. 예:\n\n'
          ),
          code[1],
        ],
      ],
    ]);
  }
  if (name === 'SFMLError.stackTraceLimit') {
    return new Map([
      [
        '@zh',
        [
          text(
            '`Error.stackTraceLimit` 指定堆栈追踪采集的帧数，适用于 `new ' +
            'Error().stack` 和 ' +
            '`Error.captureStackTrace(obj)`。\n\n默认值为 ' +
            '`10`，也可设为任意有效的 JavaScript ' +
            '数值。修改仅影响修改之后采集的堆栈追踪。\n\n设为非数值或负数时，堆栈追踪不采集任何帧。'
          ),
        ],
      ],
      [
        '@ja',
        [
          text(
            '`Error.stackTraceLimit` ' +
            'はスタックトレースで収集するフレーム数を指定します。`new Error().stack` ' +
            'と `Error.captureStackTrace(obj)` ' +
            'の両方に適用されます。\n\n既定値は `10` ですが、任意の有効な JavaScript ' +
            'の数値を設定できます。変更は、変更後に取得したスタックトレースにのみ影響します。' +
            '\n\n数値以外の値や負の値を設定すると、フレームは収集されません。'
          ),
        ],
      ],
      [
        '@ko',
        [
          text(
            '`Error.stackTraceLimit`는 스택 추적에서 수집할 프레임 수를 ' +
            '지정합니다. `new Error().stack`과 ' +
            '`Error.captureStackTrace(obj)`에 모두 ' +
            '적용됩니다.\n\n기본값은 `10`이며 유효한 JavaScript 숫자로 설정할 수 ' +
            '있습니다. 변경은 값을 바꾼 이후에 캡처하는 스택 추적에만 영향을 ' +
            '줍니다.\n\n숫자가 아닌 값이나 음수로 설정하면 프레임을 수집하지 않습니다.'
          ),
        ],
      ],
    ]);
  }
  return undefined;
}
