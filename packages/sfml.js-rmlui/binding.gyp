{
  "includes": [
    "native/generated/rmlui-deps.gypi",
    "examples/official/shell/applications.gypi"
  ],
  "variables": {
    "rmlui_harfbuzz%": 1,
    "rmlui_bitmap_font%": 1,
    "sfml_include": "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlInclude)\")",
    "sfml_lib": "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlLib)\")",
    "sfml_bin": "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlBin)\")",
    "interop_include": "<!(node -e \"process.stdout.write(require('sfml.js-interop'))\")"
  },
  "targets": [{
    "target_name": "lua",
    "type": "static_library",
    "sources": ["<@(lua_sources)"],
    "variables": {
      "lua_object_suffix": "o"
    },
    "rules": [{
      "rule_name": "compile_lua_as_cpp",
      "extension": "c",
      "inputs": [
        "tools/build/compile-lua-cxx.cjs",
        "<@(lua_headers)"
      ],
      "outputs": [
        "<(INTERMEDIATE_DIR)/<(RULE_INPUT_ROOT).<(lua_object_suffix)"
      ],
      "action": [
        "node",
        "tools/build/compile-lua-cxx.cjs",
        "<(RULE_INPUT_PATH)",
        "<(INTERMEDIATE_DIR)/<(RULE_INPUT_ROOT).<(lua_object_suffix)",
        "<(target_arch)"
      ],
      "process_outputs_as_sources": 1
    }],
    "include_dirs": ["third_party/lua/src"],
    "conditions": [
      ["OS=='mac'", {
        "xcode_settings": {
          "MACOSX_DEPLOYMENT_TARGET": "13.0"
        }
      }],
      ["OS=='win'", {
        "variables": {
          "lua_object_suffix": "obj"
        }
      }]
    ]
  }, {
    "target_name": "lunasvg",
    "type": "static_library",
    "sources": ["<@(lunasvg_sources)", "<@(plutovg_sources)"],
    "include_dirs": [
      "third_party/lunasvg/include",
      "third_party/lunasvg/source",
      "third_party/lunasvg/plutovg/include",
      "third_party/lunasvg/plutovg/source"
    ],
    "defines": [
      "LUNASVG_BUILD_STATIC", "PLUTOVG_BUILD_STATIC",
      "LUNASVG_BUILD", "PLUTOVG_BUILD"
    ],
    "cflags_cc": ["-std=c++20"],
    "cflags_cc!": ["-fno-exceptions"],
    "conditions": [
      ["OS=='mac'", {
        "xcode_settings": {
          "CLANG_CXX_LANGUAGE_STANDARD": "c++20",
          "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
          "MACOSX_DEPLOYMENT_TARGET": "13.0"
        }
      }],
      ["OS=='win'", {
        "msvs_settings": {
          "VCCLCompilerTool": {
            "ExceptionHandling": 1,
            "AdditionalOptions": ["/std:c++20"]
          }
        }
      }]
    ]
  }, {
    "target_name": "rlottie",
    "type": "static_library",
    "sources": ["<@(rlottie_sources)"],
    "include_dirs": [
      "third_party/rlottie",
      "third_party/rlottie/inc",
      "third_party/rlottie/src/lottie",
      "third_party/rlottie/src/vector",
      "third_party/rlottie/src/vector/freetype",
      "third_party/rlottie/src/vector/pixman"
    ],
    "defines": ["RLOTTIE_BUILD", "RLOTTIE_STATIC"],
    "cflags_cc": ["-std=c++20"],
    "cflags_cc!": ["-fno-exceptions"],
    "conditions": [
      ["OS=='mac'", {
        "xcode_settings": {
          "CLANG_CXX_LANGUAGE_STANDARD": "c++20",
          "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
          "MACOSX_DEPLOYMENT_TARGET": "13.0"
        }
      }],
      ["OS=='linux'", {
        "libraries": ["-ldl", "-lpthread"]
      }],
      ["OS=='win'", {
        "defines": ["NOMINMAX", "_CRT_SECURE_NO_WARNINGS"],
        "msvs_settings": {
          "VCCLCompilerTool": {
            "ExceptionHandling": 1,
            "AdditionalOptions": ["/std:c++20"]
          }
        }
      }]
    ]
  }, {
    "target_name": "rmlui",
    "dependencies": ["lua", "lunasvg", "rlottie"],
    "sources": [
      "native/addon.cc",
      "native/runtime/native-module-symbols.cc",
      "native/io/file-interface-root.cc",
      "native/runtime/rmlui-core.cc",
      "native/runtime/rmlui-capabilities.cc",
      "native/runtime/rmlui-debugger.cc",
      "native/dom/elements/rmlui-vector-elements.cc",
      "native/values/rmlui-string.cc",
      "native/values/rmlui-string-format.cc",
      "native/runtime/rmlui-log.cc",
      "native/values/rmlui-url.cc",
      "native/runtime/rmlui-plugin.cc",
      "native/platform/rmlui-system-interface.cc",
      "native/io/rmlui-file-interface.cc",
      "native/fonts/rmlui-fonts.cc",
      "native/fonts/rmlui-font-engine.cc",
      "native/fonts/rmlui-font-backends.cc",
      "native/fonts/rmlui-font-custom.cc",
      "native/fonts/rmlui-font-measure.cc",
      "native/fonts/rmlui-font-glyph.cc",
      "native/fonts/rmlui-font-effect.cc",
      "native/fonts/rmlui-font-effect-callbacks.cc",
      "native/runtime/rmlui-callback-owners.cc",
      "native/runtime/rmlui-parent-observers.cc",
      "native/rendering/textures/rmlui-resources.cc",
      "native/rendering/textures/rmlui-resource-preload.cc",
      "native/rendering/manager/rmlui-render-manager.cc",
      "native/rendering/manager/rmlui-render-state.cc",
      "native/rendering/manager/rmlui-render-layers.cc",
      "native/runtime/rmlui-state.cc",
      "native/scripting/rmlui-script-object.cc",
      "native/runtime/rmlui-context.cc",
      "native/runtime/context-render-session.cc",
      "native/runtime/rmlui-context-instancers.cc",
      "native/platform/rmlui-text-input.cc",
      "native/platform/ime/platform-text-input.cc",
      "native/platform/ime/text-input-session.cc",
      "native/platform/ime/deferred-text-input.cc",
      "native/platform/ime/runtime-input.cc",
      "native/platform/ime/unicode-ranges.cc",
      "native/runtime/rmlui-context-documents.cc",
      "native/data/rmlui-data-state.cc",
      "native/data/rmlui-data-factory.cc",
      "native/data/rmlui-data-batch.cc",
      "native/data/rmlui-data-model.cc",
      "native/data/rmlui-data-address.cc",
      "native/data/rmlui-data-callbacks.cc",
      "native/data/rmlui-data-register.cc",
      "native/data/rmlui-data-custom.cc",
      "native/data/rmlui-data-members.cc",
      "native/data/rmlui-data-storage.cc",
      "native/data/rmlui-data-diagnostics.cc",
      "native/platform/rmlui-input.cc",
      "native/dom/documents/rmlui-document.cc",
      "native/dom/documents/rmlui-document-ownership.cc",
      "native/scripting/rmlui-script-host.cc",
      "native/scripting/lua/rmlui-lua-object.cc",
      "native/scripting/lua/rmlui-lua-variant.cc",
      "native/scripting/lua/rmlui-lua-host.cc",
      "native/scripting/lua/rmlui-lua-function.cc",
      "native/scripting/lua/rmlui-lua-model.cc",
      "native/scripting/lua/rmlui-lua-instancer.cc",
      "native/dom/documents/rmlui-document-header.cc",
      "native/dom/elements/rmlui-element.cc",
      "native/dom/elements/rmlui-element-scroll.cc",
      "native/dom/elements/rmlui-element-background-border.cc",
      "native/dom/elements/rmlui-element-style.cc",
      "native/dom/elements/rmlui-element-state.cc",
      "native/dom/elements/rmlui-layout.cc",
      "native/dom/elements/rmlui-element-utilities.cc",
      "native/dom/elements/rmlui-box.cc",
      "native/dom/elements/rmlui-element-box.cc",
      "native/values/rmlui-numeric-value.cc",
      "native/dom/elements/rmlui-element-numeric.cc",
      "native/style/properties/rmlui-property.cc",
      "native/style/properties/rmlui-property-definition.cc",
      "native/style/properties/rmlui-property-dictionary.cc",
      "native/style/properties/rmlui-property-specification.cc",
      "native/style/properties/rmlui-property-parser.cc",
      "native/dom/documents/rmlui-xml.cc",
      "native/dom/documents/rmlui-xml-callbacks.cc",
      "native/dom/elements/rmlui-element-property.cc",
      "native/dom/elements/rmlui-element-commands.cc",
      "native/animation/rmlui-tween.cc",
      "native/animation/rmlui-animation.cc",
      "native/animation/rmlui-animation-values.cc",
      "native/animation/rmlui-value-callbacks.cc",
      "native/dom/controls/rmlui-forms.cc",
      "native/dom/controls/rmlui-select.cc",
      "native/dom/controls/rmlui-text.cc",
      "native/dom/controls/rmlui-panels.cc",
      "native/runtime/rmlui-rtti.cc",
      "native/dom/elements/rmlui-dom.cc",
      "native/events/rmlui-events.cc",
      "native/events/rmlui-event-references.cc",
      "native/events/rmlui-event-instancers.cc",
      "native/events/rmlui-listener-instancers.cc",
      "native/values/rmlui-variant.cc",
      "native/values/rmlui-variant-conversion.cc",
      "native/values/rmlui-variant-pointers.cc",
      "native/values/rmlui-variant-objects.cc",
      "native/values/rmlui-owned-variant.cc",
      "native/style/effects/rmlui-decoration-values.cc",
      "native/style/effects/rmlui-effect-values.cc",
      "native/style/effects/rmlui-effect-instancers.cc",
      "native/style/effects/rmlui-filter.cc",
      "native/style/effects/rmlui-filter-callbacks.cc",
      "native/style/effects/rmlui-decorator.cc",
      "native/style/effects/rmlui-decorator-callbacks.cc",
      "native/style/properties/rmlui-style-sheet.cc",
      "native/io/rmlui-stream.cc",
      "native/dom/documents/rmlui-factory.cc",
      "native/dom/elements/rmlui-element-instancers.cc",
      "native/io/rmlui-stream-callbacks.cc",
      "native/rendering/geometry/rmlui-mesh.cc",
      "native/rendering/geometry/rmlui-mesh-utilities.cc",
      "native/style/effects/rmlui-convolution.cc",
      "native/rendering/geometry/rmlui-geometry.cc",
      "native/rendering/textures/rmlui-texture-source.cc",
      "native/rendering/textures/rmlui-callback-texture.cc",
      "native/rendering/textures/rmlui-spritesheet.cc",
      "native/style/values/rmlui-style-values.cc",
      "native/style/values/rmlui-style-structs.cc",
      "native/style/values/rmlui-computed-values.cc",
      "native/style/values/rmlui-transform.cc",
      "native/style/values/rmlui-transform-state.cc",
      "native/style/values/rmlui-transform-values.cc",
      "native/events/rmlui-event-bridge.cc",
      "native/rendering/render-interface-sfml.cc",
      "native/rendering/geometry/render-geometry.cc",
      "native/rendering/geometry/geometry-batching.cc",
      "native/rendering/clipping/clip-masks.cc",
      "native/rendering/textures/render-textures.cc",
      "native/rendering/shaders/render-shaders.cc",
      "native/rendering/shaders/compile-shaders.cc",
      "native/rendering/shaders/gradient-program.cc",
      "native/rendering/effects/render-filters.cc",
      "native/rendering/effects/render-blur.cc",
      "native/rendering/layers/render-frame.cc",
      "native/rendering/layers/render-layers.cc",
      "native/rendering/layers/stencil-attachment.cc",
      "native/rendering/effects/color-filter.cc",
      "native/platform/system-interface-sfml.cc",
      "native/platform/rmlui-platform-sfml.cc",
      "native/platform/window-density.cc",
      "<@(rmlui_sources)",
      "<@(rmlui_debugger_sources)",
      "<@(rmlui_lua_sources)",
      "<@(rmlui_svg_sources)",
      "<@(rmlui_lottie_sources)",
      "<@(freetype_sources)"
    ],
    "include_dirs": [
      ".",
      "<!(node -e \"require('nan')\")",
      "<(sfml_include)",
      "<(interop_include)",
      "native",
      "third_party/rmlui/Include",
      "third_party/freetype/include",
      "third_party/lua/src",
      "third_party/lunasvg/include",
      "third_party/rlottie/inc"
    ],
    "defines": [
      "NDEBUG",
      "RMLUI_STATIC_LIB",
      "RMLUI_LUA_AS_CXX",
      "RMLUI_VERSION=\"6.3\"",
      "RMLUI_FONT_ENGINE_FREETYPE",
      "LUNASVG_BUILD_STATIC",
      "RLOTTIE_STATIC",
      "FT2_BUILD_LIBRARY",
      "SFML_RMLUI_HARFBUZZ=<(rmlui_harfbuzz)",
      "SFML_RMLUI_BITMAP_FONT=<(rmlui_bitmap_font)"
    ],
    "cflags_cc": ["-std=c++20", "-ffp-contract=off"],
    "cflags_cc!": ["-fno-exceptions"],
    "conditions": [
      ["rmlui_harfbuzz==1", {
        "sources": [
          "third_party/harfbuzz/src/harfbuzz.cc",
          "<@(rmlui_harfbuzz_sources)"
        ],
        "include_dirs": [
          "third_party/harfbuzz/src",
          "third_party/rmlui/Source/Core"
        ],
        "defines": ["HAVE_FREETYPE"]
      }],
      ["rmlui_bitmap_font==1", {
        "sources": ["<@(rmlui_bitmap_font_sources)"]
      }],
      ["OS=='mac'", {
        "sources": [
          "native/platform/window-density-macos.mm",
          "native/platform/ime/macos/text-input-events.mm",
          "native/platform/ime/macos/text-input-focus.mm",
          "native/platform/ime/macos/text-input-editing.mm",
          "native/platform/ime/macos/text-input-commands.mm"
        ],
        "xcode_settings": {
          "CLANG_CXX_LANGUAGE_STANDARD": "c++20",
          "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
          "OTHER_CPLUSPLUSFLAGS": ["-ffp-contract=off"],
          "MACOSX_DEPLOYMENT_TARGET": "13.0",
          "GCC_PREPROCESSOR_DEFINITIONS": [
            "NDEBUG=1",
            "RMLUI_STATIC_LIB=1",
            "FT2_BUILD_LIBRARY=1"
          ]
        },
        "libraries": [
          "<(sfml_lib)/libsfml-graphics.dylib",
          "<(sfml_lib)/libsfml-window.dylib",
          "<(sfml_lib)/libsfml-system.dylib",
          "-framework OpenGL",
          "-framework AppKit",
          "-Wl,-rpath,<(sfml_lib)"
        ]
      }],
      ["OS=='linux'", {
        "sources": [
          "native/platform/ime/x11/preedit-buffer.cc",
          "native/platform/ime/x11/text-input-preedit.cc",
          "native/platform/ime/x11/text-input-events.cc",
          "native/platform/ime/x11/text-input-focus.cc"
        ],
        "libraries": [
          "-L<(sfml_lib)",
          "-lsfml-graphics",
          "-lsfml-window",
          "-lsfml-system",
          "-ldl",
          "-lX11",
          "-lGL"
        ],
        "ldflags": [
          "-Wl,-rpath,<(sfml_lib)"
        ]
      }],
      ["OS=='win'", {
        "defines!": ["RMLUI_STATIC_LIB"],
        "sources": [
          "native/platform/ime/windows/composition-update.cc",
          "native/platform/ime/windows/text-input-events.cc",
          "native/platform/ime/windows/text-input-composition.cc",
          "native/platform/ime/windows/text-input-focus.cc"
        ],
        "defines": [
          "NDEBUG",
          "NOMINMAX",
          "_CRT_SECURE_NO_WARNINGS",
          "SFML_RMLUI_EXPORTS",
          "RMLUI_CORE_EXPORTS",
          "RMLUI_LUA_EXPORTS",
          "RMLUI_DEBUGGER_EXPORTS",
          "LUA_BUILD_AS_DLL",
          "LUA_CORE",
          "LUA_LIB",
          "FT2_BUILD_LIBRARY"
        ],
        "msvs_settings": {
          "VCCLCompilerTool": {
            "ExceptionHandling": 1,
            "AdditionalOptions": ["/std:c++20", "/fp:strict"]
          }
        },
        "libraries": [
          "<(sfml_lib)/sfml-graphics.lib",
          "<(sfml_lib)/sfml-window.lib",
          "<(sfml_lib)/sfml-system.lib",
          "imm32.lib",
          "opengl32.lib"
        ],
        "copies": [{
          "destination": "<(PRODUCT_DIR)",
          "files": [
            "<(sfml_bin)/sfml-graphics-3.dll",
            "<(sfml_bin)/sfml-window-3.dll",
            "<(sfml_bin)/sfml-system-3.dll"
          ]
        }]
      }]
    ]
  }]
}
