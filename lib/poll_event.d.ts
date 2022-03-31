import { Keys, KeysStr } from './keyboard';
import * as Joystick from './joystick';
import * as Sensor from './sensor';

interface OtherEvent {
  type:
  | 'Closed'
  | 'LostFocus'
  | 'GainedFocus'
  | 'MouseLeft'
  | 'MouseEntered';
}

interface SizeEvent {
  type: 'Resized';
  size: {
    width: number;
    height: number;
  };
}

interface KeyEvent {
  type: 'KeyPressed' | 'KeyReleased';
  key: {
    code: Keys;
    codeStr: KeysStr;
    alt: boolean;
    shift: boolean;
    control: boolean;
    system: boolean;
  };
}

interface TextEvent {
  type: 'TextEntered';
  text: {
    unicode: number;
    content: string;
  };
}

interface MouseMoveEvent {
  type: 'MouseMoved';
  mouseMove: {
    x: number;
    y: number;
  };
}

interface MouseButtonEvent {
  type: 'MouseButtonPressed' | 'MouseButtonReleased';
  mouseButton: {
    x: number;
    y: number;
    button: number;
    buttonStr: 'Left' | 'Right' | 'Middle' | 'XButton1' | 'XButton2';
  };
}

interface MouseWheelEvent {
  type: 'MouseWheelMoved';
  mouseWheel: {
    x: number;
    y: number;
    delta: number;
  };
}

interface MouseWheelScrollEvent {
  type: 'MouseWheelScrolled';
  mouseWheelScroll: {
    x: number;
    y: number;
    delta: number;
    wheel: number;
    wheelStr: 'VerticalWheel' | 'HorizontalWheel';
  };
}

interface JoystickButtonEvent {
  type: 'JoystickButtonPressed' | 'JoystickButtonReleased';
  joystickButton: {
    joystickId: number;
    button: number;
  }
}

interface JoystickConnectEvent {
  type: 'JoystickConnected' | 'JoystickDisconnected';
  joystickConnect: {
    joystickId: number;
  }
}

interface JoystickMoveEvent {
  type: 'JoystickMoved',
  joystickMove: {
    joystickId: number;
    axis: Joystick.Axis;
    axisStr: Joystick.AxisStr;
    position: number;
  }
}

interface TouchEvent {
  type: 'TouchBegan' | 'TouchMoved' | 'TouchEnded';
  touch: {
    finger: number;
    x: number;
    y: number;
  }
}

interface SensorEvent {
  type: 'SensorChanged',
  sensor: {
    type: Sensor.Type;
    typeStr: Sensor.TypeStr;
    x: number;
    y: number;
    z: number;
  }
}

export type Event =
  | OtherEvent
  | SizeEvent
  | KeyEvent
  | TextEvent
  | MouseMoveEvent
  | MouseButtonEvent
  | MouseWheelEvent
  | MouseWheelScrollEvent
  | JoystickButtonEvent
  | JoystickConnectEvent
  | JoystickMoveEvent
  | TouchEvent
  | SensorEvent;
