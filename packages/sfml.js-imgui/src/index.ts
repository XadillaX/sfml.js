// Maintained ImGui API, shared-memory views, and enums.
export * as ImGui from './imgui';

// imgui-sfml style integration layer: Init / ProcessEvent / Update / Render.
export * as SFML from './sfml';

export {
  getFontAtlas,
  getStyleColors,
  getGlyphRangesDefault,
  getGlyphRangesGreek,
  getGlyphRangesKorean,
  getGlyphRangesJapanese,
  getGlyphRangesChineseFull,
  getGlyphRangesChineseSimplifiedCommon,
  getGlyphRangesCyrillic,
  getGlyphRangesThai,
  getGlyphRangesVietnamese,
} from './font';

export type { ImGuiIOView, ImGuiStyleView } from './sfml';
