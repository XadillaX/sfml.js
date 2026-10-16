// Generated from SFML headers; do not edit.
// Regenerate with npm run generate:window.

/** 窗口样式位标志，可按位组合。 */
export enum Style {
  /** No border / title bar (this flag and all others are mutually exclusive) */
  None = 0,
  /** Title bar + fixed border */
  Titlebar = 1,
  /** Title bar + resizable border + maximize button */
  Resize = 2,
  /** Title bar + close button (see note) */
  Close = 4,
  /** Default window style */
  Default = 7,
}

/** 窗口初始显示状态。 */
export enum State {
  /** Floating window */
  Windowed = 0,
  /** Fullscreen window */
  Fullscreen = 1,
}

/** 系统光标形状，具体支持情况取决于平台。 */
export enum CursorType {
  /** Arrow cursor (default) */
  Arrow = 0,
  /** Busy arrow cursor */
  ArrowWait = 1,
  /** Busy cursor */
  Wait = 2,
  /** I-beam, cursor when hovering over a field allowing text entry */
  Text = 3,
  /** Pointing hand cursor */
  Hand = 4,
  /** Horizontal double arrow cursor */
  SizeHorizontal = 5,
  /** Vertical double arrow cursor */
  SizeVertical = 6,
  /** Double arrow cursor going from top-left to bottom-right */
  SizeTopLeftBottomRight = 7,
  /** Double arrow cursor going from bottom-left to top-right */
  SizeBottomLeftTopRight = 8,
  /** Left arrow cursor on Linux, same as SizeHorizontal on other platforms */
  SizeLeft = 9,
  /** Right arrow cursor on Linux, same as SizeHorizontal on other platforms */
  SizeRight = 10,
  /** Up arrow cursor on Linux, same as SizeVertical on other platforms */
  SizeTop = 11,
  /** Down arrow cursor on Linux, same as SizeVertical on other platforms */
  SizeBottom = 12,
  /** Top-left arrow cursor on Linux, same as SizeTopLeftBottomRight on other platforms */
  SizeTopLeft = 13,
  /** Bottom-right arrow cursor on Linux, same as SizeTopLeftBottomRight on other platforms */
  SizeBottomRight = 14,
  /** Bottom-left arrow cursor on Linux, same as SizeBottomLeftTopRight on other platforms */
  SizeBottomLeft = 15,
  /** Top-right arrow cursor on Linux, same as SizeBottomLeftTopRight on other platforms */
  SizeTopRight = 16,
  /** Combination of SizeHorizontal and SizeVertical */
  SizeAll = 17,
  /** Crosshair cursor */
  Cross = 18,
  /** Help cursor */
  Help = 19,
  /** Action not allowed cursor */
  NotAllowed = 20,
}

/** 随系统键盘布局变化的逻辑按键。 */
export enum KeyboardKey {
  /** Unhandled key */
  Unknown = -1,
  /** The A key */
  A = 0,
  /** The B key */
  B = 1,
  /** The C key */
  C = 2,
  /** The D key */
  D = 3,
  /** The E key */
  E = 4,
  /** The F key */
  F = 5,
  /** The G key */
  G = 6,
  /** The H key */
  H = 7,
  /** The I key */
  I = 8,
  /** The J key */
  J = 9,
  /** The K key */
  K = 10,
  /** The L key */
  L = 11,
  /** The M key */
  M = 12,
  /** The N key */
  N = 13,
  /** The O key */
  O = 14,
  /** The P key */
  P = 15,
  /** The Q key */
  Q = 16,
  /** The R key */
  R = 17,
  /** The S key */
  S = 18,
  /** The T key */
  T = 19,
  /** The U key */
  U = 20,
  /** The V key */
  V = 21,
  /** The W key */
  W = 22,
  /** The X key */
  X = 23,
  /** The Y key */
  Y = 24,
  /** The Z key */
  Z = 25,
  /** The 0 key */
  Num0 = 26,
  /** The 1 key */
  Num1 = 27,
  /** The 2 key */
  Num2 = 28,
  /** The 3 key */
  Num3 = 29,
  /** The 4 key */
  Num4 = 30,
  /** The 5 key */
  Num5 = 31,
  /** The 6 key */
  Num6 = 32,
  /** The 7 key */
  Num7 = 33,
  /** The 8 key */
  Num8 = 34,
  /** The 9 key */
  Num9 = 35,
  /** The Escape key */
  Escape = 36,
  /** The left Control key */
  LControl = 37,
  /** The left Shift key */
  LShift = 38,
  /** The left Alt key */
  LAlt = 39,
  /** The left OS specific key: window (Windows and Linux), apple (macOS), ... */
  LSystem = 40,
  /** The right Control key */
  RControl = 41,
  /** The right Shift key */
  RShift = 42,
  /** The right Alt key */
  RAlt = 43,
  /** The right OS specific key: window (Windows and Linux), apple (macOS), ... */
  RSystem = 44,
  /** The Menu key */
  Menu = 45,
  /** The [ key */
  LBracket = 46,
  /** The ] key */
  RBracket = 47,
  /** The ; key */
  Semicolon = 48,
  /** The , key */
  Comma = 49,
  /** The . key */
  Period = 50,
  /** The ' key */
  Apostrophe = 51,
  /** The / key */
  Slash = 52,
  /** The \ key */
  Backslash = 53,
  /** The ` key */
  Grave = 54,
  /** The = key */
  Equal = 55,
  /** The - key (hyphen) */
  Hyphen = 56,
  /** The Space key */
  Space = 57,
  /** The Enter/Return keys */
  Enter = 58,
  /** The Backspace key */
  Backspace = 59,
  /** The Tabulation key */
  Tab = 60,
  /** The Page up key */
  PageUp = 61,
  /** The Page down key */
  PageDown = 62,
  /** The End key */
  End = 63,
  /** The Home key */
  Home = 64,
  /** The Insert key */
  Insert = 65,
  /** The Delete key */
  Delete = 66,
  /** The + key */
  Add = 67,
  /** The - key (minus, usually from numpad) */
  Subtract = 68,
  /** The * key */
  Multiply = 69,
  /** The / key */
  Divide = 70,
  /** Left arrow */
  Left = 71,
  /** Right arrow */
  Right = 72,
  /** Up arrow */
  Up = 73,
  /** Down arrow */
  Down = 74,
  /** The numpad 0 key */
  Numpad0 = 75,
  /** The numpad 1 key */
  Numpad1 = 76,
  /** The numpad 2 key */
  Numpad2 = 77,
  /** The numpad 3 key */
  Numpad3 = 78,
  /** The numpad 4 key */
  Numpad4 = 79,
  /** The numpad 5 key */
  Numpad5 = 80,
  /** The numpad 6 key */
  Numpad6 = 81,
  /** The numpad 7 key */
  Numpad7 = 82,
  /** The numpad 8 key */
  Numpad8 = 83,
  /** The numpad 9 key */
  Numpad9 = 84,
  /** The F1 key */
  F1 = 85,
  /** The F2 key */
  F2 = 86,
  /** The F3 key */
  F3 = 87,
  /** The F4 key */
  F4 = 88,
  /** The F5 key */
  F5 = 89,
  /** The F6 key */
  F6 = 90,
  /** The F7 key */
  F7 = 91,
  /** The F8 key */
  F8 = 92,
  /** The F9 key */
  F9 = 93,
  /** The F10 key */
  F10 = 94,
  /** The F11 key */
  F11 = 95,
  /** The F12 key */
  F12 = 96,
  /** The F13 key */
  F13 = 97,
  /** The F14 key */
  F14 = 98,
  /** The F15 key */
  F15 = 99,
  /** The Pause key */
  Pause = 100,
}

/** 与键盘布局无关的物理按键。 */
export enum KeyboardScancode {
  /** Represents any scancode not present in this enum */
  Unknown = -1,
  /** Keyboard a and A key */
  A = 0,
  /** Keyboard b and B key */
  B = 1,
  /** Keyboard c and C key */
  C = 2,
  /** Keyboard d and D key */
  D = 3,
  /** Keyboard e and E key */
  E = 4,
  /** Keyboard f and F key */
  F = 5,
  /** Keyboard g and G key */
  G = 6,
  /** Keyboard h and H key */
  H = 7,
  /** Keyboard i and I key */
  I = 8,
  /** Keyboard j and J key */
  J = 9,
  /** Keyboard k and K key */
  K = 10,
  /** Keyboard l and L key */
  L = 11,
  /** Keyboard m and M key */
  M = 12,
  /** Keyboard n and N key */
  N = 13,
  /** Keyboard o and O key */
  O = 14,
  /** Keyboard p and P key */
  P = 15,
  /** Keyboard q and Q key */
  Q = 16,
  /** Keyboard r and R key */
  R = 17,
  /** Keyboard s and S key */
  S = 18,
  /** Keyboard t and T key */
  T = 19,
  /** Keyboard u and U key */
  U = 20,
  /** Keyboard v and V key */
  V = 21,
  /** Keyboard w and W key */
  W = 22,
  /** Keyboard x and X key */
  X = 23,
  /** Keyboard y and Y key */
  Y = 24,
  /** Keyboard z and Z key */
  Z = 25,
  /** Keyboard 1 and ! key */
  Num1 = 26,
  /** Keyboard 2 and @ key */
  Num2 = 27,
  /** Keyboard 3 and # key */
  Num3 = 28,
  /** Keyboard 4 and $ key */
  Num4 = 29,
  /** Keyboard 5 and % key */
  Num5 = 30,
  /** Keyboard 6 and ^ key */
  Num6 = 31,
  /** Keyboard 7 and & key */
  Num7 = 32,
  /** Keyboard 8 and * key */
  Num8 = 33,
  /** Keyboard 9 and ) key */
  Num9 = 34,
  /** Keyboard 0 and ) key */
  Num0 = 35,
  /** Keyboard Enter/Return key */
  Enter = 36,
  /** Keyboard Escape key */
  Escape = 37,
  /** Keyboard Backspace key */
  Backspace = 38,
  /** Keyboard Tab key */
  Tab = 39,
  /** Keyboard Space key */
  Space = 40,
  /** Keyboard - and _ key */
  Hyphen = 41,
  /** Keyboard = and + */
  Equal = 42,
  /** Keyboard [ and { key */
  LBracket = 43,
  /** Keyboard ] and } key */
  RBracket = 44,
  /** Keyboard \ and | key OR various keys for Non-US keyboards */
  Backslash = 45,
  /** Keyboard ; and : key */
  Semicolon = 46,
  /** Keyboard ' and " key */
  Apostrophe = 47,
  /** Keyboard ` and ~ key */
  Grave = 48,
  /** Keyboard , and < key */
  Comma = 49,
  /** Keyboard . and > key */
  Period = 50,
  /** Keyboard / and ? key */
  Slash = 51,
  /** Keyboard F1 key */
  F1 = 52,
  /** Keyboard F2 key */
  F2 = 53,
  /** Keyboard F3 key */
  F3 = 54,
  /** Keyboard F4 key */
  F4 = 55,
  /** Keyboard F5 key */
  F5 = 56,
  /** Keyboard F6 key */
  F6 = 57,
  /** Keyboard F7 key */
  F7 = 58,
  /** Keyboard F8 key */
  F8 = 59,
  /** Keyboard F9 key */
  F9 = 60,
  /** Keyboard F10 key */
  F10 = 61,
  /** Keyboard F11 key */
  F11 = 62,
  /** Keyboard F12 key */
  F12 = 63,
  /** Keyboard F13 key */
  F13 = 64,
  /** Keyboard F14 key */
  F14 = 65,
  /** Keyboard F15 key */
  F15 = 66,
  /** Keyboard F16 key */
  F16 = 67,
  /** Keyboard F17 key */
  F17 = 68,
  /** Keyboard F18 key */
  F18 = 69,
  /** Keyboard F19 key */
  F19 = 70,
  /** Keyboard F20 key */
  F20 = 71,
  /** Keyboard F21 key */
  F21 = 72,
  /** Keyboard F22 key */
  F22 = 73,
  /** Keyboard F23 key */
  F23 = 74,
  /** Keyboard F24 key */
  F24 = 75,
  /** Keyboard Caps %Lock key */
  CapsLock = 76,
  /** Keyboard Print Screen key */
  PrintScreen = 77,
  /** Keyboard Scroll %Lock key */
  ScrollLock = 78,
  /** Keyboard Pause key */
  Pause = 79,
  /** Keyboard Insert key */
  Insert = 80,
  /** Keyboard Home key */
  Home = 81,
  /** Keyboard Page Up key */
  PageUp = 82,
  /** Keyboard Delete Forward key */
  Delete = 83,
  /** Keyboard End key */
  End = 84,
  /** Keyboard Page Down key */
  PageDown = 85,
  /** Keyboard Right Arrow key */
  Right = 86,
  /** Keyboard Left Arrow key */
  Left = 87,
  /** Keyboard Down Arrow key */
  Down = 88,
  /** Keyboard Up Arrow key */
  Up = 89,
  /** Keypad Num %Lock and Clear key */
  NumLock = 90,
  /** Keypad / key */
  NumpadDivide = 91,
  /** Keypad * key */
  NumpadMultiply = 92,
  /** Keypad - key */
  NumpadMinus = 93,
  /** Keypad + key */
  NumpadPlus = 94,
  /** keypad = key */
  NumpadEqual = 95,
  /** Keypad Enter/Return key */
  NumpadEnter = 96,
  /** Keypad . and Delete key */
  NumpadDecimal = 97,
  /** Keypad 1 and End key */
  Numpad1 = 98,
  /** Keypad 2 and Down Arrow key */
  Numpad2 = 99,
  /** Keypad 3 and Page Down key */
  Numpad3 = 100,
  /** Keypad 4 and Left Arrow key */
  Numpad4 = 101,
  /** Keypad 5 key */
  Numpad5 = 102,
  /** Keypad 6 and Right Arrow key */
  Numpad6 = 103,
  /** Keypad 7 and Home key */
  Numpad7 = 104,
  /** Keypad 8 and Up Arrow key */
  Numpad8 = 105,
  /** Keypad 9 and Page Up key */
  Numpad9 = 106,
  /** Keypad 0 and Insert key */
  Numpad0 = 107,
  /** Keyboard Non-US \ and | key */
  NonUsBackslash = 108,
  /** Keyboard Application key */
  Application = 109,
  /** Keyboard Execute key */
  Execute = 110,
  /** Keyboard Mode Change key */
  ModeChange = 111,
  /** Keyboard Help key */
  Help = 112,
  /** Keyboard Menu key */
  Menu = 113,
  /** Keyboard Select key */
  Select = 114,
  /** Keyboard Redo key */
  Redo = 115,
  /** Keyboard Undo key */
  Undo = 116,
  /** Keyboard Cut key */
  Cut = 117,
  /** Keyboard Copy key */
  Copy = 118,
  /** Keyboard Paste key */
  Paste = 119,
  /** Keyboard Volume Mute key */
  VolumeMute = 120,
  /** Keyboard Volume Up key */
  VolumeUp = 121,
  /** Keyboard Volume Down key */
  VolumeDown = 122,
  /** Keyboard Media Play Pause key */
  MediaPlayPause = 123,
  /** Keyboard Media Stop key */
  MediaStop = 124,
  /** Keyboard Media Next Track key */
  MediaNextTrack = 125,
  /** Keyboard Media Previous Track key */
  MediaPreviousTrack = 126,
  /** Keyboard Left Control key */
  LControl = 127,
  /** Keyboard Left Shift key */
  LShift = 128,
  /** Keyboard Left Alt key */
  LAlt = 129,
  /** Keyboard Left System key */
  LSystem = 130,
  /** Keyboard Right Control key */
  RControl = 131,
  /** Keyboard Right Shift key */
  RShift = 132,
  /** Keyboard Right Alt key */
  RAlt = 133,
  /** Keyboard Right System key */
  RSystem = 134,
  /** Keyboard Back key */
  Back = 135,
  /** Keyboard Forward key */
  Forward = 136,
  /** Keyboard Refresh key */
  Refresh = 137,
  /** Keyboard Stop key */
  Stop = 138,
  /** Keyboard Search key */
  Search = 139,
  /** Keyboard Favorites key */
  Favorites = 140,
  /** Keyboard Home Page key */
  HomePage = 141,
  /** Keyboard Launch Application 1 key */
  LaunchApplication1 = 142,
  /** Keyboard Launch Application 2 key */
  LaunchApplication2 = 143,
  /** Keyboard Launch Mail key */
  LaunchMail = 144,
  /** Keyboard Launch Media Select key */
  LaunchMediaSelect = 145,
}

/** 鼠标按钮。 */
export enum MouseButton {
  /** The left mouse button */
  Left = 0,
  /** The right mouse button */
  Right = 1,
  /** The middle (wheel) mouse button */
  Middle = 2,
  /** The first extra mouse button */
  Extra1 = 3,
  /** The second extra mouse button */
  Extra2 = 4,
}

/** 鼠标滚轮方向。 */
export enum MouseWheel {
  /** The vertical mouse wheel */
  Vertical = 0,
  /** The horizontal mouse wheel */
  Horizontal = 1,
}

/** 游戏手柄坐标轴。 */
export enum JoystickAxis {
  /** The X axis */
  X = 0,
  /** The Y axis */
  Y = 1,
  /** The Z axis */
  Z = 2,
  /** The R axis */
  R = 3,
  /** The U axis */
  U = 4,
  /** The V axis */
  V = 5,
  /** The X axis of the point-of-view hat */
  PovX = 6,
  /** The Y axis of the point-of-view hat */
  PovY = 7,
}

/** 传感器类型。 */
export enum SensorType {
  /** Measures the raw acceleration (m/s^2) */
  Accelerometer = 0,
  /** Measures the raw rotation rates (radians/s) */
  Gyroscope = 1,
  /** Measures the ambient magnetic field (micro-teslas) */
  Magnetometer = 2,
  /** Measures the direction and intensity of gravity, independent of device acceleration (m/s^2) */
  Gravity = 3,
  /** Measures the direction and intensity of device acceleration, independent of the gravity (m/s^2) */
  UserAcceleration = 4,
  /** Measures the absolute 3D orientation (radians) */
  Orientation = 5,
}

/** SFML Keyboard 的 KeyCount 数量上限。 */
export const KeyboardKeyCount = 101;

/** SFML Keyboard 的 ScancodeCount 数量上限。 */
export const KeyboardScancodeCount = 146;

/** SFML Mouse 的 ButtonCount 数量上限。 */
export const MouseButtonCount = 5;

/** SFML Joystick 的 Count 数量上限。 */
export const JoystickCount = 8;

/** SFML Joystick 的 ButtonCount 数量上限。 */
export const JoystickButtonCount = 32;

/** SFML Joystick 的 AxisCount 数量上限。 */
export const JoystickAxisCount = 8;

/** SFML Sensor 的 Count 数量上限。 */
export const SensorCount = 6;
