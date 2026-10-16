import { numericProperties } from '../internal/numeric-properties';

/** 比较经过掩码处理的参考值与模板缓冲区值。 */
export enum StencilComparison {
  /** 永不通过。 */
  Never,
  /** 参考值小于缓冲区值时通过。 */
  Less,
  /** 参考值小于等于缓冲区值时通过。 */
  LessEqual,
  /** 参考值大于缓冲区值时通过。 */
  Greater,
  /** 参考值大于等于缓冲区值时通过。 */
  GreaterEqual,
  /** 相等时通过。 */
  Equal,
  /** 不相等时通过。 */
  NotEqual,
  /** 始终通过。 */
  Always,
}

/** 模板测试通过后对模板缓冲区的更新方式。 */
export enum StencilUpdateOperation {
  /** 保留原值。 */
  Keep,
  /** 写入零。 */
  Zero,
  /** 写入参考值。 */
  Replace,
  /** 加一并在最大值处饱和。 */
  Increment,
  /** 减一并在零处饱和。 */
  Decrement,
  /** 按位取反。 */
  Invert,
}

/** sf::StencilValue, including the signed-to-unsigned integer conversion. */
export class StencilValue {
  /** 模板数值，按无符号 32 位整数存储。 */
  declare value: number;

  /** 从 32 位整数或现有模板值创建副本；负输入按无符号整数转换。 */
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

/** 模板测试初始配置，未指定字段采用 StencilMode 默认值。 */
export interface StencilModeOptions {
  /** 比较方式，默认 Always。 */
  stencilComparison?: StencilComparison;
  /** 更新方式，默认 Keep。 */
  stencilUpdateOperation?: StencilUpdateOperation;
  /** 比较和替换使用的参考值，默认 0。 */
  stencilReference?: number | Readonly<StencilValue>;
  /** 参与比较的位掩码，默认 0xffffffff。 */
  stencilMask?: number | Readonly<StencilValue>;
  /** 是否只写模板、不写颜色，默认 false。 */
  stencilOnly?: boolean;
}

/** sf::StencilMode; reference and mask are independent value copies. */
export class StencilMode {
  /** 模板比较方式。 */
  declare stencilComparison: StencilComparison;
  /** 模板测试通过后的更新方式。 */
  declare stencilUpdateOperation: StencilUpdateOperation;
  /** 比较和替换使用的参考值。 */
  stencilReference: StencilValue;
  /** 参与比较的位掩码。 */
  stencilMask: StencilValue;
  /** 为 true 时仅写模板缓冲区。 */
  declare stencilOnly: boolean;

  /** 复制模板配置，参考值和掩码各自拥有独立存储。 */
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
