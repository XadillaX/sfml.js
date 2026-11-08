import {
  Keyboard, Mouse, Joystick, Sensor, Window, Vector2i, Vector2u, Vector3f,
  KeyboardKey, KeyboardScancode, MouseButton, JoystickAxis, SensorType,
} from '../src';

const key: Keyboard.Key = Keyboard.Key.A;
const scan: Keyboard.Scancode = Keyboard.Scancode.A;
const legacyScan: Keyboard.Scan = Keyboard.Scan.A;
const pressed: boolean = Keyboard.isKeyPressed(key);
const physical: boolean = Keyboard.isKeyPressed(scan, 'scancode');
const localized: KeyboardKey = Keyboard.localize(scan);
const delocalized: KeyboardScancode = Keyboard.delocalize(key);
const description: string = Keyboard.getDescription(scan);
Keyboard.setVirtualKeyboardVisible(false);

const window = new Window();
const button: Mouse.Button = MouseButton.Left;
const down: boolean = Mouse.isButtonPressed(button);
const globalPosition: Vector2i = Mouse.getPosition();
const relativePosition: Vector2i = Mouse.getPosition(window);
Mouse.setPosition(globalPosition);
Mouse.setPosition(relativePosition, window);

const axis: Joystick.Axis = JoystickAxis.X;
const connected: boolean = Joystick.isConnected(0);
const count: number = Joystick.getButtonCount(0);
const supported: boolean = Joystick.hasAxis(0, axis);
const held: boolean = Joystick.isButtonPressed(0, 0);
const position: number = Joystick.getAxisPosition(0, axis);
const identification: Joystick.Identification = Joystick.getIdentification(0);
const name: string = identification.name;
const vendorId: number = identification.vendorId;
const productId: number = identification.productId;
Joystick.update();

const type: Sensor.Type = SensorType.Gravity;
const available: boolean = Sensor.isAvailable(type);
Sensor.setEnabled(type, true);
const value: Vector3f = Sensor.getValue(type);
Sensor.setEnabled(type, false);

// @ts-expect-error scancodes need an explicit selector
Keyboard.isKeyPressed(scan);
// @ts-expect-error a key is not a scancode
Keyboard.isKeyPressed(key, 'scancode');
// @ts-expect-error localize accepts scancodes
Keyboard.localize(key);
// @ts-expect-error descriptions accept scancodes
Keyboard.getDescription(key);
// @ts-expect-error positions use signed coordinates
Mouse.setPosition(new Vector2u());
// @ts-expect-error window arguments must be actual windows
Mouse.getPosition({});
// @ts-expect-error button types are distinct
Mouse.isButtonPressed(key);
// @ts-expect-error sensor types are distinct
Sensor.getValue(axis);
// @ts-expect-error enabled is boolean
Sensor.setEnabled(type, 1);
// @ts-expect-error identification name is a string
identification.name = 1;

void [ legacyScan, pressed, physical, localized, delocalized, description, down,
  connected, count, supported, held, position, name, vendorId, productId,
  available, value ];
