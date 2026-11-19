'use strict';

const rmlui = require('../../../../dist');

// Keep the original DemoWindow sandbox defaults beside its application logic.
const sandboxDefaultRcss = `
body { top: 0; left: 0; right: 0; bottom: 0; overflow: hidden auto; }
scrollbarvertical { width: 15px; }
scrollbarvertical slidertrack { background: #eee; }
scrollbarvertical slidertrack:active { background: #ddd; }
scrollbarvertical sliderbar { width: 15px; min-height: 30px; background: #aaa; }
scrollbarvertical sliderbar:hover { background: #888; }
scrollbarvertical sliderbar:active { background: #666; }
scrollbarhorizontal { height: 15px; }
scrollbarhorizontal slidertrack { background: #eee; }
scrollbarhorizontal slidertrack:active { background: #ddd; }
scrollbarhorizontal sliderbar {
  height: 15px; min-width: 30px; background: #aaa;
}
scrollbarhorizontal sliderbar:hover { background: #888; }
scrollbarhorizontal sliderbar:active { background: #666; }
`;

/** Original DemoWindow document, submission clock and sandbox stylesheet. */
class DemoWindow {
  /**
   * Retain backend callbacks without loading before listener registration.
   * @param {Function} requestExit Request backend termination.
   */
  constructor(requestExit) {
    /** Original outer window document, closed by Shutdown. */
    this.document = null;
    /** Real nested ElementDocument owned by sandbox_target. */
    this.iframe = null;
    /** Original progress state, driven by the native system clock. */
    this.submitting = false;
    /** Seconds recorded by SubmitForm before its first Update. */
    this.submittingStartTime = 0;
    /** Encoded form output retained until the four-second animation ends. */
    this.submitMessage = '';
    /** Backend exit request invoked by the outer document's Escape listener. */
    this.requestExit = requestExit;
    /** Current original tween settings shared with inline action listeners. */
    this.tweeningParameters = {
      type: rmlui.TweenType.Linear,
      direction: rmlui.TweenDirection.Out,
      duration: 0.5,
    };
    /** Base rules retained for each new sandbox stylesheet combination. */
    this.rmlBasicStyleSheet = null;
    /** Original circular progress element retained by DemoWindow. */
    this.gauge = null;
    /** Original horizontal progress element retained by DemoWindow. */
    this.progressHorizontal = null;
  }

  /**
   * Load the unchanged original RML and construct its nested sandbox.
   * @param {string} title Original window heading.
   * @param {object} context Live RmlUi context.
   */
  initialize(title, context) {
    this.document = context.loadDocument('basic/demo/data/demo.rml');
    if (!this.document) {
      throw new Error('Could not load the upstream demo document');
    }
    const document = this.document;
    document.getElementById('title').innerRML = title;
    const source = document.getElementById('sandbox_rml_source');
    source.setValue(source.getValue() + '<p>Write your RML here</p>\n\n' +
      '<!-- <img src="assets/high_scores_alien_1.tga"/> -->');

    const target = document.getElementById('sandbox_target');
    this.iframe = context.createDocument();
    const owned = this.iframe.getParentNode().removeChild(this.iframe);
    target.appendChild(owned);
    this.iframe.setProperty('position', 'absolute');
    this.iframe.setProperty('display', 'block');
    this.iframe.innerRML = '<p>Rendered output goes here.</p>';

    const files = rmlui.getFileInterface();
    const file = files.open('assets/rml.rcss');
    if (!file) {
      throw new Error('Could not open the original sandbox stylesheet');
    }
    let content;
    try {
      const bytes = new Uint8Array(files.length(file));
      files.read(bytes, bytes.length, file);
      content = Buffer.from(bytes).toString('utf8') + sandboxDefaultRcss;
    } finally {
      files.close(file);
    }
    const stream = new rmlui.StreamMemory(Buffer.from(content));
    stream.setSourceURL('sandbox://default_rcss');
    this.rmlBasicStyleSheet = new rmlui.StyleSheetContainer();
    this.rmlBasicStyleSheet.loadStyleSheetContainer(stream);

    const value = '/* Write your RCSS here */\n\n' +
      '/* body { color: #fea; background: #224; }\n' +
      'img { image-color: red; } */';
    document.getElementById('sandbox_rcss_source').setValue(value);
    this.setSandboxStylesheet(value);
    this.gauge = document.getElementById('gauge');
    this.progressHorizontal = document.getElementById('progress_horizontal');
    document.show();
  }

  /** Match DemoWindow::Update before backend event processing. */
  beforeEvents() {
    if (this.iframe) {
      this.iframe.updateDocument();
    }
    if (!this.submitting || !this.gauge || !this.progressHorizontal) {
      return;
    }

    const f32 = Math.fround;
    const time = rmlui.getSystemInterface().getElapsedTime();
    const progress = Math.min(f32(f32(time - this.submittingStartTime) / 2), 2);
    const phase = progress < 1 ? progress : f32(progress - 1);
    const angle = f32(f32(Math.PI) * phase);
    const eased = f32(0.5 - f32(0.5 * f32(Math.cos(angle))));
    const valueGauge = progress < 1 ? eased : 1;
    const valueHorizontal = progress < 1 ? 0 : eased;
    const begin = f32(0.09);
    const end = f32(1 - begin);
    const mapped = f32(begin + f32(valueGauge * f32(end - begin)));
    this.progressHorizontal.setAttribute('value', valueHorizontal);
    this.gauge.setAttribute('value', mapped);
    this.document.getElementById('gauge_value').innerRML =
      `${Math.round(f32(valueGauge * 100))} %`;
    this.document.getElementById('progress_value').innerRML =
      `${Math.round(f32(valueHorizontal * 100))} %`;

    let label = 'Placing tubes';
    if (progress > 1) {
      label += '... Placed! Assembling message';
    }
    label += progress < 2
      ? '.'.repeat(Math.trunc(f32(progress * 10)) % 4) : '... Done!';
    this.document.getElementById('progress_label').innerRML = label;
    if (progress >= 2) {
      this.submitting = false;
      this.document.getElementById('form_output').innerRML = this.submitMessage;
    }
    this.document.getContext().requestNextUpdate(0);
  }

  /**
   * Handle the original document listener after inline control listeners.
   * @param {object} event Native RmlUi event.
   */
  processEvent(event) {
    if (event.type === 'keydown' && event.getParameter('key_identifier', 0) ===
        rmlui.KeyIdentifier.KI_ESCAPE) {
      this.requestExit();
    }
  }

  /**
   * Start the original two-stage, four-second progress animation.
   * @param {string} message Encoded original form output.
   */
  submitForm(message) {
    this.submitting = true;
    this.submittingStartTime = rmlui.getSystemInterface().getElapsedTime();
    this.submitMessage = message;
    this.document.getElementById('form_output').innerRML = '';
    this.document.getElementById('submit_progress')
      .setProperty('display', 'block');
  }

  /**
   * Combine the base sheet with the current sandbox editor text.
   * @param {string} value Original RCSS editor value.
   */
  setSandboxStylesheet(value) {
    if (this.iframe && this.rmlBasicStyleSheet) {
      const style = new rmlui.StyleSheetContainer();
      const stream = new rmlui.StreamMemory(Buffer.from(value));
      stream.setSourceURL('sandbox://rcss');
      style.loadStyleSheetContainer(stream);
      this.iframe.setStyleSheetContainer(
        this.rmlBasicStyleSheet.combineStyleSheetContainer(style));
    }
  }

  /**
   * Replace the actual sandbox document body.
   * @param {string} value Original RML editor value.
   */
  setSandboxBody(value) {
    if (this.iframe) {
      this.iframe.innerRML = value;
    }
  }

  /**
   * Return the value copy used by original event listeners.
   * @return {object} Original tween type, direction and duration.
   */
  getTweeningParameters() {
    return { ...this.tweeningParameters };
  }

  /**
   * Store the original event listener's updated tween settings.
   * @param {object} value Tween type, direction and duration.
   */
  setTweeningParameters(value) {
    this.tweeningParameters = { ...value };
  }

  /** Close the outer document, which owns and destroys its sandbox. */
  close() {
    if (this.document) {
      this.document.close();
      this.document = null;
    }
  }
}

module.exports = { DemoWindow };
