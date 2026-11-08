import { native } from '../internal/native';
import type { ImVec2Like, ImVec4Like } from '../types';

/**
 * Display an image.
 *
 * @zh 显示图像。
 * @ja 画像を表示します。
 * @ko 이미지를 표시합니다.
 *
 * @remarks
 * - Read about ImTextureID here:
 *   https://github.com/ocornut/imgui/wiki/Image-Loading-and-Displaying-Examples
 * - 'uv0' and 'uv1' are texture coordinates. Read about them from the same link
 *   above.
 *
 * - Image() adds style.ImageBorderSize on each side. ImageButton() adds
 *   style.FramePaddingX horizontally and style.FramePaddingY vertically.
 *   Here style is the mapped view from ImGui.viewImGuiStyle(styleHandle).
 *
 * - ImageButton() draws a background based on regular Button() color +
 *   optionally an inner background if specified.
 *
 * Implied uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }
 * @zh
 * 控件：图像。
 *
 * - 关于 ImTextureID，请阅读
 *   https://github.com/ocornut/imgui/wiki/Image-Loading-and-Displaying-Examples
 *   。
 *
 * - 'uv0' 和 'uv1' 是纹理坐标，说明见上述同一链接。
 *
 * - Image() 在每侧增加 style.ImageBorderSize 的留白。ImageButton() 左右各增加
 *   style.FramePaddingX，
 * 上下各增加 style.FramePaddingY。style 是 ImGui.viewImGuiStyle(styleHandle) 返回的映射视图。
 *
 * - ImageButton() 根据普通 Button() 的颜色绘制背景，并可在指定时额外绘制内部背景。
 *
 * 隐含参数：uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }。
 * @ja
 * ウィジェット：画像。
 *
 * - ImTextureID については
 *   https://github.com/ocornut/imgui/wiki/Image-Loading-and-Displaying-Examples
 *   を参照してください。
 *
 * - 'uv0' と 'uv1' はテクスチャ座標です。同じリンクに説明があります。
 *
 * - Image() は各辺に style.ImageBorderSize の余白を加えます。ImageButton() は左右に
 *   style.FramePaddingX、
 * 上下に style.FramePaddingY を加えます。style は ImGui.viewImGuiStyle(styleHandle)
 * が返すビューです。
 *
 * - ImageButton() は通常の Button() の色で背景を描き、指定があれば内側の背景も描きます。
 *
 * 暗黙の引数：uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }。
 * @ko
 * 위젯: 이미지.
 *
 * - ImTextureID는
 *   https://github.com/ocornut/imgui/wiki/Image-Loading-and-Displaying-Examples
 *   를 참조하세요.
 *
 * - 'uv0'와 'uv1'은 텍스처 좌표이며 위 링크에서 설명합니다.
 *
 * - Image()는 각 변에 style.ImageBorderSize만큼 여백을 추가합니다. ImageButton()은 좌우에
 *   style.FramePaddingX,
 * 상하에 style.FramePaddingY를 추가합니다. style은 ImGui.viewImGuiStyle(styleHandle)이
 * 반환하는 뷰입니다.
 *
 * - ImageButton()은 일반 Button() 색상으로 배경을 그리고, 지정된 경우 내부 배경도 추가로 그립니다.
 *
 * 암묵적 인수: uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 *
 * @param image_size - Displayed image width and height in screen pixels,
 * independent of texture dimensions.
 * @zh image_size - 图像显示的屏幕像素宽高，与纹理尺寸无关。
 * @ja image_size - テクスチャ寸法とは独立した、画面ピクセル単位の画像表示幅と高さです。
 * @ko image_size - 텍스처 크기와 독립적인 화면 픽셀 단위의 이미지 표시 너비와 높이입니다.
 */
export function Image(user_texture_id: bigint, image_size: ImVec2Like): void {
  native.Image(user_texture_id, image_size);
}

/**
 * Display a texture image as a non-interactive widget.
 *
 * @zh 将纹理图像显示为不可交互的控件。
 * @ja テクスチャ画像を操作できないウィジェットとして表示します。
 * @ko 텍스처 이미지를 비대화형 위젯으로 표시합니다.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 *
 * @param image_size - Displayed image width and height in screen pixels,
 * independent of texture dimensions.
 * @zh image_size - 图像显示的屏幕像素宽高，与纹理尺寸无关。
 * @ja image_size - テクスチャ寸法とは独立した、画面ピクセル単位の画像表示幅と高さです。
 * @ko image_size - 텍스처 크기와 독립적인 화면 픽셀 단위의 이미지 표시 너비와 높이입니다.
 *
 * @param uv0 - Texture coordinates at the upper-left corner; (0,0) is the usual
 * full-image start.
 * @zh uv0 - 左上角纹理坐标；完整图像通常从 (0,0) 开始。
 * @ja uv0 - 左上のテクスチャ座標です。画像全体では通常 (0,0) を使います。
 * @ko uv0 - 왼쪽 위 텍스처 좌표입니다. 전체 이미지는 보통 (0,0)에서 시작합니다.
 *
 * @param uv1 - Texture coordinates at the lower-right corner; (1,1) is the
 * usual full-image end.
 * @zh uv1 - 右下角纹理坐标；完整图像通常以 (1,1) 结束。
 * @ja uv1 - 右下のテクスチャ座標です。画像全体では通常 (1,1) を使います。
 * @ko uv1 - 오른쪽 아래 텍스처 좌표입니다. 전체 이미지는 보통 (1,1)에서 끝납니다.
 */
export function ImageEx(
  user_texture_id: bigint,
  image_size: ImVec2Like,
  uv0: ImVec2Like = { x: 0, y: 0 },
  uv1: ImVec2Like = { x: 1, y: 1 },
): void {
  native.ImageEx(user_texture_id, image_size, uv0, uv1);
}

/**
 * Display a texture image with support for a background color and tint.
 *
 * @zh 显示纹理图像，支持背景色和着色。
 * @ja 背景色と色調の指定に対応したテクスチャ画像を表示します。
 * @ko 배경색과 색조를 지원하는 텍스처 이미지를 표시합니다.
 *
 * @remarks
 * Implied uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }, bg_col = { x: 0, y: 0, z:
 * 0, w: 0 },
 * tint_col = { x: 1, y: 1, z: 1, w: 1 }
 * @zh
 * 隐含参数：uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }, bg_col = { x: 0, y: 0, z: 0,
 * w: 0 },
 * tint_col = { x: 1, y: 1, z: 1, w: 1 }。
 * @ja
 * 暗黙の引数：uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }, bg_col = { x: 0, y: 0, z:
 * 0, w: 0 },
 * tint_col = { x: 1, y: 1, z: 1, w: 1 }。
 * @ko
 * 암묵적 인수: uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }, bg_col = { x: 0, y: 0, z:
 * 0, w: 0 },
 * tint_col = { x: 1, y: 1, z: 1, w: 1 }.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 *
 * @param image_size - Displayed image width and height in screen pixels,
 * independent of texture dimensions.
 * @zh image_size - 图像显示的屏幕像素宽高，与纹理尺寸无关。
 * @ja image_size - テクスチャ寸法とは独立した、画面ピクセル単位の画像表示幅と高さです。
 * @ko image_size - 텍스처 크기와 독립적인 화면 픽셀 단위의 이미지 표시 너비와 높이입니다.
 */
export function ImageWithBg(
  user_texture_id: bigint,
  image_size: ImVec2Like,
): void {
  native.ImageWithBg(user_texture_id, image_size);
}

/**
 * Display a texture image with support for a background color and tint.
 *
 * @zh 显示纹理图像，支持背景色和着色。
 * @ja 背景色と色調の指定に対応したテクスチャ画像を表示します。
 * @ko 배경색과 색조를 지원하는 텍스처 이미지를 표시합니다.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 *
 * @param image_size - Displayed image width and height in screen pixels,
 * independent of texture dimensions.
 * @zh image_size - 图像显示的屏幕像素宽高，与纹理尺寸无关。
 * @ja image_size - テクスチャ寸法とは独立した、画面ピクセル単位の画像表示幅と高さです。
 * @ko image_size - 텍스처 크기와 독립적인 화면 픽셀 단위의 이미지 표시 너비와 높이입니다.
 *
 * @param uv0 - Texture coordinates at the upper-left corner; (0,0) is the usual
 * full-image start.
 * @zh uv0 - 左上角纹理坐标；完整图像通常从 (0,0) 开始。
 * @ja uv0 - 左上のテクスチャ座標です。画像全体では通常 (0,0) を使います。
 * @ko uv0 - 왼쪽 위 텍스처 좌표입니다. 전체 이미지는 보통 (0,0)에서 시작합니다.
 *
 * @param uv1 - Texture coordinates at the lower-right corner; (1,1) is the
 * usual full-image end.
 * @zh uv1 - 右下角纹理坐标；完整图像通常以 (1,1) 结束。
 * @ja uv1 - 右下のテクスチャ座標です。画像全体では通常 (1,1) を使います。
 * @ko uv1 - 오른쪽 아래 텍스처 좌표입니다. 전체 이미지는 보통 (1,1)에서 끝납니다.
 *
 * @param bg_col - RGBA background color behind the image, with floating-point
 * components.
 * @zh bg_col - 图像背后的 RGBA 背景颜色，使用浮点分量。
 * @ja bg_col - 画像の背後に描く浮動小数点 RGBA 背景色です。
 * @ko bg_col - 이미지 뒤의 배경색이며 부동소수점 RGBA 성분입니다.
 *
 * @param tint_col - RGBA color multiplied into the image; white preserves its
 * colors.
 * @zh tint_col - 与图像相乘的 RGBA 颜色；白色保持原色。
 * @ja tint_col - 画像に乗算する RGBA 色です。白は元の色を維持します。
 * @ko tint_col - 이미지에 곱하는 RGBA 색상입니다. 흰색은 원래 색을 유지합니다.
 */
export function ImageWithBgEx(
  user_texture_id: bigint,
  image_size: ImVec2Like,
  uv0: ImVec2Like = { x: 0, y: 0 },
  uv1: ImVec2Like = { x: 1, y: 1 },
  bg_col: ImVec4Like = { x: 0, y: 0, z: 0, w: 0 },
  tint_col: ImVec4Like = { x: 1, y: 1, z: 1, w: 1 },
): void {
  native.ImageWithBgEx(user_texture_id, image_size, uv0, uv1, bg_col, tint_col);
}

/**
 * Display a clickable button containing a texture image.
 *
 * @zh 显示包含纹理图像的可点击按钮。
 * @ja テクスチャ画像を含むクリック可能なボタンを表示します。
 * @ko 텍스처 이미지를 포함한 클릭 가능한 버튼을 표시합니다.
 *
 * @remarks
 * Implied uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }, bg_col = { x: 0, y: 0, z:
 * 0, w: 0 },
 * tint_col = { x: 1, y: 1, z: 1, w: 1 }
 * @zh
 * 隐含参数：uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }, bg_col = { x: 0, y: 0, z: 0,
 * w: 0 },
 * tint_col = { x: 1, y: 1, z: 1, w: 1 }。
 * @ja
 * 暗黙の引数：uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }, bg_col = { x: 0, y: 0, z:
 * 0, w: 0 },
 * tint_col = { x: 1, y: 1, z: 1, w: 1 }。
 * @ko
 * 암묵적 인수: uv0 = { x: 0, y: 0 }, uv1 = { x: 1, y: 1 }, bg_col = { x: 0, y: 0, z:
 * 0, w: 0 },
 * tint_col = { x: 1, y: 1, z: 1, w: 1 }.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 *
 * @param image_size - Displayed image width and height in screen pixels,
 * independent of texture dimensions.
 * @zh image_size - 图像显示的屏幕像素宽高，与纹理尺寸无关。
 * @ja image_size - テクスチャ寸法とは独立した、画面ピクセル単位の画像表示幅と高さです。
 * @ko image_size - 텍스처 크기와 독립적인 화면 픽셀 단위의 이미지 표시 너비와 높이입니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function ImageButton(
  str_id: string | Uint8Array,
  user_texture_id: bigint,
  image_size: ImVec2Like,
): boolean {
  return native.ImageButton(str_id, user_texture_id, image_size);
}

/**
 * Display a clickable button containing a texture image.
 *
 * @zh 显示包含纹理图像的可点击按钮。
 * @ja テクスチャ画像を含むクリック可能なボタンを表示します。
 * @ko 텍스처 이미지를 포함한 클릭 가능한 버튼을 표시합니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 *
 * @param image_size - Displayed image width and height in screen pixels,
 * independent of texture dimensions.
 * @zh image_size - 图像显示的屏幕像素宽高，与纹理尺寸无关。
 * @ja image_size - テクスチャ寸法とは独立した、画面ピクセル単位の画像表示幅と高さです。
 * @ko image_size - 텍스처 크기와 독립적인 화면 픽셀 단위의 이미지 표시 너비와 높이입니다.
 *
 * @param uv0 - Texture coordinates at the upper-left corner; (0,0) is the usual
 * full-image start.
 * @zh uv0 - 左上角纹理坐标；完整图像通常从 (0,0) 开始。
 * @ja uv0 - 左上のテクスチャ座標です。画像全体では通常 (0,0) を使います。
 * @ko uv0 - 왼쪽 위 텍스처 좌표입니다. 전체 이미지는 보통 (0,0)에서 시작합니다.
 *
 * @param uv1 - Texture coordinates at the lower-right corner; (1,1) is the
 * usual full-image end.
 * @zh uv1 - 右下角纹理坐标；完整图像通常以 (1,1) 结束。
 * @ja uv1 - 右下のテクスチャ座標です。画像全体では通常 (1,1) を使います。
 * @ko uv1 - 오른쪽 아래 텍스처 좌표입니다. 전체 이미지는 보통 (1,1)에서 끝납니다.
 *
 * @param bg_col - RGBA background color behind the image, with floating-point
 * components.
 * @zh bg_col - 图像背后的 RGBA 背景颜色，使用浮点分量。
 * @ja bg_col - 画像の背後に描く浮動小数点 RGBA 背景色です。
 * @ko bg_col - 이미지 뒤의 배경색이며 부동소수점 RGBA 성분입니다.
 *
 * @param tint_col - RGBA color multiplied into the image; white preserves its
 * colors.
 * @zh tint_col - 与图像相乘的 RGBA 颜色；白色保持原色。
 * @ja tint_col - 画像に乗算する RGBA 色です。白は元の色を維持します。
 * @ko tint_col - 이미지에 곱하는 RGBA 색상입니다. 흰색은 원래 색을 유지합니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function ImageButtonEx(
  str_id: string | Uint8Array,
  user_texture_id: bigint,
  image_size: ImVec2Like,
  uv0: ImVec2Like = { x: 0, y: 0 },
  uv1: ImVec2Like = { x: 1, y: 1 },
  bg_col: ImVec4Like = { x: 0, y: 0, z: 0, w: 0 },
  tint_col: ImVec4Like = { x: 1, y: 1, z: 1, w: 1 },
): boolean {
  return native.ImageButtonEx(
    str_id,
    user_texture_id,
    image_size,
    uv0,
    uv1,
    bg_col,
    tint_col,
  );
}
