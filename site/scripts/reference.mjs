import { outputDir } from './content.mjs';
import { buildReferences } from '../../tools/typedoc/build.mjs';

await buildReferences(outputDir, { site: true });
