import { native } from '../internal/native';
import type { FilterOverflow } from '../style/effects/filter';
import { TextureSource, textureSourceFromNative } from './texture-source';

/**
 * Pixel corners of a native Rml::Rectanglef sprite region.
 *
 * @zh 原生 Rml::Rectanglef 精灵区域的像素角点。
 * @ja ネイティブ Rml::Rectanglef スプライト領域のピクセル角座標。
 * @ko 네이티브 Rml::Rectanglef 스프라이트 영역의 픽셀 모서리 좌표입니다.
 */
export type SpriteRectangle = FilterOverflow;

/**
 * Rml::Sprite metadata copied before insertion can invalidate native pointers.
 *
 * @zh Rml::Sprite 元数据，在原生精灵插入可能使其失效前复制。
 * @ja ネイティブ挿入による無効化前にコピーした Rml::Sprite メタデータ。
 * @ko 네이티브 삽입으로 무효화되기 전에 복사한 Rml::Sprite 메타데이터입니다.
 */
export interface Sprite {
  /**
   * Rml::Sprite::rectangle, expressed by pixel corners.
   *
   * @zh Rml::Sprite::rectangle，以像素角点表示。
   * @ja ピクセルの角座標で表す Rml::Sprite::rectangle。
   * @ko 픽셀 모서리 좌표로 표현한 Rml::Sprite::rectangle입니다.
   */
  rectangle: SpriteRectangle;

  /**
   * Independent snapshot of Rml::Sprite::sprite_sheet.
   *
   * @zh Rml::Sprite::sprite_sheet 的独立快照。
   * @ja Rml::Sprite::sprite_sheet の独立したコピー。
   * @ko Rml::Sprite::sprite_sheet의 독립 사본입니다.
   */
  spriteSheet: Spritesheet;
}

/**
 * Rml::SpriteMap with sprite names as keys.
 *
 * @zh Rml::SpriteMap，以精灵名称为键。
 * @ja スプライト名をキーとする Rml::SpriteMap。
 * @ko 스프라이트 이름을 키로 사용하는 Rml::SpriteMap입니다.
 */
export type SpriteMap = Map<string, Sprite>;

/**
 * Rml::SpriteDefinitionList, ordered sprite name and pixel rectangle pairs.
 *
 * @zh Rml::SpriteDefinitionList，有序的精灵名称与像素矩形二元组。
 * @ja 名前とピクセル矩形の順序付きペア Rml::SpriteDefinitionList。
 * @ko 이름과 픽셀 사각형의 순서 있는 쌍인 Rml::SpriteDefinitionList입니다.
 */
export type SpriteDefinitionList = [ string, SpriteRectangle ][];

/**
 * Copied Rml::Spritesheet metadata with an independently owned texture source.
 *
 * @zh Rml::Spritesheet 元数据副本，包含独立持有的纹理源。
 * @ja 独立所有のテクスチャソースを持つ Rml::Spritesheet メタデータのコピー。
 * @ko 독립 소유 텍스처 소스를 가진 Rml::Spritesheet 메타데이터 사본입니다.
 */
export class Spritesheet {
  /**
   * The name declared for this spritesheet.
   *
   * @zh 原生精灵表名称。
   * @ja ネイティブスプライトシート名。
   * @ko 네이티브 스프라이트 시트 이름입니다.
   */
  name: string;

  /**
   * The source line on which the spritesheet is declared.
   *
   * @zh 精灵表声明的行号。
   * @ja スプライトシートの宣言行番号。
   * @ko 스프라이트 시트 선언의 행 번호입니다.
   */
  definitionLineNumber: number;

  /**
   * Rml::Spritesheet::display_scale, inverse of the resolution property.
   *
   * @zh Rml::Spritesheet::display_scale，即 resolution 属性的倒数。
   * @ja resolution プロパティの逆数 Rml::Spritesheet::display_scale。
   * @ko resolution 속성의 역수인 Rml::Spritesheet::display_scale입니다.
   */
  displayScale: number;

  /**
   * Independent Rml::Spritesheet::texture_source.
   *
   * @zh 独立的 Rml::Spritesheet::texture_source。
   * @ja 独立した Rml::Spritesheet::texture_source。
   * @ko 독립적인 Rml::Spritesheet::texture_source입니다.
   */
  readonly textureSource: TextureSource;

  /**
   * Construct a spritesheet record matching the native constructor.
   *
   * @zh 构造与原生构造函数对应的精灵表记录。
   * @ja ネイティブコンストラクターに対応するシートレコードを構築します。
   * @ko 네이티브 생성자에 대응하는 시트 레코드를 생성합니다.
   * @param name - Spritesheet name.
   * @zh name - 精灵表名称。
   * @ja name - シート名。
   * @ko name - 시트 이름입니다.
   * @param source - Image source.
   * @zh source - 图像源。
   * @ja source - 画像ソース。
   * @ko source - 이미지 소스입니다.
   * @param documentPath - Declaring document path.
   * @zh documentPath - 声明文档路径。
   * @ja documentPath - 宣言元ドキュメントパス。
   * @ko documentPath - 선언 문서 경로입니다.
   * @param definitionLineNumber - Native int32 source line number.
   * @zh definitionLineNumber - 原生 int32 源行号。
   * @ja definitionLineNumber - ネイティブ int32 ソース行番号。
   * @ko definitionLineNumber - 네이티브 int32 소스 행 번호입니다.
   * @param displayScale - Finite native float display scale.
   * @zh displayScale - 有限的原生 float 显示比例。
   * @ja displayScale - 有限なネイティブ float 表示倍率。
   * @ko displayScale - 유한 네이티브 float 표시 배율입니다.
   */
  constructor(
    name: string, source: string, documentPath: string,
    definitionLineNumber: number, displayScale: number,
  ) {
    if (typeof name !== 'string') {
      throw new TypeError('Expected a spritesheet name');
    }
    if (!Number.isInteger(definitionLineNumber) ||
        definitionLineNumber < -2147483648 ||
        definitionLineNumber > 2147483647) {
      throw new RangeError('Expected an int32 definition line number');
    }
    if (typeof displayScale !== 'number' ||
        !Number.isFinite(Math.fround(displayScale))) {
      throw new RangeError('Expected a finite display scale');
    }
    this.textureSource = new TextureSource(source, documentPath);
    this.name = name;
    this.definitionLineNumber = definitionLineNumber;
    this.displayScale = Math.fround(displayScale);
  }
}

/**
 * Native sprite snapshot transport.
 *
 * @internal
 */
export interface NativeSprite {
  rectangle: SpriteRectangle;
  spriteSheet: {
    name: string;
    definitionLineNumber: number;
    displayScale: number;
    textureSource: object;
  };
}

/**
 * Adopt a native snapshot and its independent texture source.
 *
 * @internal
 * @param value - Native snapshot or absent sprite.
 * @returns Public copied metadata.
 */
export function spriteFromNative(value: NativeSprite | null): Sprite | null {
  if (!value) {
    return null;
  }
  const spriteSheet = Object.assign(Object.create(Spritesheet.prototype), {
    ...value.spriteSheet,
    textureSource: textureSourceFromNative(value.spriteSheet.textureSource),
  }) as Spritesheet;
  return { rectangle: value.rectangle, spriteSheet };
}

const lists = new WeakMap<SpritesheetList, object>();

/**
 * Resolve an owned spritesheet collection.
 *
 * @internal
 * @param list - Public list.
 * @returns Native handle.
 */
function listHandle(list: SpritesheetList): object {
  const handle = lists.get(list);
  if (!handle) {
    throw new TypeError('Expected a SpritesheetList');
  }
  return handle;
}

/**
 * Owned Rml::SpritesheetList preserving native overwrite and merge behavior.
 *
 * @zh 自有 Rml::SpritesheetList，保留原生覆盖与合并行为。
 * @ja ネイティブの上書きとマージ動作を保つ所有 Rml::SpritesheetList。
 * @ko 네이티브 덮어쓰기와 병합 동작을 유지하는 소유 Rml::SpritesheetList입니다.
 */
export class SpritesheetList {
  /**
   * Construct an empty native spritesheet collection.
   *
   * @zh 构造空原生精灵表集合。
   * @ja 空のネイティブシートコレクションを構築します。
   * @ko 빈 네이티브 시트 모음을 생성합니다.
   */
  constructor() {
    lists.set(this, native.createSpritesheetList());
  }

  /**
   * Invoke Rml::SpritesheetList::AddSpriteSheet.
   *
   * @zh 调用 Rml::SpritesheetList::AddSpriteSheet。
   * @ja Rml::SpritesheetList::AddSpriteSheet を呼びます。
   * @ko Rml::SpritesheetList::AddSpriteSheet를 호출합니다.
   * @param name - Spritesheet name.
   * @zh name - 精灵表名称。
   * @ja name - シート名。
   * @ko name - 시트 이름입니다.
   * @param imageSource - Image filename.
   * @zh imageSource - 图像文件名。
   * @ja imageSource - 画像ファイル名。
   * @ko imageSource - 이미지 파일 이름입니다.
   * @param definitionSource - Declaring document path.
   * @zh definitionSource - 声明文档路径。
   * @ja definitionSource - 宣言元ドキュメントパス。
   * @ko definitionSource - 선언 문서 경로입니다.
   * @param definitionLineNumber - Native int32 source line number.
   * @zh definitionLineNumber - 原生 int32 源行号。
   * @ja definitionLineNumber - ネイティブ int32 ソース行番号。
   * @ko definitionLineNumber - 네이티브 int32 소스 행 번호입니다.
   * @param displayScale - Finite native float display scale.
   * @zh displayScale - 有限的原生 float 显示比例。
   * @ja displayScale - 有限なネイティブ float 表示倍率。
   * @ko displayScale - 유한 네이티브 float 표시 배율입니다.
   * @param definitions - Ordered name and rectangle pairs, copied on insertion.
   * @zh definitions - 有序名称与矩形二元组，插入时复制。
   * @ja definitions - 挿入時にコピーする名前と矩形の順序付きペア。
   * @ko definitions - 삽입 시 복사하는 이름과 사각형의 순서 있는 쌍입니다.
   * @returns Native success flag; duplicate sprite names overwrite prior ones.
   * @zh 原生成功标志；重名精灵覆盖已有条目。
   * @ja ネイティブ成功フラグ。同名スプライトは既存項目を上書きします。
   * @ko 네이티브 성공 표시이며 같은 이름의 스프라이트는 기존 항목을 덮어씁니다.
   */
  addSpriteSheet(
    name: string, imageSource: string, definitionSource: string,
    definitionLineNumber: number, displayScale: number,
    definitions: SpriteDefinitionList,
  ): boolean {
    return native.spritesheetListAdd(listHandle(this), name, imageSource,
      definitionSource, definitionLineNumber, displayScale, definitions);
  }

  /**
   * Copy Rml::SpritesheetList::GetSprite metadata.
   *
   * @zh 复制 Rml::SpritesheetList::GetSprite 元数据。
   * @ja Rml::SpritesheetList::GetSprite のメタデータをコピーします。
   * @ko Rml::SpritesheetList::GetSprite 메타데이터를 복사합니다.
   * @param name - Sprite name.
   * @zh name - 精灵名称。
   * @ja name - スプライト名。
   * @ko name - 스프라이트 이름입니다.
   * @returns Independent snapshot, or null if missing.
   * @zh 独立快照；不存在时返回 null。
   * @ja 独立したコピー。存在しない場合は null。
   * @ko 독립 사본이며 없으면 null입니다.
   */
  getSprite(name: string): Sprite | null {
    return spriteFromNative(native.spritesheetListGetSprite(
      listHandle(this), name));
  }

  /**
   * Invoke Rml::SpritesheetList::Merge, appending sheets and overwriting names.
   *
   * @zh 调用 Rml::SpritesheetList::Merge，追加精灵表并覆盖重名精灵。
   * @ja シートを追加し同名項目を上書きする Rml::SpritesheetList::Merge。
   * @ko 시트를 추가하고 같은 이름을 덮어쓰는 Rml::SpritesheetList::Merge입니다.
   * @param other - Source list; self-merge uses a snapshot.
   * @zh other - 源列表；自合并使用快照。
   * @ja other - 元リスト。自己マージにはコピーを使います。
   * @ko other - 원본 목록이며 자기 병합에는 사본을 사용합니다.
   */
  merge(other: SpritesheetList): void {
    native.spritesheetListMerge(listHandle(this), listHandle(other));
  }

  /**
   * Invoke Rml::SpritesheetList::Reserve without changing counts.
   *
   * @zh 调用 Rml::SpritesheetList::Reserve，不改变条目数量。
   * @ja 件数を変えずに Rml::SpritesheetList::Reserve を呼びます。
   * @ko 개수를 변경하지 않고 Rml::SpritesheetList::Reserve를 호출합니다.
   * @param spriteSheets - Nonnegative sheet capacity.
   * @zh spriteSheets - 非负的精灵表容量。
   * @ja spriteSheets - 非負のシート容量。
   * @ko spriteSheets - 음이 아닌 시트 용량입니다.
   * @param sprites - Nonnegative sprite capacity.
   * @zh sprites - 非负的精灵容量。
   * @ja sprites - 非負のスプライト容量。
   * @ko sprites - 음이 아닌 스프라이트 용량입니다.
   */
  reserve(spriteSheets: number, sprites: number): void {
    native.spritesheetListReserve(listHandle(this), spriteSheets, sprites);
  }

  /**
   * Invoke Rml::SpritesheetList::NumSpriteSheets.
   *
   * @zh 调用 Rml::SpritesheetList::NumSpriteSheets。
   * @ja Rml::SpritesheetList::NumSpriteSheets を呼びます。
   * @ko Rml::SpritesheetList::NumSpriteSheets를 호출합니다.
   * @returns Sheet count, including overwritten sheets.
   * @zh 精灵表数量，包括精灵被覆盖的表。
   * @ja 上書きされたシートも含むシート数。
   * @ko 덮어쓴 시트를 포함한 시트 개수입니다.
   */
  numSpriteSheets(): number {
    return native.spritesheetListNumSheets(listHandle(this));
  }

  /**
   * Invoke Rml::SpritesheetList::NumSprites.
   *
   * @zh 调用 Rml::SpritesheetList::NumSprites。
   * @ja Rml::SpritesheetList::NumSprites を呼びます。
   * @ko Rml::SpritesheetList::NumSprites를 호출합니다.
   * @returns Unique sprite-name count.
   * @zh 唯一精灵名称数量。
   * @ja 一意なスプライト名の数。
   * @ko 고유 스프라이트 이름 개수입니다.
   */
  numSprites(): number {
    return native.spritesheetListNumSprites(listHandle(this));
  }
}
