{
  "targets": [{
    "target_name": "mouse_button.cc",
    "type": "none",
    "sources": [
      "./third_party/SFML-2.5.1/include/SFML/Window/Mouse.hpp",
      "./tools/mouse_button.js"
    ],
    "actions": [{
      "action_name": "gen_mouse_button",
      "inputs": [
        "./third_party/SFML-2.5.1/include/SFML/Window/Mouse.hpp",
        "./tools/mouse_button.js"
      ],
      "outputs": [
        "./src/gen/mouse_button.cc"
      ],
      "action": [
        "node",
        "./tools/mouse_button.js"
      ]
    }]
  }, {
    "target_name": "keycode.cc",
    "type": "none",
    "sources": [
      "./third_party/SFML-2.5.1/include/SFML/Window/Keyboard.hpp",
      "./tools/keycode.js"
    ],
    "actions": [{
      "action_name": "gen_keycode",
      "inputs": [
        "./third_party/SFML-2.5.1/include/SFML/Window/Keyboard.hpp",
        "./tools/keycode.js"
      ],
      "outputs": [
        "./src/gen/keycode.cc"
      ],
      "action": [
        "node",
        "./tools/keycode.js"
      ]
    }]
  }, {
    "target_name": "binding",
    "include_dirs": [
      "./third_party/SFML-2.5.1/include",
      "<!(node -e \"require('nan')\")"
    ],
    "conditions": [
      ["OS==\"linux\"", {
        "libraries": [
          "../third_party/SFML-2.5.1/lib/libsfml-audio.so",
          "../third_party/SFML-2.5.1/lib/libsfml-system.so",
          "../third_party/SFML-2.5.1/lib/libsfml-window.so",
          "../third_party/SFML-2.5.1/lib/libsfml-network.so",
          "../third_party/SFML-2.5.1/lib/libsfml-graphics.so"
        ]
      }],
      ["OS==\"mac\"", {
        "libraries": [
          "../third_party/SFML-2.5.1/macOS/lib/libsfml-audio.dylib",
          "../third_party/SFML-2.5.1/macOS/lib/libsfml-system.dylib",
          "../third_party/SFML-2.5.1/macOS/lib/libsfml-window.dylib",
          "../third_party/SFML-2.5.1/macOS/lib/libsfml-network.dylib",
          "../third_party/SFML-2.5.1/macOS/lib/libsfml-graphics.dylib"
        ],
        "link_settings": {
          "libraries": [
            "-Wl,-rpath,@loader_path",
            "-Wl,-rpath,@loader_path/..",
            "-Wl,-rpath,@loader_path/../../third_party/SFML-2.5.1/macOS/lib"
          ]
        }
      }]
    ],
    "sources": [
      "./src/sfml.cc",

      "./src/clock.cc",
      "./src/color.cc",
      "./src/keyboard.cc",
      "./src/mouse.cc",
      "./src/poll_event.cc",
      "./src/rect.cc",
      "./src/render_window.cc",
      "./src/time.cc",
      "./src/vector2.cc",
      "./src/video_mode.cc",

      "./src/drawable/circle_shape.cc",

      "./src/gen/keycode.cc",
      "./src/gen/mouse_button.cc"
    ],
    "dependencies": [
      "keycode.cc",
      "mouse_button.cc"
    ]
  }]
}
