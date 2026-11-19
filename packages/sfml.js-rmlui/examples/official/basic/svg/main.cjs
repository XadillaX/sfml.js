'use strict';

/**
 * Keep basic/svg's three documents and all three inline SVG update paths.
 * @param {object} context Live RmlUi context.
 * @return {object} Documents, native data model and shutdown hook.
 */
function createSvg(context) {
  const model = context.createDataModel('svg_test_model');
  let toggleState = false;
  let svgElement;
  const initial = '<circle cx="25" cy="25" r="20" ' +
    'stroke="black" stroke-width="3" fill="red" />';
  model.bind('svg_data', initial);
  model.bind('line_color', 'black');
  model.bind('fill_color', 'red');
  model.bindEventCallback('toggle_svg', () => {
    toggleState = !toggleState;
    const line = toggleState ? 'yellow' : 'black';
    const fill = toggleState ? 'green' : 'red';
    const data = '<circle cx="25" cy="25" r="20" ' +
      `stroke="${line}" stroke-width="3" fill="${fill}" />`;
    model.getVariable('line_color').set(line);
    model.getVariable('fill_color').set(fill);
    model.getVariable('svg_data').set(data);
    if (svgElement) {
      svgElement.innerRML = data;
    }
    for (const name of [ 'svg_data', 'line_color', 'fill_color' ]) {
      model.dirtyVariable(name);
    }
  });

  const documents = [];
  for (const file of [ 'svg_element', 'svg_decorator', 'svg_inline' ]) {
    const document = context.loadDocument(`basic/svg/data/${file}.rml`);
    document.show();
    document.getElementById('title').innerRML = document.title;
    svgElement = document.getElementById('svg_1') ?? svgElement;
    documents.push(document);
  }

  return {
    document: documents[0], documents, model,
    close() {
      for (const document of documents) {
        document.close();
      }
      context.removeDataModel('svg_test_model');
    },
  };
}

module.exports = { createSvg };
