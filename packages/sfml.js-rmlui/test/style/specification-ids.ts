import { MediaQueryId, FontFaceId, PropertyId } from '../../src';

const media: MediaQueryId = MediaQueryId.AspectRatio;
const font: FontFaceId = FontFaceId.FaceIndex;

// @ts-expect-error Local media IDs do not belong to the main stylesheet enum.
const main: PropertyId = media;

// @ts-expect-error Font-face and media specifications have distinct enums.
const wrong: FontFaceId = media;

void [ media, font, main, wrong ];
