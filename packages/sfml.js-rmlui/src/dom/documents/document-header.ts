import { native } from '../../internal/native';

const headers = new WeakMap<DocumentHeader, object>();

/**
 * Owned snapshot of Rml::DocumentHeader::Resource.
 *
 * @zh Rml::DocumentHeader::Resource 的独立快照。
 * @ja Rml::DocumentHeader::Resource の独立したスナップショット。
 * @ko Rml::DocumentHeader::Resource의 독립 스냅샷입니다.
 */
export interface DocumentHeaderResource {
  /**
   * Inline content origin or external resource path; defaults to empty.
   *
   * @zh 内联内容来源或外部资源路径，默认空字符串。
   * @ja インライン内容の出典または外部資源のパス。既定値は空文字列。
   * @ko 인라인 내용 출처 또는 외부 리소스 경로이며 기본값은 빈 문자열입니다.
   */
  path: string;

  /**
   * Inline resource text; defaults to empty.
   *
   * @zh 内联资源文本，默认空字符串。
   * @ja インライン資源のテキスト。既定値は空文字列。
   * @ko 인라인 리소스 텍스트이며 기본값은 빈 문자열입니다.
   */
  content: string;

  /**
   * Whether content is inline; native is_inline defaults to false.
   *
   * @zh 内容是否内联；原生 is_inline 默认 false。
   * @ja インライン内容かどうか。ネイティブ is_inline の既定値は false。
   * @ko 인라인 여부이며 네이티브 is_inline의 기본값은 false입니다.
   */
  isInline: boolean;

  /**
   * Native int32 line offset for inline text; defaults to zero.
   *
   * @zh 内联文本的原生 int32 行偏移，默认零。
   * @ja インラインテキストのネイティブ int32 行オフセット。既定値はゼロ。
   * @ko 인라인 텍스트의 네이티브 int32 행 오프셋이며 기본값은 0입니다.
   */
  line: number;
}

/**
 * Resource input with upstream defaults for omitted fields.
 *
 * @zh 省略字段使用上游默认值的资源输入。
 * @ja 省略フィールドに上流の既定値を使う資源入力。
 * @ko 생략한 필드에 원본 기본값을 사용하는 리소스 입력입니다.
 */
export type DocumentHeaderResourceInit = Partial<DocumentHeaderResource>;

/**
 * Complete independent copy of native document-header storage.
 *
 * @zh 原生文档头存储的完整独立副本。
 * @ja ネイティブ文書ヘッダー保存領域の完全な独立コピー。
 * @ko 네이티브 문서 헤더 저장소의 완전한 독립 사본입니다.
 */
export interface DocumentHeaderSnapshot {
  /**
   * Document source path, used as the base for template paths.
   *
   * @zh 文档源路径，用于解析模板相对路径。
   * @ja テンプレートの相対パスの基準となる文書ソースパス。
   * @ko 템플릿 상대 경로의 기준이 되는 문서 소스 경로입니다.
   */
  source: string;

  /**
   * Document title.
   *
   * @zh 文档标题。
   * @ja 文書タイトル。
   * @ko 문서 제목입니다.
   */
  title: string;

  /**
   * Ordered native template_resources paths.
   *
   * @zh 有序的原生 template_resources 路径。
   * @ja 順序付きネイティブ template_resources パス。
   * @ko 순서가 있는 네이티브 template_resources 경로입니다.
   */
  templateResources: string[];

  /**
   * Ordered inline and external RCSS resources.
   *
   * @zh 有序的内联与外部 RCSS 资源。
   * @ja 順序付きインラインおよび外部 RCSS 資源。
   * @ko 순서가 있는 인라인 및 외부 RCSS 리소스입니다.
   */
  rcss: DocumentHeaderResource[];

  /**
   * Ordered inline and external script resources.
   *
   * @zh 有序的内联与外部脚本资源。
   * @ja 順序付きインラインおよび外部スクリプト資源。
   * @ko 순서가 있는 인라인 및 외부 스크립트 리소스입니다.
   */
  scripts: DocumentHeaderResource[];
}

/**
 * Header input with empty strings/lists and native resource defaults.
 *
 * @zh 文档头输入，省略项使用空字符串、空列表及原生资源默认值。
 * @ja 空文字列・空リスト・ネイティブ資源の既定値を使うヘッダー入力。
 * @ko 빈 문자열, 빈 목록 및 네이티브 리소스 기본값을 사용하는 헤더 입력입니다.
 */
export interface DocumentHeaderInit {
  /**
   * Document source.
   *
   * @zh 文档来源。
   * @ja 文書ソース。
   * @ko 문서 소스입니다.
   */
  source?: string;

  /**
   * Document title.
   *
   * @zh 文档标题。
   * @ja 文書タイトル。
   * @ko 문서 제목입니다.
   */
  title?: string;

  /**
   * Template paths to copy.
   *
   * @zh 待复制的模板路径。
   * @ja コピーするテンプレートパス。
   * @ko 복사할 템플릿 경로입니다.
   */
  templateResources?: readonly string[];

  /**
   * RCSS resources to copy.
   *
   * @zh 待复制的 RCSS 资源。
   * @ja コピーする RCSS 資源。
   * @ko 복사할 RCSS 리소스입니다.
   */
  rcss?: readonly DocumentHeaderResourceInit[];

  /**
   * Script resources to copy.
   *
   * @zh 待复制的脚本资源。
   * @ja コピーするスクリプト資源。
   * @ko 복사할 스크립트 리소스입니다.
   */
  scripts?: readonly DocumentHeaderResourceInit[];
}

/**
 * Resolve the authentic native document-header token.
 *
 * @internal
 * @param value - Header facade.
 * @returns Checked token.
 */
export function documentHeaderHandle(value: DocumentHeader): object {
  const handle = headers.get(value);
  if (!handle) {
    throw new TypeError('Expected a DocumentHeader');
  }
  return handle;
}

/**
 * Native-owned Rml::DocumentHeader for document parsing and resource merging.
 *
 * @zh 用于文档解析及资源合并的原生 Rml::DocumentHeader。
 * @ja 文書解析と資源結合用のネイティブ所有 Rml::DocumentHeader。
 * @ko 문서 해석과 리소스 병합용 네이티브 소유 Rml::DocumentHeader입니다.
 * @remarks
 * Inputs and outputs are independent copies. replace transfers all fields in
 * one native entry. merge operations execute upstream code; mergePaths and
 * mergeResources return the modified target copy. Shutdown invalidates the
 * header. A header records script resources; their execution needs a script
 * host, since Core's base document script hooks are empty.
 * @zh 输入与输出均为独立副本。replace 通过一次原生调用替换全部字段。
 * 合并操作执行上游代码；mergePaths、mergeResources 返回合并后的目标副本。
 * 关闭运行时使文档头失效。脚本执行需要脚本宿主，Core 基类的脚本钩子为空。
 * @ja 入出力は独立コピーです。replace は一回の呼び出しで全フィールドを更新します。
 * 結合は上流コードで行い、mergePaths と mergeResources は対象コピーを返します。
 * 終了時に無効化します。Core 基底クラスのフックは空で、実行にはスクリプトホストが必要です。
 * @ko 입력과 출력은 독립 사본입니다. replace는 한 번의 호출로 모든 필드를 바꿉니다.
 * 원본 코드로 병합하며 mergePaths와 mergeResources는 대상 사본을 반환합니다.
 * 종료 시 무효화합니다. Core 기본 훅은 비어 있어 스크립트 실행에는 호스트가 필요합니다.
 */
export class DocumentHeader {
  /**
   * Allocate native header storage in the active runtime.
   *
   * @zh 在当前运行时分配原生文档头存储。
   * @ja 現在のランタイムでネイティブヘッダー領域を割り当てます。
   * @ko 현재 런타임에서 네이티브 헤더 저장소를 할당합니다.
   * @param input - Fields to copy; omitted fields use native defaults.
   * @zh input - 待复制字段；省略字段采用原生默认值。
   * @ja input - コピーするフィールド。省略時はネイティブ既定値を使います。
   * @ko input - 복사할 필드이며 생략하면 네이티브 기본값을 사용합니다.
   */
  constructor(input: DocumentHeaderInit = {}) {
    headers.set(this, native.createDocumentHeader(input));
  }

  /**
   * Copy all native fields in one call.
   *
   * @zh 一次调用复制全部原生字段。
   * @ja 一回の呼び出しで全ネイティブフィールドをコピーします。
   * @ko 한 번의 호출로 모든 네이티브 필드를 복사합니다.
   * @returns Independent complete snapshot.
   * @zh 返回完整独立快照。
   * @ja 完全な独立スナップショットを返します。
   * @ko 완전한 독립 스냅샷을 반환합니다.
   */
  snapshot(): DocumentHeaderSnapshot {
    return native.documentHeaderSnapshot(documentHeaderHandle(this));
  }

  /**
   * Atomically replace all fields after input validation.
   *
   * @zh 校验输入后原子替换全部字段。
   * @ja 入力検証後に全フィールドを一括置換します。
   * @ko 입력 검증 후 모든 필드를 원자적으로 교체합니다.
   * @param input - Complete replacement; omitted fields reset to defaults.
   * @zh input - 全量替换输入，省略字段恢复默认值。
   * @ja input - 全置換入力。省略フィールドは既定値に戻ります。
   * @ko input - 전체 교체 입력이며 생략한 필드는 기본값으로 돌아갑니다.
   */
  replace(input: DocumentHeaderInit): void {
    native.replaceDocumentHeader(documentHeaderHandle(this), input);
  }

  /**
   * Native document source.
   *
   * @zh 原生文档来源。
   * @ja ネイティブ文書ソース。
   * @ko 네이티브 문서 소스입니다.
   * @returns Stored source path.
   * @zh 返回保存的源路径。
   * @ja 保存したソースパスを返します。
   * @ko 저장한 소스 경로를 반환합니다.
   */
  get source(): string {
    return native.documentHeaderGetSource(documentHeaderHandle(this));
  }

  /**
   * Replace the native source path.
   *
   * @zh 替换原生来源路径。
   * @ja ネイティブソースパスを置換します。
   * @ko 네이티브 소스 경로를 교체합니다.
   * @param value - Source path without null bytes.
   * @zh value - 不含空字节的来源路径。
   * @ja value - NUL バイトを含まないソースパス。
   * @ko value - 널 바이트가 없는 소스 경로입니다.
   */
  set source(value: string) {
    native.documentHeaderSetSource(documentHeaderHandle(this), value);
  }

  /**
   * Native header title.
   *
   * @zh 原生文档头标题。
   * @ja ネイティブヘッダータイトル。
   * @ko 네이티브 헤더 제목입니다.
   * @returns Stored title.
   * @zh 返回保存的标题。
   * @ja 保存したタイトルを返します。
   * @ko 저장한 제목을 반환합니다.
   */
  get title(): string {
    return native.documentHeaderGetTitle(documentHeaderHandle(this));
  }

  /**
   * Replace the native header title.
   *
   * @zh 替换原生文档头标题。
   * @ja ネイティブヘッダータイトルを置換します。
   * @ko 네이티브 헤더 제목을 교체합니다.
   * @param value - Title to copy.
   * @zh value - 待复制标题。
   * @ja value - コピーするタイトル。
   * @ko value - 복사할 제목입니다.
   */
  set title(value: string) {
    native.documentHeaderSetTitle(documentHeaderHandle(this), value);
  }

  /**
   * Copy native template_resources.
   *
   * @zh 复制原生 template_resources。
   * @ja ネイティブ template_resources をコピーします。
   * @ko 네이티브 template_resources를 복사합니다.
   * @returns Independent path list in source order.
   * @zh 返回按来源顺序排列的独立路径列表。
   * @ja ソース順の独立パスリストを返します。
   * @ko 소스 순서의 독립 경로 목록을 반환합니다.
   */
  get templateResources(): string[] {
    return native.documentHeaderGetTemplates(documentHeaderHandle(this));
  }

  /**
   * Replace native template_resources.
   *
   * @zh 替换原生 template_resources。
   * @ja ネイティブ template_resources を置換します。
   * @ko 네이티브 template_resources를 교체합니다.
   * @param value - Paths to copy without resolving them.
   * @zh value - 待复制的路径，写入时不进行解析。
   * @ja value - 解決せずにコピーするパス。
   * @ko value - 해석하지 않고 복사할 경로입니다.
   */
  set templateResources(value: readonly string[]) {
    native.documentHeaderSetTemplates(documentHeaderHandle(this), value);
  }

  /**
   * Copy ordered native RCSS resources.
   *
   * @zh 复制有序的原生 RCSS 资源。
   * @ja 順序付きネイティブ RCSS 資源をコピーします。
   * @ko 순서가 있는 네이티브 RCSS 리소스를 복사합니다.
   * @returns Independent resource records.
   * @zh 返回独立资源记录。
   * @ja 独立資源レコードを返します。
   * @ko 독립 리소스 레코드를 반환합니다.
   */
  get rcss(): DocumentHeaderResource[] {
    return native.documentHeaderGetRcss(documentHeaderHandle(this));
  }

  /**
   * Replace all native RCSS resources in one call.
   *
   * @zh 一次调用替换全部原生 RCSS 资源。
   * @ja 一回の呼び出しで全ネイティブ RCSS 資源を置換します。
   * @ko 한 번의 호출로 모든 네이티브 RCSS 리소스를 교체합니다.
   * @param value - Ordered resources using native defaults.
   * @zh value - 有序资源，省略字段使用原生默认值。
   * @ja value - ネイティブ既定値を使う順序付き資源。
   * @ko value - 네이티브 기본값을 사용하는 순서가 있는 리소스입니다.
   */
  set rcss(value: readonly DocumentHeaderResourceInit[]) {
    native.documentHeaderSetRcss(documentHeaderHandle(this), value);
  }

  /**
   * Copy ordered native script resources.
   *
   * @zh 复制有序的原生脚本资源。
   * @ja 順序付きネイティブスクリプト資源をコピーします。
   * @ko 순서가 있는 네이티브 스크립트 리소스를 복사합니다.
   * @returns Independent resource records.
   * @zh 返回独立资源记录。
   * @ja 独立資源レコードを返します。
   * @ko 독립 리소스 레코드를 반환합니다.
   */
  get scripts(): DocumentHeaderResource[] {
    return native.documentHeaderGetScripts(documentHeaderHandle(this));
  }

  /**
   * Replace all native script resources in one call.
   *
   * @zh 一次调用替换全部原生脚本资源。
   * @ja 一回の呼び出しで全ネイティブスクリプト資源を置換します。
   * @ko 한 번의 호출로 모든 네이티브 스크립트 리소스를 교체합니다.
   * @param value - Ordered resources using native defaults.
   * @zh value - 有序资源，省略字段使用原生默认值。
   * @ja value - ネイティブ既定値を使う順序付き資源。
   * @ko value - 네이티브 기본값을 사용하는 순서가 있는 리소스입니다.
   */
  set scripts(value: readonly DocumentHeaderResourceInit[]) {
    native.documentHeaderSetScripts(documentHeaderHandle(this), value);
  }

  /**
   * Execute native MergeHeader, retaining nonempty receiver source and title.
   *
   * @zh 执行原生 MergeHeader，保留接收者已有的非空来源与标题。
   * @ja ネイティブ MergeHeader を実行し、既存の非空ソースとタイトルを保持します。
   * @ko 네이티브 MergeHeader를 실행하며 기존의 비어 있지 않은 소스와 제목을 유지합니다.
   * @param source - Native header to append; self-merge uses a snapshot.
   * @zh source - 待追加的原生文档头；自合并使用快照。
   * @ja source - 追加するネイティブヘッダー。自己結合はコピーを使います。
   * @ko source - 추가할 네이티브 헤더이며 자기 병합은 스냅샷을 사용합니다.
   */
  mergeHeader(source: DocumentHeader): void {
    native.documentHeaderMergeHeader(
      documentHeaderHandle(this), documentHeaderHandle(source));
  }

  /**
   * Execute native MergePaths on independent target and source copies.
   *
   * @zh 在独立的目标与来源副本上执行原生 MergePaths。
   * @ja 独立した対象・ソースコピーでネイティブ MergePaths を実行します。
   * @ko 독립 대상과 소스 사본에서 네이티브 MergePaths를 실행합니다.
   * @param target - Existing paths to preserve.
   * @zh target - 待保留的已有路径。
   * @ja target - 保持する既存パス。
   * @ko target - 유지할 기존 경로입니다.
   * @param source - Paths to resolve and append.
   * @zh source - 待解析并追加的路径。
   * @ja source - 解決して追加するパス。
   * @ko source - 해석 후 추가할 경로입니다.
   * @param basePath - Native source file path used by JoinPath.
   * @zh basePath - JoinPath 使用的原生来源文件路径。
   * @ja basePath - JoinPath が使うネイティブソースファイルパス。
   * @ko basePath - JoinPath가 사용하는 네이티브 소스 파일 경로입니다.
   * @returns Merged path copy; input arrays and this header stay unchanged.
   * @zh 返回合并路径副本；输入数组和本文档头保持不变。
   * @ja 結合パスのコピーを返し、入力配列とこのヘッダーは変更しません。
   * @ko 병합한 경로 사본을 반환하며 입력 배열과 이 헤더는 바뀌지 않습니다.
   */
  mergePaths(
    target: readonly string[], source: readonly string[], basePath: string,
  ): string[] {
    return native.documentHeaderMergePaths(
      documentHeaderHandle(this), target, source, basePath);
  }

  /**
   * Execute native MergeResources, preserving literal paths and list order.
   *
   * @zh 执行原生 MergeResources，保留字面路径及列表顺序。
   * @ja リテラルパスとリスト順を保ってネイティブ MergeResources を実行します。
   * @ko 경로 원문과 목록 순서를 유지하며 네이티브 MergeResources를 실행합니다.
   * @param target - Resources to preserve.
   * @zh target - 待保留的资源。
   * @ja target - 保持する資源。
   * @ko target - 유지할 리소스입니다.
   * @param source - Resources to append.
   * @zh source - 待追加的资源。
   * @ja source - 追加する資源。
   * @ko source - 추가할 리소스입니다.
   * @returns Merged resource copy; input arrays and this header stay unchanged.
   * @zh 返回合并资源副本；输入数组和本文档头保持不变。
   * @ja 結合資源のコピーを返し、入力配列とこのヘッダーは変更しません。
   * @ko 병합한 리소스 사본을 반환하며 입력 배열과 이 헤더는 바뀌지 않습니다.
   */
  mergeResources(
    target: readonly DocumentHeaderResourceInit[],
    source: readonly DocumentHeaderResourceInit[],
  ): DocumentHeaderResource[] {
    return native.documentHeaderMergeResources(
      documentHeaderHandle(this), target, source);
  }
}

/**
 * Wrap an independently owned native header without an additional entry.
 *
 * @internal
 * @param handle - Checked native header token.
 * @returns Header facade.
 */
export function documentHeaderFromNative(handle: object): DocumentHeader {
  const result = Object.create(DocumentHeader.prototype) as DocumentHeader;
  headers.set(result, handle);
  return result;
}
