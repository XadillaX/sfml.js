import { outputDir } from './content.mjs';
import { buildReferences } from './typedoc/build.mjs';

await buildReferences(outputDir, { site: true });
