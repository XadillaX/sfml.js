{
  "targets": [{
    "target_name": "mouse_button.cc",
    "type": "none",
    "sources": [
      "./third_party/sfml/include/SFML/Window/Mouse.hpp",
      "./tools/mouse_button.js"
    ],
    "actions": [{
      "action_name": "gen_mouse_button",
      "inputs": [
        "./third_party/sfml/include/SFML/Window/Mouse.hpp",
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
      "./third_party/sfml/include/SFML/Window/Keyboard.hpp",
      "./tools/keycode.js"
    ],
    "actions": [{
      "action_name": "gen_keycode",
      "inputs": [
        "./third_party/sfml/include/SFML/Window/Keyboard.hpp",
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
    "target_name": "joystick_axis.cc",
    "type": "none",
    "sources": [
      "./third_party/sfml/include/SFML/Window/Joystick.hpp",
      "./tools/joystick_axis.js"
    ],
    "actions": [{
      "action_name": "gen_joystick_axis",
      "inputs": [
        "./third_party/sfml/include/SFML/Window/Joystick.hpp",
        "./tools/joystick_axis.js"
      ],
      "outputs": [
        "./src/gen/joystick_axis.cc"
      ],
      "action": [
        "node",
        "./tools/joystick_axis.js"
      ]
    }]
  }, {
    "target_name": "sensor_type.cc",
    "type": "none",
    "sources": [
      "./third_party/sfml/include/SFML/Window/Sensor.hpp",
      "./tools/sensor_type.js"
    ],
    "actions": [{
      "action_name": "gen_sensor_type",
      "inputs": [
        "./third_party/sfml/include/SFML/Window/Sensor.hpp",
        "./tools/sensor_type.js"
      ],
      "outputs": [
        "./src/gen/sensor_type.cc"
      ],
      "action": [
        "node",
        "./tools/sensor_type.js"
      ]
    }]
  }, {
    "target_name": "binding",
    "include_dirs": [
      "./third_party/sfml/include",
      "<!(node -e \"require('nan')\")"
    ],
    "conditions": [
      ["OS==\"linux\"", {
        "libraries": [
          "../third_party/sfml/platform/linux/lib/libsfml-audio.so",
          "../third_party/sfml/platform/linux/lib/libsfml-system.so",
          "../third_party/sfml/platform/linux/lib/libsfml-window.so",
          "../third_party/sfml/platform/linux/lib/libsfml-network.so",
          "../third_party/sfml/platform/linux/lib/libsfml-graphics.so"
        ],
        "ldflags": [
          "-Wl,-rpath='$$ORIGIN/../../third_party/sfml/platform/linux/lib'"
        ]
      }],
      ["OS==\"win\"", {
        "defines": [
          "NOMINMAX"
        ],
        "copies": [{
          "destination": "<(module_root_dir)/build/Release/",
          "files": [
            "<(module_root_dir)/third_party/sfml/platform/win/bin/openal32.dll",
            "<(module_root_dir)/third_party/sfml/platform/win/bin/sfml-audio-2.dll",
            "<(module_root_dir)/third_party/sfml/platform/win/bin/sfml-graphics-2.dll",
            "<(module_root_dir)/third_party/sfml/platform/win/bin/sfml-network-2.dll",
            "<(module_root_dir)/third_party/sfml/platform/win/bin/sfml-system-2.dll",
            "<(module_root_dir)/third_party/sfml/platform/win/bin/sfml-window-2.dll"
          ]
        }],
        "libraries": [
          "../third_party/sfml/platform/win/lib/flac.lib",
          "../third_party/sfml/platform/win/lib/freetype.lib",
          "../third_party/sfml/platform/win/lib/ogg.lib",
          "../third_party/sfml/platform/win/lib/openal32.lib",
          "../third_party/sfml/platform/win/lib/sfml-audio.lib",
          "../third_party/sfml/platform/win/lib/sfml-graphics.lib",
          "../third_party/sfml/platform/win/lib/sfml-main.lib",
          "../third_party/sfml/platform/win/lib/sfml-network.lib",
          "../third_party/sfml/platform/win/lib/sfml-system.lib",
          "../third_party/sfml/platform/win/lib/sfml-window.lib",
          "../third_party/sfml/platform/win/lib/vorbis.lib",
          "../third_party/sfml/platform/win/lib/vorbisenc.lib",
          "../third_party/sfml/platform/win/lib/vorbisfile.lib",
        ],
      }],
      ["OS==\"mac\"", {
        "libraries": [
          "../third_party/sfml/platform/macOS/lib/libsfml-audio.dylib",
          "../third_party/sfml/platform/macOS/lib/libsfml-system.dylib",
          "../third_party/sfml/platform/macOS/lib/libsfml-window.dylib",
          "../third_party/sfml/platform/macOS/lib/libsfml-network.dylib",
          "../third_party/sfml/platform/macOS/lib/libsfml-graphics.dylib"
        ],
        "link_settings": {
          "libraries": [
            "-Wl,-rpath,@loader_path",
            "-Wl,-rpath,@loader_path/..",
            "-Wl,-rpath,@loader_path/../../third_party/sfml/platform/macOS/lib"
          ]
        }
      }]
    ],
    "sources": [
      "./src/sfml.cc",

      "./src/clock.cc",
      "./src/color.cc",
      "./src/font.cc",
      "./src/image.cc",
      "./src/joystick.cc",
      "./src/keyboard.cc",
      "./src/mouse.cc",
      "./src/poll_event.cc",
      "./src/rect.cc",
      "./src/render_window.cc",
      "./src/render_window_async_display.cc",
      "./src/render_window_async_draw.cc",
      "./src/sensor.cc",
      "./src/touch.cc",
      "./src/texture.cc",
      "./src/time.cc",
      "./src/vector2.cc",
      "./src/vector3.cc",
      "./src/vertex.cc",
      "./src/video_mode.cc",

      "./src/drawable/circle_shape.cc",
      "./src/drawable/convex_shape.cc",
      "./src/drawable/drawable.cc",
      "./src/drawable/rectangle_shape.cc",
      "./src/drawable/shape.cc",
      "./src/drawable/sprite.cc",
      "./src/drawable/text.cc",
      "./src/drawable/vertex_array.cc",

      "./src/gen/joystick_axis.cc",
      "./src/gen/keycode.cc",
      "./src/gen/mouse_button.cc",
      "./src/gen/sensor_type.cc",

      "./src/sound/music.cc",
      "./src/sound/sound.cc",
      "./src/sound/sound_buffer.cc",
      "./src/sound/sound_source.cc"
    ],
    "dependencies": [
      "keycode.cc",
      "joystick_axis.cc",
      "sensor_type.cc",
      "mouse_button.cc"
    ]
  }]
}
