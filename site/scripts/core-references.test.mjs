import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { Application, TSConfigReader, TypeDocReader } from 'typedoc';
import { rootDir } from './content.mjs';
import { localizeProject } from './typedoc/localize.mjs';

for (const language of [ 'en', 'zh', 'ja', 'ko' ]) {
  test(`core public type references resolve in ${language}`, async () => {
    const app = await Application.bootstrapWithPlugins({
      options: resolve(rootDir, 'site/typedoc.json'),
      name: 'sfml.js',
      lang: language,
      entryPoints: [ resolve(rootDir, 'packages/sfml.js/src/index.ts') ],
      tsconfig: resolve(rootDir, 'packages/sfml.js/tsconfig.json'),
      logLevel: 'Warn',
    }, [ new TypeDocReader(), new TSConfigReader() ]);

    const project = await app.convert();
    assert.ok(project, 'The core package must convert successfully');
    app.validate(project);
    localizeProject(project, language);

    assert.equal(app.logger.errorCount, 0);
    assert.equal(
      app.logger.warningCount, 0,
      'Public signatures must document every referenced type'
    );
  });
}
