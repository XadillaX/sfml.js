import { native } from '../internal/native';

const filters = new WeakMap<CompiledFilter, object>();
const shaders = new WeakMap<CompiledShader, object>();
const lists = new WeakMap<FilterHandleList, object>();

/**
 * Owned Rml::CompiledFilter with automatic native release.
 *
 * @zh 自动释放原生资源的自有 Rml::CompiledFilter。
 * @ja 自動解放される所有 Rml::CompiledFilter。
 * @ko 자동 해제되는 소유 Rml::CompiledFilter입니다.
 * @remarks
 * Compilation creates one unique resource. Lists retain native ownership
 * after wrapper GC. Explicit release empties that resource for every alias.
 * Shutdown or removal of its unused manager invalidates the token.
 * Returning it from a Filter callback transfers ownership and empties this
 * wrapper; transferring the same token a second time throws.
 * @zh 编译创建唯一资源；包装器回收后列表仍保留原生所有权。
 * 显式释放使所有别名引用的资源变空。关闭运行时或移除闲置管理器会使令牌失效。
 * 从 Filter 回调返回会转移所有权并清空包装器；再次转移同一令牌会抛错。
 * @ja コンパイルで一意のリソースを作成します。ラッパー回収後もリストが所有します。
 * 明示解放はすべての別名に反映され、終了や未使用管理器の削除で無効になります。
 * Filter コールバックの返却で所有権を移し、空になります。再転送は例外になります。
 * @ko 컴파일은 고유 리소스를 생성하며 래퍼 회수 후에도 목록이 소유합니다.
 * 명시적 해제는 모든 별칭에 적용되고 종료나 미사용 관리자 제거 시 무효화됩니다.
 * Filter 콜백 반환은 소유권을 이전하고 래퍼를 비우며 같은 토큰의 재이전은 거부합니다.
 */
export class CompiledFilter {
  /** @internal */
  private declare readonly compiledFilterBrand: void;

  /**
   * Construct an empty native filter, representing compilation failure.
   *
   * @zh 构造空原生滤镜，用于表示编译失败。
   * @ja コンパイル失敗を表す空のネイティブフィルターを作成します。
   * @ko 컴파일 실패를 나타내는 빈 네이티브 필터를 생성합니다.
   */
  constructor() {
    filters.set(this, native.createCompiledFilter());
  }

  /**
   * Native invalid-handle sentinel; never an address to dereference.
   *
   * @zh 原生无效句柄哨兵值，不是可解引用的地址。
   * @ja ネイティブ無効ハンドル値。参照できるアドレスではありません。
   * @ko 네이티브 무효 핸들 값이며 역참조할 주소가 아닙니다.
   * @returns Zero, from Rml::CompiledFilter::InvalidHandle.
   * @zh Rml::CompiledFilter::InvalidHandle 返回的零。
   * @ja Rml::CompiledFilter::InvalidHandle のゼロ値。
   * @ko Rml::CompiledFilter::InvalidHandle의 0 값입니다.
   */
  static invalidHandle(): 0n {
    return 0n;
  }

  /**
   * Native boolean conversion; false for empty or explicitly released data.
   *
   * @zh 原生布尔转换；空资源或显式释放后的资源为 false。
   * @ja ネイティブの bool 変換。空または明示解放済みなら false。
   * @ko 네이티브 bool 변환이며 비어 있거나 명시적으로 해제되면 false입니다.
   * @returns Resource presence; stale runtime/manager tokens throw.
   * @zh 是否存在资源；过期的运行时或管理器令牌会抛错。
   * @ja リソースの有無。古いランタイムや管理器のトークンは例外になります。
   * @ko 리소스 존재 여부이며 오래된 런타임이나 관리자 토큰은 예외를 던집니다.
   */
  get isValid(): boolean {
    return native.compiledFilterIsValid(compiledFilterHandle(this));
  }

  /**
   * Append a valid filter through Rml::CompiledFilter::AddHandleTo semantics.
   *
   * @zh 按 Rml::CompiledFilter::AddHandleTo 语义追加有效滤镜。
   * @ja Rml::CompiledFilter::AddHandleTo の規則で有効フィルターを追加します。
   * @ko Rml::CompiledFilter::AddHandleTo 규칙으로 유효한 필터를 추가합니다.
   * @param list - Ordered native ownership list; duplicates are retained.
   * @zh list - 有序原生所有权列表，保留重复项。
   * @ja list - 順序付きのネイティブ所有リスト。重複を保持します。
   * @ko list - 순서가 있는 네이티브 소유 목록이며 중복을 유지합니다.
   */
  addHandleTo(list: FilterHandleList): void {
    native.appendCompiledFilter(
      compiledFilterHandle(this), filterHandleListHandle(list));
  }

  /**
   * Invoke Rml::CompiledFilter::Release; repeated calls are harmless.
   *
   * @zh 调用 Rml::CompiledFilter::Release，重复调用无副作用。
   * @ja Rml::CompiledFilter::Release を呼びます。繰り返し呼べます。
   * @ko Rml::CompiledFilter::Release를 호출하며 반복 호출할 수 있습니다.
   */
  release(): void {
    native.releaseCompiledFilter(compiledFilterHandle(this));
  }
}

/**
 * Owned Rml::CompiledShader; shares the compiled filter lifetime rules.
 *
 * @zh 自有 Rml::CompiledShader，遵循编译滤镜的生命周期规则。
 * @ja コンパイル済みフィルターと同じ寿命規則を持つ所有 Rml::CompiledShader。
 * @ko 컴파일된 필터와 동일한 수명 규칙을 따르는 소유 Rml::CompiledShader입니다.
 */
export class CompiledShader {
  /** @internal */
  private declare readonly compiledShaderBrand: void;

  /**
   * Construct an empty native shader, representing compilation failure.
   *
   * @zh 构造空原生着色器，用于表示编译失败。
   * @ja コンパイル失敗を表す空のネイティブシェーダーを作成します。
   * @ko 컴파일 실패를 나타내는 빈 네이티브 셰이더를 생성합니다.
   */
  constructor() {
    shaders.set(this, native.createCompiledShader());
  }

  /**
   * Read the Rml::CompiledShader::InvalidHandle sentinel.
   *
   * @zh 读取 Rml::CompiledShader::InvalidHandle 哨兵值。
   * @ja Rml::CompiledShader::InvalidHandle の値を取得します。
   * @ko Rml::CompiledShader::InvalidHandle 값을 가져옵니다.
   * @returns Zero, never a dereferenceable address.
   * @zh 零，不是可解引用的地址。
   * @ja ゼロ。参照可能なアドレスではありません。
   * @ko 0이며 역참조할 주소가 아닙니다.
   */
  static invalidHandle(): 0n {
    return 0n;
  }

  /**
   * Native boolean conversion of the compiled shader.
   *
   * @zh 编译着色器的原生布尔转换。
   * @ja コンパイル済みシェーダーのネイティブ bool 変換。
   * @ko 컴파일된 셰이더의 네이티브 bool 변환입니다.
   * @returns False for empty/released resources; stale tokens throw.
   * @zh 空资源或已释放资源为 false；过期令牌会抛错。
   * @ja 空や解放済みなら false。古いトークンは例外になります。
   * @ko 비어 있거나 해제되면 false이며 오래된 토큰은 예외를 던집니다.
   */
  get isValid(): boolean {
    return native.compiledShaderIsValid(compiledShaderHandle(this));
  }

  /**
   * Invoke Rml::CompiledShader::Release; repeated calls are harmless.
   *
   * @zh 调用 Rml::CompiledShader::Release，重复调用无副作用。
   * @ja Rml::CompiledShader::Release を呼びます。繰り返し呼べます。
   * @ko Rml::CompiledShader::Release를 호출하며 반복 호출할 수 있습니다.
   */
  release(): void {
    native.releaseCompiledShader(compiledShaderHandle(this));
  }
}

/**
 * Rml::FilterHandleList adapter retaining its compiled resources.
 *
 * @zh 保留编译资源所有权的 Rml::FilterHandleList 适配器。
 * @ja コンパイル済みリソースを保持する Rml::FilterHandleList アダプター。
 * @ko 컴파일된 리소스를 유지하는 Rml::FilterHandleList 어댑터입니다.
 * @remarks
 * Entries preserve insertion order, including duplicates and released tokens.
 * Raw pointer values are never exposed. Clear or collect the list to release
 * its ownership; runtime shutdown invalidates it.
 * @zh 条目保留插入顺序，包括重复项和已释放令牌。不暴露原始指针值。
 * 清空或回收列表可释放其所有权；运行时关闭使列表失效。
 * @ja 重複と解放済みトークンを含め挿入順を保持します。生ポインターは公開しません。
 * クリアや回収で所有権を解放します。ランタイム終了で無効になります。
 * @ko 중복과 해제된 토큰을 포함하여 삽입 순서를 유지하며 포인터를 노출하지 않습니다.
 * 비우거나 회수하면 소유권을 해제하며 런타임 종료 시 무효화됩니다.
 */
export class FilterHandleList {
  /** @internal */
  private declare readonly filterHandleListBrand: void;

  /**
   * Construct an empty list in the owning runtime.
   *
   * @zh 在所属运行时中构造空列表。
   * @ja 所有ランタイム内で空のリストを作成します。
   * @ko 소유 런타임에서 빈 목록을 생성합니다.
   */
  constructor() {
    lists.set(this, native.createFilterHandleList());
  }

  /**
   * Number of appended native entries.
   *
   * @zh 已追加的原生条目数。
   * @ja 追加されたネイティブ要素数。
   * @ko 추가된 네이티브 항목 수입니다.
   * @returns List size, including duplicate and explicitly released entries.
   * @zh 列表大小，包含重复项和显式释放的条目。
   * @ja 重複や明示解放済み要素を含むリストサイズ。
   * @ko 중복과 명시적으로 해제된 항목을 포함한 목록 크기입니다.
   */
  get size(): number {
    return native.filterHandleListSize(filterHandleListHandle(this));
  }

  /**
   * Clear entries and release the list's native resource ownership.
   *
   * @zh 清空条目并释放列表持有的原生资源所有权。
   * @ja 要素をクリアし、リストのネイティブリソース所有権を解放します。
   * @ko 항목을 비우고 목록의 네이티브 리소스 소유권을 해제합니다.
   */
  clear(): void {
    native.clearFilterHandleList(filterHandleListHandle(this));
  }
}

/**
 * Resolve a compiled filter token.
 *
 * @internal
 * @param value - Public resource.
 * @returns Checked token.
 */
export function compiledFilterHandle(value: CompiledFilter): object {
  const result = filters.get(value);
  if (!result) {
    throw new TypeError('Expected a compiled filter');
  }
  return result;
}

/**
 * Resolve a compiled shader token.
 *
 * @internal
 * @param value - Public resource.
 * @returns Checked token.
 */
export function compiledShaderHandle(value: CompiledShader): object {
  const result = shaders.get(value);
  if (!result) {
    throw new TypeError('Expected a compiled shader');
  }
  return result;
}

/**
 * Resolve a filter list token.
 *
 * @internal
 * @param value - Public list.
 * @returns Checked token.
 */
export function filterHandleListHandle(value: FilterHandleList): object {
  const result = lists.get(value);
  if (!result) {
    throw new TypeError('Expected a filter handle list');
  }
  return result;
}

/**
 * Wrap unique native filter ownership.
 *
 * @internal
 * @param handle - Native owner.
 * @returns Public resource.
 */
export function compiledFilterFromNative(handle: object): CompiledFilter {
  const result = Object.create(CompiledFilter.prototype) as CompiledFilter;
  filters.set(result, handle);
  return result;
}

/**
 * Wrap unique native shader ownership.
 *
 * @internal
 * @param handle - Native owner.
 * @returns Public resource.
 */
export function compiledShaderFromNative(handle: object): CompiledShader {
  const result = Object.create(CompiledShader.prototype) as CompiledShader;
  shaders.set(result, handle);
  return result;
}
