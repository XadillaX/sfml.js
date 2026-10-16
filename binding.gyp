{
  "targets": [{
    "target_name": "sfml",
    "sources": [
      "native/addon.cc",
      "native/deferred-delete.cc",
      "native/system-binding.cc",
      "native/audio-binding.cc",
      "native/audio-file-binding.cc",
      "native/audio-device-binding.cc",
      "native/audio-worker-binding.cc",
      "native/audio-recorder-binding.cc",
      "native/audio-stream-binding.cc",
      "native/audio-codec-binding.cc",
      "native/error-stream-binding.cc",
      "native/context-binding.cc",
      "native/values-binding.cc",
      "native/graphics-binding.cc",
      "native/texture-binding.cc",
      "native/batch-drawable.cc",
      "native/vertex-binding.cc",
      "native/vertex-buffer-binding.cc",
      "native/shader-binding.cc",
      "native/image-binding.cc",
      "native/stream-binding.cc",
      "native/window-binding.cc",
      "native/render-window-binding.cc",
      "native/input-binding.cc",
      "native/transformable-binding.cc",
      "native/shape-binding.cc",
      "native/font-binding.cc",
      "native/text-binding.cc",
      "test/native/value-probes.cc",
      "test/native/deferred-delete-probes.cc",
      "test/native/exception-probes.cc",
      "test/native/time-probes.cc",
      "test/native/system-probes.cc",
      "test/native/audio-probes.cc",
      "test/native/transform-probes.cc",
      "test/native/matrix-probes.cc",
      "test/native/image-probes.cc",
      "test/native/transformable-probes.cc",
      "test/native/sprite-probes.cc",
      "test/native/shape-probes.cc",
      "test/native/text-probes.cc",
      "test/native/drawable-probes.cc",
      "test/native/vertex-array-probes.cc",
      "test/native/vertex-buffer-probes.cc",
      "test/native/shader-probes.cc",
      "test/native/texture-probes.cc",
      "test/native/render-texture-probes.cc",
      "test/native/view-probes.cc",
      "test/native/window-probes.cc"
    ],
    "include_dirs": [
      "<!(node -e \"require('nan')\")",
      "<(module_root_dir)/third_party/sfml/include"
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
          "<(module_root_dir)/third_party/sfml/lib/libsfml-graphics.dylib",
          "<(module_root_dir)/third_party/sfml/lib/libsfml-audio.dylib",
          "<(module_root_dir)/third_party/sfml/lib/libsfml-window.dylib",
          "<(module_root_dir)/third_party/sfml/lib/libsfml-system.dylib",
          "-Wl,-rpath,@loader_path/../../third_party/sfml/lib"
        ]
      }],
      ["OS=='linux'", {
        "libraries": [
          "-L<(module_root_dir)/third_party/sfml/lib",
          "-lsfml-graphics",
          "-lsfml-audio",
          "-lsfml-window",
          "-lsfml-system",
          "-lGL"
        ],
        "ldflags": ["-Wl,-rpath,'$$ORIGIN/../../third_party/sfml/lib'"]
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
          "<(module_root_dir)/third_party/sfml/lib/sfml-graphics.lib",
          "<(module_root_dir)/third_party/sfml/lib/sfml-audio.lib",
          "<(module_root_dir)/third_party/sfml/lib/sfml-window.lib",
          "<(module_root_dir)/third_party/sfml/lib/sfml-system.lib",
          "opengl32.lib"
        ],
        "copies": [{
          "destination": "<(PRODUCT_DIR)",
          "files": [
            "<(module_root_dir)/third_party/sfml/bin/sfml-graphics-3.dll",
            "<(module_root_dir)/third_party/sfml/bin/sfml-audio-3.dll",
            "<(module_root_dir)/third_party/sfml/bin/sfml-window-3.dll",
            "<(module_root_dir)/third_party/sfml/bin/sfml-system-3.dll"
          ]
        }]
      }]
    ]
  }]
}
