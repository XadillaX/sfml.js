{
  "variables": {
    "sfml_include": "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlInclude)\")",
    "sfml_lib": "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlLib)\")",
    "sfml_bin": "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlBin)\")",
    "interop_include": "<!(node -e \"process.stdout.write(require('sfml.js-interop'))\")"
  },
  "targets": [{
    "target_name": "imgui",
    "sources": [
      "native/addon.cc",
      "native/imgui-context.cc",
      "native/imgui-integration.cc",
      "native/imgui-formatted.cc",
      "native/imgui-font-ranges.cc",
      "native/imgui-callbacks.cc",
      "native/imgui-references.cc",
      "native/imgui-values.cc",
      "native/imgui-draw-callbacks.cc",
      "native/imgui-frame.cc",
      "native/imgui-debug.cc",
      "native/imgui-windows.cc",
      "native/imgui-style.cc",
      "native/imgui-layout.cc",
      "native/imgui-items.cc",
      "native/imgui-text.cc",
      "native/imgui-widgets.cc",
      "native/imgui-drag-widgets.cc",
      "native/imgui-slider-widgets.cc",
      "native/imgui-input-widgets.cc",
      "native/imgui-selection.cc",
      "native/imgui-popups.cc",
      "native/imgui-tables.cc",
      "native/imgui-drag-drop.cc",
      "native/imgui-input.cc",
      "native/imgui-io.cc",
      "native/imgui-storage.cc",
      "native/imgui-utilities.cc",
      "native/imgui-drawing.cc",
      "native/imgui-draw-paths.cc",
      "native/imgui-draw-primitives.cc",
      "native/imgui-font.cc",
      "native/imgui-glyph-fields.cc",
      "native/imgui-struct-views.cc",
      "third_party/imgui/imgui.cpp",
      "third_party/imgui/imgui_draw.cpp",
      "third_party/imgui/imgui_tables.cpp",
      "third_party/imgui/imgui_widgets.cpp",
      "third_party/imgui/imgui_demo.cpp",
      "third_party/imgui/misc/cpp/imgui_stdlib.cpp",
      "third_party/imgui-sfml/imgui-SFML.cpp",
      "third_party/dcimgui/dcimgui.cpp"
    ],
    "include_dirs": [
      ".",
      "<!(node -e \"require('nan')\")",
      "<(sfml_include)",
      "<(interop_include)",
      "native",
      "third_party/imgui",
      "third_party/imgui/misc/cpp",
      "third_party/imgui-sfml",
      "third_party/dcimgui"
    ],
    "defines": [
      "IMGUI_USER_CONFIG=\"imconfig-SFML.h\"",
      "IMGUI_DEFINE_MATH_OPERATORS"
    ],
    "cflags_cc": ["-std=c++20", "-ffp-contract=off"],
    "cflags_cc!": ["-fno-exceptions"],
    "conditions": [
      ["OS=='mac'", {
        "xcode_settings": {
          "CLANG_CXX_LANGUAGE_STANDARD": "c++20",
          "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
          "OTHER_CPLUSPLUSFLAGS": ["-ffp-contract=off"],
          "MACOSX_DEPLOYMENT_TARGET": "13.0"
        },
        "libraries": [
          "<(sfml_lib)/libsfml-graphics.dylib",
          "<(sfml_lib)/libsfml-window.dylib",
          "<(sfml_lib)/libsfml-system.dylib",
          "-framework",
          "OpenGL",
          "-Wl,-rpath,<(sfml_lib)"
        ]
      }],
      ["OS=='linux'", {
        "libraries": [
          "-L<(sfml_lib)",
          "-lsfml-graphics",
          "-lsfml-window",
          "-lsfml-system",
          "-lGL"
        ],
        "ldflags": [
          "-Wl,-rpath,<(sfml_lib)"
        ]
      }],
      ["OS=='win'", {
        "defines": ["NOMINMAX"],
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
