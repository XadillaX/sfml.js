import { Script, createContext, type Context as VmContext } from 'node:vm';
import { types } from 'node:util';
import { Context } from '../runtime/context';
import { Document } from '../dom/documents/document';
import { RmlEvent } from '../events/event';
import { native, type NativeRmlEvent } from '../internal/native';
import type {
  ContextNativeHandle, DocumentNativeHandle,
} from '../values/types';
import { luaScriptHostHandle, type LuaScriptHost } from './lua/lua-scripts';

/**
 * Synchronous named document event handler.
 *
 * @zh 同步的命名文档事件处理器。
 * @ja 同期の名前付き文書イベントハンドラーです。
 * @ko 동기식 이름 있는 문서 이벤트 처리기입니다.
 */
export interface ScriptHandler {
  /**
   * Handle one live event from the owning script document.
   *
   * @zh 处理所属脚本文档中的一个活跃事件。
   * @ja 所有するスクリプト文書の有効なイベントを処理します。
   * @ko 소유 스크립트 문서의 활성 이벤트 하나를 처리합니다.
   * @param event - Dispatch-scoped live event.
   * @zh event - 限于本次派发的活跃事件。
   * @ja event - この送信中のみ有効なイベント。
   * @ko event - 이번 전달에서만 활성화되는 이벤트입니다.
   * @param document - Checked owning document.
   * @zh document - 校验生命周期的所属文档。
   * @ja document - 寿命を検証する所有文書。
   * @ko document - 수명을 검증하는 소유 문서입니다.
   * @param context - Checked owning context.
   * @zh context - 校验生命周期的所属上下文。
   * @ja context - 寿命を検証する所有コンテキスト。
   * @ko context - 수명을 검증하는 소유 컨텍스트입니다.
   * @returns Synchronous result; Promise results are rejected.
   * @zh 同步结果，Promise 结果会被拒绝。
   * @ja 同期の結果。Promise は拒否します。
   * @ko 동기 결과이며 Promise 결과는 거부됩니다.
   */
  (event: RmlEvent, document: Document, context: Context): unknown;
}

/**
 * Explicit policy for trusted JavaScript document execution.
 *
 * @zh 受信任 JavaScript 文档执行的显式策略。
 * @ja 信頼された JavaScript 文書を実行する明示的なポリシーです。
 * @ko 신뢰할 수 있는 JavaScript 문서 실행의 명시적 정책입니다.
 */
export interface NodeScriptHostOptions {
  /**
   * Enable inline script tags and inline on* expressions; defaults to false.
   *
   * @zh 启用内联 script 标签和 on* 表达式，默认为 false。
   * @ja インライン script と on* 式を有効にします。既定は false。
   * @ko 인라인 script와 on* 식을 활성화하며 기본값은 false입니다.
   */
  allowInline?: boolean;

  /**
   * Enable external scripts loaded through RmlUi's FileInterface.
   *
   * @zh 启用通过 RmlUi FileInterface 加载的外部脚本。
   * @ja RmlUi FileInterface による外部スクリプトを有効にします。
   * @ko RmlUi FileInterface로 읽는 외부 스크립트를 활성화합니다.
   */
  allowExternal?: boolean;

  /**
   * Capture named handlers once; names work without enabling script sources.
   *
   * @zh 一次捕获命名处理器，无需启用脚本源即可使用名称。
   * @ja 名前付きハンドラーを一度取得し、ソースを有効にせず利用できます。
   * @ko 이름 있는 처리기를 한 번 캡처하며 소스 활성화 없이 사용할 수 있습니다.
   */
  handlers?: Readonly<Record<string, ScriptHandler>>;

  /**
   * Capture globals; document/context/event/element are reserved.
   *
   * @zh 捕获各文档的全局值，document/context/event/element 为保留名称。
   * @ja 文書ごとのグローバルを取得します。document/context/event/element は予約名。
   * @ko 문서별 전역 값을 캡처합니다. document/context/event/element는 예약어입니다.
   */
  globals?: Readonly<Record<string, unknown>>;
}

interface ScriptSession {
  document: Document;
  context: Context;
  globals: Record<string, unknown>;
  vm: VmContext;
}

const handles = new WeakMap<NodeScriptHost, object>();
const reserved = new Set([ 'document', 'context', 'event', 'element' ]);

/**
 * Reject asynchronous results after consuming their rejection.
 *
 * @param value - Script or handler result.
 * @returns Unchanged synchronous result.
 */
function requireSynchronous(value: unknown): unknown {
  if (types.isPromise(value)) {
    // Consume rejection without reading a potentially overridden .then.
    Reflect.apply(Promise.prototype.then, value, [ undefined, () => {} ]);
    throw new TypeError('Document scripts and handlers must be synchronous');
  }
  return value;
}

/**
 * Native-owned, per-document JavaScript host using Node's vm.Script.
 *
 * @zh 原生持有、每文档独立的 JavaScript 宿主，使用 Node vm.Script。
 * @ja Node vm.Script を使う、ネイティブ所有の文書別 JavaScript ホストです。
 * @ko Node vm.Script를 사용하는 네이티브 소유 문서별 JavaScript 호스트입니다.
 * @remarks
 * Configure a Context before loading documents. RmlUi executes head scripts
 * in resource order when head closes, before body parsing. Each loaded
 * document retains its selected host even when the Context changes hosts.
 * A VM context is not a security boundary. Only trusted sources may be enabled.
 * document/context have checked native lifetimes; event expires after dispatch.
 * @zh 加载文档前配置 Context。RmlUi 在 head 关闭时按资源顺序执行脚本，
 * 此时正文尚未解析。已加载文档保留所选宿主，不受 Context 切换影响。
 * VM 上下文不是安全边界，只能启用受信任来源。document/context 校验原生
 * 生命周期，event 在派发后失效。
 * @ja 読み込み前に Context を設定します。head が閉じる時、本文の解析前に
 * リソース順で実行します。文書は Context の切り替え後もホストを保持します。
 * VM はセキュリティ境界ではありません。信頼されたソースだけを有効にします。
 * document/context は寿命を検証し、event は送信後に失効します。
 * @ko 로드 전에 Context를 설정합니다. head가 닫힐 때 본문 파싱 전에 리소스
 * 순서로 실행합니다. 문서는 Context 변경 후에도 호스트를 유지합니다.
 * VM은 보안 경계가 아닙니다. 신뢰하는 소스만 활성화합니다.
 * document/context의 수명을 검사하며 event는 전달 후 만료됩니다.
 */
export class NodeScriptHost {
  private readonly nativeHandle: object;

  /**
   * Capture policy, globals and callbacks for the current native runtime.
   *
   * @zh 为当前原生运行时捕获策略、全局值和回调。
   * @ja 現在のネイティブランタイムのポリシー、グローバル、コールバックを取得します。
   * @ko 현재 네이티브 런타임의 정책, 전역 값, 콜백을 캡처합니다.
   * @param options - Trusted-source policy and named handlers.
   * @zh options - 受信任来源策略和命名处理器。
   * @ja options - 信頼されたソースのポリシーと名前付きハンドラー。
   * @ko options - 신뢰할 수 있는 소스 정책과 이름 있는 처리기입니다.
   */
  constructor(options: NodeScriptHostOptions = {}) {
    const allowInline = options.allowInline ?? false;
    const allowExternal = options.allowExternal ?? false;
    if (typeof allowInline !== 'boolean' ||
        typeof allowExternal !== 'boolean') {
      throw new TypeError('Script policy flags must be boolean');
    }
    const globals = { ...options.globals };
    for (const name of Object.keys(globals)) {
      if (reserved.has(name)) {
        throw new TypeError(`Reserved script global: ${name}`);
      }
    }
    const handlers = new Map(Object.entries(options.handlers ?? {}));
    for (const [ name, callback ] of handlers) {
      if (!name || typeof callback !== 'function') {
        throw new TypeError('Expected named script handler functions');
      }
    }
    const sessions = new WeakMap<
    DocumentNativeHandle, WeakRef<ScriptSession>
    >();
    const sessionFor = (
      handle: DocumentNativeHandle, contextHandle?: ContextNativeHandle,
    ): ScriptSession => {
      const previous = sessions.get(handle)?.deref();
      if (previous) {
        return previous;
      }
      const document = new Document(handle);
      const context = contextHandle ? new Context(contextHandle) :
        document.getContext();
      if (!context) {
        throw new Error('Script document has no live Context');
      }
      const sandbox: Record<string, unknown> = { ...globals };
      Object.defineProperties(sandbox, {
        document: { value: document, enumerable: true },
        context: { value: context, enumerable: true },
      });
      const vm = createContext(sandbox, { microtaskMode: 'afterEvaluate' });
      const session = { document, context, globals: sandbox, vm };
      sessions.set(handle, new WeakRef(session));
      return session;
    };
    const execute = (
      handle: DocumentNativeHandle, context: ContextNativeHandle,
      content: string, source: string, line: number, external: boolean,
    ): object => {
      if (external ? !allowExternal : !allowInline) {
        throw new Error(`${external ? 'External' : 'Inline'} scripts disabled`);
      }
      const session = sessionFor(handle, context);
      const script = new Script(content, {
        filename: source || '[document script]',
        lineOffset: Math.max(0, line - 1),
      });
      requireSynchronous(script.runInContext(session.vm));
      return session;
    };
    const resolveHandler = (
      handle: DocumentNativeHandle, name: string,
    ): { session: object; callback: (data: NativeRmlEvent) => unknown } => {
      const session = sessionFor(handle);
      const named = handlers.get(name);
      if (!named && !allowInline) {
        throw new Error(`Unknown named script handler: ${name}`);
      }
      const script = named ? null : new Script(
        /^[A-Za-z_$][\w$]*$/.test(name) ? `${name}(event)` : name,
        { filename: session.document.sourceURL || '[document handler]' },
      );
      const callback = (data: NativeRmlEvent): unknown => {
        // Factory listeners can be manually moved to another element. The
        // original script document must still be live before calling user code.
        session.document.getContext();
        void session.context.name;
        const event = new RmlEvent(data);
        const previousEvent = session.globals.event;
        const previousElement = session.globals.element;
        session.globals.event = event;
        session.globals.element = event.currentTarget;
        try {
          if (named) {
            return requireSynchronous(named(
              event, session.document, session.context,
            ));
          }
          return requireSynchronous(script!.runInContext(session.vm));
        } finally {
          session.globals.event = previousEvent;
          session.globals.element = previousElement;
        }
      };
      return { session, callback };
    };
    this.nativeHandle = native.createDocumentScriptHost(
      execute, resolveHandler, allowInline, allowExternal,
    );
    handles.set(this, this.nativeHandle);
  }
}

/**
 * Validate a nominal script host and return its private Native handle.
 *
 * @zh 校验名义脚本宿主并返回其私有原生句柄。
 * @ja 名前的なスクリプトホストを検証し、非公開ネイティブハンドルを返します。
 * @ko 명목상 스크립트 호스트를 검증하고 비공개 네이티브 핸들을 반환합니다.
 * @param host - Host captured by this module.
 * @zh host - 本模块捕获的宿主。
 * @ja host - このモジュールが取得したホスト。
 * @ko host - 이 모듈에서 캡처한 호스트입니다.
 * @returns Checked native handle.
 * @zh 校验后的原生句柄。
 * @ja 検証済みネイティブハンドル。
 * @ko 검증된 네이티브 핸들입니다.
 * @internal
 */
export function scriptHostHandle(
  host: NodeScriptHost | LuaScriptHost,
): object {
  const handle = handles.get(host as NodeScriptHost) ??
    luaScriptHostHandle(host);
  if (!handle) {
    throw new TypeError('Expected a document script host');
  }
  return handle;
}
