'use strict';

// JavaScript port of SFML/examples/cocoa/CocoaAppDelegate.mm and MainMenu.xib.
// Copyright (C) 2007-2026 Marco Antognini and Laurent Gomila.
// Modified for sfml.js; see ../SFML-LICENSE.md and ../README.md.
const { join } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const sf = require('../../..');
const resource = name => join(__dirname, 'resources', name);

/**
 * Create an NSRect in Cocoa's bottom-left coordinate system.
 * @param {number} x Left edge in points.
 * @param {number} y Bottom edge in points.
 * @param {number} width Width in points.
 * @param {number} height Height in points.
 * @return {object} Native rectangle fields.
 */
function rect(x, y, width, height) {
  return { origin: { x, y }, size: { width, height } };
}

/** Embed SFML drawing in a Cocoa window with the official native controls. */
async function main() {
  if (process.platform !== 'darwin') {
    throw new Error('This example requires macOS');
  }
  let objc;
  try {
    objc = await import('objc-js');
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    throw new Error('Install Cocoa dependencies first: ' +
      'npm ci --prefix examples/official/cocoa --ignore-scripts');
  }
  const { NobjcLibrary, NobjcClass, getPointer, RunLoop, dispose } = objc;
  const kit = new NobjcLibrary(
    '/System/Library/Frameworks/AppKit.framework/AppKit');
  const string = value => kit.NSString.stringWithUTF8String$(value);
  const app = kit.NSApplication.sharedApplication();
  app.setActivationPolicy$(0); // NSApplicationActivationPolicyRegular
  let running = true;
  let failure;
  let window;
  let renderWindow;
  let timer;
  let sprite;
  let text;
  let textField;
  let background = sf.Color.Blue;
  let visible = true;
  const owned = [];

  /** Request an orderly exit at the end of the current event dispatch. */
  function stop() {
    running = false;
  }

  /** Stop rendering before Cocoa tears down the view or its window. */
  function stopRendering() {
    stop();
    timer?.invalidate();
    if (renderWindow?.isOpen()) renderWindow.close();
  }

  /**
   * Hold a native wrapper until after rendering stops.
   * @param {object} object Objective-C object owned by this example.
   * @return {object} The same wrapper.
   */
  function own(object) {
    owned.push(object);
    return object;
  }

  /**
   * Build a Cocoa target/action method with errors returned to the JS loop.
   * @param {Function} callback Synchronous action.
   * @return {object} objc-js method definition.
   */
  function action(callback) {
    return {
      types: 'v@:@',
      implementation(self, sender) {
        try {
          callback(sender);
        } catch (error) {
          failure = error;
          stop();
        }
      },
    };
  }

  /** Draw at 60 Hz, including while AppKit tracks a slider or menu. */
  function render() {
    if (!running) return;
    if (sf.Keyboard.isKeyPressed(sf.Keyboard.Key.Up)) {
      sprite.scale(new sf.Vector2f(1.01, 1.01));
    }
    if (sf.Keyboard.isKeyPressed(sf.Keyboard.Key.Down)) {
      sprite.scale(new sf.Vector2f(0.99, 0.99));
    }
    renderWindow.clear(background);
    if (visible) renderWindow.draw(sprite);
    renderWindow.draw(text);
    renderWindow.display();
  }

  const Delegate = NobjcClass.define({
    name: 'SFMLExampleCocoaDelegate',
    superclass: 'NSObject',
    protocols: [ 'NSWindowDelegate' ],
    methods: {
      renderMainWindow$: action(render),
      windowWillClose$: action(stopRendering),
      quit$: action(stop),
      colorChanged$: action(sender => {
        background = sf.Color[sender.selectedItem().title().toString()];
      }),
      rotationChanged$: action(sender => {
        sprite.setRotation(sf.degrees(sender.doubleValue()));
      }),
      visibleChanged$: action(sender => {
        visible = sender.state() === 1;
      }),
      textChanged$: action(sender => {
        text.setString(sender.stringValue().toString());
      }),
      updateText$: action(() => {
        text.setString(textField.stringValue().toString());
      }),
    },
  });
  const SilentWindow = NobjcClass.define({
    name: 'SFMLExampleSilentWindow',
    superclass: 'NSWindow',
    methods: {
      // Suppress the alert sound for unhandled Up/Down keys, as upstream does.
      keyDown$: action(() => {}),
    },
  });
  const delegate = own(Delegate.alloc().init());
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  try {
    // Titled, closable and miniaturizable; the upstream window is fixed-size.
    window = own(SilentWindow.alloc()
      .initWithContentRect$styleMask$backing$defer$(
        rect(0, 0, 485, 379), 7, 2, false));
    window.setReleasedWhenClosed$(false);
    window.setTitle$(string('Cocoa'));
    window.setDelegate$(delegate);
    const content = window.contentView();

    /**
     * Attach a native control using the original XIB frame.
     * @param {string} type AppKit class name.
     * @param {object} frame Control rectangle.
     * @param {string} selector Optional delegate action.
     * @return {object} Native control wrapper.
     */
    const control = (type, frame, selector) => {
      const item = own(kit[type].alloc().initWithFrame$(frame));
      content.addSubview$(item);
      if (selector) {
        item.setTarget$(delegate);
        item.setAction$(selector);
      }
      return item;
    };

    /**
     * Add a native label with system typography.
     * @param {string} title Displayed text.
     * @param {object} frame Label rectangle.
     * @param {number} size Font size in points.
     */
    const label = (title, frame, size = 13) => {
      const item = own(kit.NSTextField.labelWithString$(string(title)));
      item.setFrame$(frame);
      item.setFont$(kit.NSFont.systemFontOfSize$(size));
      content.addSubview$(item);
    };

    textField = control('NSTextField', rect(20, 337, 359, 22), 'textChanged:');
    textField.setStringValue$(string('Hello SFML!'));
    textField.setPlaceholderString$(string('Enter some text here'));
    const view = control('NSView', rect(20, 72, 440, 260));
    const update = control('NSButton', rect(381, 331, 85, 32), 'updateText:');
    update.setTitle$(string('Update'));
    update.setBezelStyle$(1); // NSBezelStyleRounded
    update.setKeyEquivalent$(string('\r'));

    const checkbox = control('NSButton',
      rect(18, 40, 64, 18), 'visibleChanged:');
    checkbox.setButtonType$(3); // NSButtonTypeSwitch
    checkbox.setTitle$(string('Visible'));
    checkbox.setState$(1);
    label('Rotation', rect(172, 41, 57, 17));
    const rotation = control('NSSlider',
      rect(234, 34, 28, 30), 'rotationChanged:');
    rotation.setSliderType$(1); // NSSliderTypeCircular
    rotation.setMinValue$(0);
    rotation.setMaxValue$(359);
    rotation.setDoubleValue$(0);
    rotation.setContinuous$(true);
    label('Color', rect(325, 39, 39, 17));
    const color = control('NSPopUpButton',
      rect(366, 35, 97, 26), 'colorChanged:');
    for (const title of [ 'Blue', 'Green', 'Red' ]) {
      color.addItemWithTitle$(string(title));
      const image = own(kit.NSImage.alloc().initWithContentsOfFile$(
        string(resource(`${title.toLowerCase()}.png`))));
      color.lastItem().setImage$(image);
    }
    color.selectItemAtIndex$(0);
    label('Tips : you can use up and down arrows to scale the logo.',
      rect(17, 2, 451, 17), 11);

    // A minimal app/edit menu keeps Cmd+Q and text editing shortcuts native.
    const menu = own(kit.NSMenu.alloc().init());
    for (const [ title, entries ] of [
      [ 'Cocoa', [[ 'Quit Cocoa', 'quit:', 'q' ]]],
      [ 'Edit', [
        [ 'Cut', 'cut:', 'x' ], [ 'Copy', 'copy:', 'c' ],
        [ 'Paste', 'paste:', 'v' ], [ 'Select All', 'selectAll:', 'a' ],
      ]],
    ]) {
      const root = own(kit.NSMenuItem.alloc().init());
      const submenu = own(kit.NSMenu.alloc().initWithTitle$(string(title)));
      root.setSubmenu$(submenu);
      menu.addItem$(root);
      for (const [ name, selector, key ] of entries) {
        const item = own(kit.NSMenuItem.alloc()
          .initWithTitle$action$keyEquivalent$(string(name),
            selector, string(key)));
        if (selector === 'quit:') item.setTarget$(delegate);
        submenu.addItem$(item);
      }
    }
    app.setMainMenu$(menu);
    const icon = own(kit.NSImage.alloc().initWithContentsOfFile$(
      string(resource('icon.icns'))));
    app.setApplicationIconImage$(icon);
    window.center();
    window.makeKeyAndOrderFront$(null);
    app.finishLaunching();
    app.activateIgnoringOtherApps$(true);
    window.makeFirstResponder$(window);

    renderWindow = new sf.RenderWindow(getPointer(view).readBigUInt64LE(0));
    const font = new sf.Font();
    if (!await font.openFromFile(resource('tuffy.ttf'))) {
      throw new Error('Failed to load tuffy.ttf');
    }
    const logo = new sf.Texture();
    if (!await logo.loadFromFile(resource('logo.png'))) {
      throw new Error('Failed to load logo.png');
    }
    logo.setSmooth(true);
    sprite = new sf.Sprite(logo);
    sprite.setOrigin(sprite.getLocalBounds().getCenter());
    sprite.scale(new sf.Vector2f(0.3, 0.3));
    const size = renderWindow.getSize();
    sprite.setPosition(new sf.Vector2f(size.x / 2, size.y / 2));
    text = new sf.Text({ font, string: textField.stringValue().toString() });
    text.setFillColor(sf.Color.White);

    timer = own(kit.NSTimer
      .timerWithTimeInterval$target$selector$userInfo$repeats$(
        1 / 60, delegate, 'renderMainWindow:', null, true));
    const defaultMode = string('kCFRunLoopDefaultMode');
    const loop = kit.NSRunLoop.mainRunLoop();
    loop.addTimer$forMode$(timer, defaultMode);
    loop.addTimer$forMode$(timer, string('NSEventTrackingRunLoopMode'));
    while (running) {
      RunLoop.pump();
      // NSRunLoop pumps timers; NSApplication must also dispatch input.
      for (let event; running && (event = app
        .nextEventMatchingMask$untilDate$inMode$dequeue$(
          0xffffffff, kit.NSDate.distantPast(), defaultMode, true));) {
        app.sendEvent$(event);
      }
      app.updateWindows();
      await delay(5);
    }
    if (failure) throw failure;
  } finally {
    stopRendering();
    window?.setDelegate$(null);
    window?.close();
    app.setMainMenu$(null);
    app.setApplicationIconImage$(null);
    for (const object of owned.reverse()) dispose(object);
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  // objc-js 1.6.0 class callbacks retain referenced N-API thread-safe handles.
  // Exit the standalone example only after both native layers are cleaned up.
  setImmediate(() => process.exit(process.exitCode || 0));
});
