{
  "type": "loadable_module",
  "dependencies": ["rmlui"],
  "sources": [
    "native-application.cc",
    "../<(official_application)/native/application.cc",
    "../<(official_application)/native/high-scores.cc"
  ],
  "include_dirs": [
    "<(module_root_dir)",
    "<!(node -e \"require('nan')\")",
    "<(sfml_include)",
    "<(interop_include)",
    "<(module_root_dir)/vendor/rmlui/Include",
    "<(module_root_dir)/vendor/rmlui/Backends",
    "<(module_root_dir)/vendor/rmlui/Samples/shell/include",
    "<(module_root_dir)/vendor/rmlui/Samples/<(official_application)/src",
    "<(module_root_dir)/third_party/lua/src"
  ],
  "defines": ["NDEBUG", "RMLUI_LUA_AS_CXX"],
  "cflags_cc": ["-std=c++20"],
  "cflags_cc!": ["-fno-exceptions"],
  "conditions": [
    ["OS=='mac'", {
      "defines": ["RMLUI_STATIC_LIB"],
      "xcode_settings": {
        "CLANG_CXX_LANGUAGE_STANDARD": "c++20",
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "MACOSX_DEPLOYMENT_TARGET": "13.0"
      }
    }],
    ["OS=='linux'", {
      "defines": ["RMLUI_STATIC_LIB"],
      "ldflags": ["-Wl,-Bsymbolic"]
    }],
    ["OS=='win'", {
      "defines": [
        "NOMINMAX",
        "_CRT_SECURE_NO_WARNINGS",
        "LUA_BUILD_AS_DLL"
      ],
      "libraries": ["<(PRODUCT_DIR)/rmlui.lib"],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "AdditionalOptions": ["/std:c++20"]
        }
      }
    }]
  ]
}
