import { numericProperties } from '../internal/numeric-properties';

/**
 * Compares the masked reference value with the masked stencil buffer value.
 * @zh 比较经过掩码处理的参考值与模板缓冲区值。
 * @ja マスク適用後の参照値とステンシルバッファー値を比較します。
 * @ko 마스크를 적용한 참조 값과 스텐실 버퍼 값을 비교합니다.
 */
export enum StencilComparison {
  /**
   * Never passes.
   * @zh 永不通过。
   * @ja 常に不合格。
   * @ko 항상 실패합니다.
   */
  Never,
  /**
   * Passes if the reference value is less than the buffer value.
   * @zh 参考值小于缓冲区值时通过。
   * @ja 参照値がバッファー値より小さい場合に通過します。
   * @ko 참조 값이 버퍼 값보다 작으면 통과합니다.
   */
  Less,
  /**
   * Passes if the reference value is less than or equal to the buffer value.
   * @zh 参考值小于等于缓冲区值时通过。
   * @ja 参照値がバッファー値以下の場合に通過します。
   * @ko 참조 값이 버퍼 값보다 작거나 같으면 통과합니다.
   */
  LessEqual,
  /**
   * Passes if the reference value is greater than the buffer value.
   * @zh 参考值大于缓冲区值时通过。
   * @ja 参照値がバッファー値より大きい場合に通過します。
   * @ko 참조 값이 버퍼 값보다 크면 통과합니다.
   */
  Greater,
  /**
   * Passes if the reference value is greater than or equal to the buffer value.
   * @zh 参考值大于等于缓冲区值时通过。
   * @ja 参照値がバッファー値以上の場合に通過します。
   * @ko 참조 값이 버퍼 값보다 크거나 같으면 통과합니다.
   */
  GreaterEqual,
  /**
   * Passes if equal.
   * @zh 相等时通过。
   * @ja 等しい場合に通過します。
   * @ko 같으면 통과합니다.
   */
  Equal,
  /**
   * Passes if not equal.
   * @zh 不相等时通过。
   * @ja 等しくない場合に通過します。
   * @ko 같지 않으면 통과합니다.
   */
  NotEqual,
  /**
   * Always passes.
   * @zh 始终通过。
   * @ja 常に通過します。
   * @ko 항상 통과합니다.
   */
  Always,
}

/**
 * How the stencil buffer is updated after the stencil test passes.
 * @zh 模板测试通过后对模板缓冲区的更新方式。
 * @ja ステンシルテスト通過後のステンシルバッファー更新方法。
 * @ko 스텐실 테스트 통과 후 스텐실 버퍼를 갱신하는 방식입니다.
 */
export enum StencilUpdateOperation {
  /**
   * Keeps the original value.
   * @zh 保留原值。
   * @ja 元の値を保持します。
   * @ko 기존 값을 유지합니다.
   */
  Keep,
  /**
   * Writes zero.
   * @zh 写入零。
   * @ja ゼロを書き込みます。
   * @ko 0을 씁니다.
   */
  Zero,
  /**
   * Writes the reference value.
   * @zh 写入参考值。
   * @ja 参照値を書き込みます。
   * @ko 참조 값을 씁니다.
   */
  Replace,
  /**
   * Increments by one, saturating at the maximum value.
   * @zh 加一并在最大值处饱和。
   * @ja 1 加算し、最大値で飽和します。
   * @ko 1을 더하며 최댓값에서 포화됩니다.
   */
  Increment,
  /**
   * Decrements by one, saturating at zero.
   * @zh 减一并在零处饱和。
   * @ja 1 減算し、ゼロで飽和します。
   * @ko 1을 빼며 0에서 포화됩니다.
   */
  Decrement,
  /**
   * Inverts each bit.
   * @zh 按位取反。
   * @ja ビットごとに反転します。
   * @ko 비트별로 반전합니다.
   */
  Invert,
}

/**
 * sf::StencilValue, including the signed-to-unsigned integer conversion.
 * @zh sf::StencilValue，包含有符号到无符号整数的转换。
 * @ja sf::StencilValue。符号付きから符号なしへの整数変換を含みます。
 * @ko sf::StencilValue. 부호 있는 정수에서 부호 없는 정수로의 변환을 포함합니다.
 */
export class StencilValue {
  /**
   * Stencil value stored as an unsigned 32-bit integer.
   * @zh 模板数值，按无符号 32 位整数存储。
   * @ja 符号なし 32 ビット整数として格納されるステンシル値。
   * @ko 부호 없는 32비트 정수로 저장되는 스텐실 값입니다.
   */
  declare value: number;

  /**
   * Creates a copy from a 32-bit integer or existing stencil value; negative
   * inputs convert to unsigned integers.
   * @zh 从 32 位整数或现有模板值创建副本；负输入按无符号整数转换。
   * @ja 32 ビット整数または既存のステンシル値からコピーを作成します。負の入力は符号なし整数に変換します。
   * @ko 32비트 정수 또는 기존 스텐실 값으로 복사본을 만듭니다. 음수 입력은 부호 없는 정수로 변환합니다.
   */
  constructor(value: number | Readonly<StencilValue>) {
    const input = value instanceof StencilValue ? value.value : value;
    if (!Number.isInteger(input) || typeof input !== 'number' ||
        input < -0x80000000 || input > 0xffffffff) {
      throw new RangeError('Expected a 32-bit stencil value');
    }
    numericProperties(this, {
      value: input < 0 ? input + 0x100000000 : input + 0,
    });
  }
}

/**
 * Initial stencil test settings; omitted fields use StencilMode defaults.
 * @zh 模板测试初始配置，未指定字段采用 StencilMode 默认值。
 * @ja ステンシルテストの初期設定。未指定フィールドは StencilMode の既定値を使います。
 * @ko 스텐실 테스트 초기 설정입니다. 생략한 필드는 StencilMode 기본값을 사용합니다.
 */
export interface StencilModeOptions {
  /**
   * Comparison method; defaults to Always.
   * @zh 比较方式，默认 Always。
   * @ja 比較方法。既定値は Always。
   * @ko 비교 방식입니다. 기본값은 Always입니다.
   */
  stencilComparison?: StencilComparison;
  /**
   * Update operation; defaults to Keep.
   * @zh 更新方式，默认 Keep。
   * @ja 更新操作。既定値は Keep。
   * @ko 갱신 연산입니다. 기본값은 Keep입니다.
   */
  stencilUpdateOperation?: StencilUpdateOperation;
  /**
   * Reference value for comparison and replacement; defaults to 0.
   * @zh 比较和替换使用的参考值，默认 0。
   * @ja 比較と置換に使う参照値。既定値は 0。
   * @ko 비교와 대체에 사용할 참조 값입니다. 기본값은 0입니다.
   */
  stencilReference?: number | Readonly<StencilValue>;
  /**
   * Bitmask used for comparison; defaults to 0xffffffff.
   * @zh 参与比较的位掩码，默认 0xffffffff。
   * @ja 比較に使うビットマスク。既定値は 0xffffffff。
   * @ko 비교에 사용할 비트 마스크입니다. 기본값은 0xffffffff입니다.
   */
  stencilMask?: number | Readonly<StencilValue>;
  /**
   * Whether to write only stencil, not color; defaults to false.
   * @zh 是否只写模板、不写颜色，默认 false。
   * @ja 色を書き込まずステンシルのみを書き込むか。既定値は false。
   * @ko 색상 없이 스텐실만 쓸지 여부입니다. 기본값은 false입니다.
   */
  stencilOnly?: boolean;
}

/**
 * sf::StencilMode; reference and mask are independent value copies.
 * @zh sf::StencilMode；参考值和掩码是独立的值副本。
 * @ja sf::StencilMode。参照値とマスクは独立した値のコピーです。
 * @ko sf::StencilMode. 참조 값과 마스크는 독립적인 값 복사본입니다.
 */
export class StencilMode {
  /**
   * Stencil comparison method.
   * @zh 模板比较方式。
   * @ja ステンシルの比較方法。
   * @ko 스텐실 비교 방식입니다.
   */
  declare stencilComparison: StencilComparison;
  /**
   * Update operation after the stencil test passes.
   * @zh 模板测试通过后的更新方式。
   * @ja ステンシルテスト通過後の更新操作。
   * @ko 스텐실 테스트 통과 후 갱신 연산입니다.
   */
  declare stencilUpdateOperation: StencilUpdateOperation;
  /**
   * Reference value for comparison and replacement.
   * @zh 比较和替换使用的参考值。
   * @ja 比較と置換に使う参照値。
   * @ko 비교와 대체에 사용할 참조 값입니다.
   */
  stencilReference: StencilValue;
  /**
   * Bitmask used for comparison.
   * @zh 参与比较的位掩码。
   * @ja 比較に使うビットマスク。
   * @ko 비교에 사용할 비트 마스크입니다.
   */
  stencilMask: StencilValue;
  /**
   * Writes only to the stencil buffer when true.
   * @zh 为 true 时仅写模板缓冲区。
   * @ja true の場合、ステンシルバッファーにのみ書き込みます。
   * @ko true이면 스텐실 버퍼에만 씁니다.
   */
  declare stencilOnly: boolean;

  /**
   * Copies stencil settings; reference and mask each have independent storage.
   * @zh 复制模板配置，参考值和掩码各自拥有独立存储。
   * @ja ステンシル設定をコピーします。参照値とマスクはそれぞれ独立したストレージを持ちます。
   * @ko 스텐실 설정을 복사합니다. 참조 값과 마스크는 각각 독립적인 저장 공간을 갖습니다.
   */
  constructor(source: StencilModeOptions = {}) {
    numericProperties(this, {
      stencilComparison: StencilComparison.Always,
      stencilUpdateOperation: StencilUpdateOperation.Keep, stencilOnly: false,
    });
    this.stencilComparison = source.stencilComparison ?? StencilComparison.Always;
    this.stencilUpdateOperation = source.stencilUpdateOperation ??
      StencilUpdateOperation.Keep;
    this.stencilReference = new StencilValue(source.stencilReference ?? 0);
    this.stencilMask = new StencilValue(source.stencilMask ?? 0xffffffff);
    this.stencilOnly = source.stencilOnly ?? false;
  }
}
