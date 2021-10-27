interface OtherEvent {
  type: 'Closed' | 'LostFocus' | 'GainedFocus' | 'MouseLeft' | 'JoystickButtonPressed' | 'JoystickButtonReleased' |
    'JoystickMoved' | 'JoystickConnected' | 'JoystickDisconnected' | 'TouchBegan' | 'TouchMoved' | 'TouchEnded' |
    'SensorChanged';
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
    code: number;
    codeStr: string;
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
    buttonStr: string;
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
    wheelStr: string;
  };
}

export type Event = OtherEvent | SizeEvent | KeyEvent | TextEvent | MouseMoveEvent | MouseButtonEvent |
  MouseWheelEvent | MouseWheelScrollEvent;
