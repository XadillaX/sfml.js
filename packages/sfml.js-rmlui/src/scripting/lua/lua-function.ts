import { native } from '../../internal/native';
import type { LuaScalar } from './lua-scripts';

const handles = new WeakMap<LuaFunction, object>();
const nativeConstruction = Symbol('native Lua function construction');

/**
 * Captured native Lua function or compiled chunk, retaining its exact VM.
 *
 * @zh 捕获的原生 Lua 函数或编译块，保活其所属 VM。
 * @ja キャプチャした Lua 関数またはコンパイル済みチャンク。元の VM を保持します。
 * @ko 캡처한 네이티브 Lua 함수나 컴파일된 청크이며 원본 VM을 유지합니다.
 * @remarks
 * Obtain from LuaScriptHost.compile or getFunction. Replacing a Lua global
 * does not replace this reference. Shutdown invalidates every reference.
 * @zh 通过 LuaScriptHost.compile 或 getFunction 获取。替换 Lua 全局函数
 * 不会替换此引用。shutdown 使所有引用失效。
 * @ja LuaScriptHost.compile または getFunction で取得します。グローバル関数の
 * 置換はこの参照に影響しません。shutdown ですべての参照が無効になります。
 * @ko LuaScriptHost.compile이나 getFunction으로 얻습니다. 전역 함수 교체는
 * 이 참조에 영향을 주지 않으며 shutdown은 모든 참조를 무효화합니다.
 */
export class LuaFunction {
  /**
   * Construct a facade for an internal native reference.
   *
   * @zh 为内部原生引用构造外观对象。
   * @ja 内部のネイティブ参照のファサードを作ります。
   * @ko 내부 네이티브 참조의 파사드를 만듭니다.
   * @param token - Private construction token.
   * @zh token - 私有构造令牌。
   * @ja token - 非公開の構築トークン。
   * @ko token - 비공개 생성 토큰입니다.
   * @param handle - Opaque native function reference.
   * @zh handle - 不透明原生函数引用。
   * @ja handle - 不透明なネイティブ関数参照。
   * @ko handle - 불투명 네이티브 함수 참조입니다.
   * @internal
   */
  constructor(token: typeof nativeConstruction, handle: object) {
    if (token !== nativeConstruction) {
      throw new TypeError('Expected native Lua function construction');
    }
    handles.set(this, handle);
  }

  /**
   * Execute this reference and copy its first scalar result.
   *
   * @zh 执行此引用并复制第一个标量结果。
   * @ja この参照を実行し、最初のスカラー結果をコピーします。
   * @ko 이 참조를 실행하고 첫 스칼라 결과를 복사합니다.
   * @param args - Scalar arguments; signed 64-bit integers use bigint.
   * @zh args - 标量参数；有符号 64 位整数用 bigint。
   * @ja args - スカラー引数。符号付き 64 ビット整数は bigint。
   * @ko args - 스칼라 인수이며 부호 있는 64비트 정수는 bigint입니다.
   * @returns First scalar result; no return value becomes null.
   * @zh 第一个标量结果；无返回值时为 null。
   * @ja 最初のスカラー結果。戻り値がない場合は null。
   * @ko 첫 스칼라 결과이며 반환 값이 없으면 null입니다.
   */
  call(...args: LuaScalar[]): LuaScalar {
    return native.invokeLuaFunction(handleOf(this), args, 1)[0];
  }

  /**
   * Execute once with an exact result count, matching ExecuteCall/EndCall.
   *
   * @zh 按准确结果数量执行一次，对应 ExecuteCall/EndCall。
   * @ja ExecuteCall/EndCall と同じ正確な結果数で一度実行します。
   * @ko ExecuteCall/EndCall과 같은 정확한 결과 수로 한 번 실행합니다.
   * @param resultCount - Nonnegative count; defaults to zero.
   * @zh resultCount - 非负结果数量，默认 0。
   * @ja resultCount - 非負の結果数。既定は 0。
   * @ko resultCount - 음수가 아닌 결과 수이며 기본값은 0입니다.
   * @param args - Scalar function or chunk arguments.
   * @zh args - 函数或编译块的标量参数。
   * @ja args - 関数またはチャンクのスカラー引数。
   * @ko args - 함수나 청크의 스칼라 인수입니다.
   * @returns Copied results; missing results become null, extras are discarded.
   * @zh 复制的结果；不足部分补 null，多余结果丢弃。
   * @ja コピーした結果。不足分は null、余分な結果は破棄します。
   * @ko 복사한 결과이며 부족한 값은 null로 채우고 초과 값은 버립니다.
   */
  callResults(resultCount = 0, ...args: LuaScalar[]): LuaScalar[] {
    return native.invokeLuaFunction(handleOf(this), args, resultCount);
  }

  /**
   * Release this registry reference and its VM retention.
   *
   * @zh 释放此 registry 引用及其对 VM 的保活。
   * @ja このレジストリ参照と VM の保持を解放します。
   * @ko 이 레지스트리 참조와 VM 유지를 해제합니다.
   * @remarks
   * Calling or releasing it again rejects. Other references remain valid.
   * @zh 再次调用或释放会拒绝；其他引用仍有效。
   * @ja 再度の呼び出しや解放は拒否します。他の参照は有効なままです。
   * @ko 다시 호출하거나 해제하면 거부하며 다른 참조는 유효합니다.
   */
  release(): void {
    native.releaseLuaFunction(handleOf(this));
  }
}

/**
 * Wrap an opaque function created by the native VM.
 *
 * @param handle - Native registry-reference owner.
 * @returns Managed function facade.
 * @internal
 */
export function wrapLuaFunction(handle: object): LuaFunction {
  return new LuaFunction(nativeConstruction, handle);
}

/**
 * Reject forged function receivers before accessing the Native handle.
 *
 * @param receiver - Candidate function.
 * @returns Native reference.
 */
function handleOf(receiver: LuaFunction): object {
  const handle = handles.get(receiver);
  if (!handle) {
    throw new TypeError('Expected a managed Lua function');
  }
  return handle;
}
