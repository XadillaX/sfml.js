declare module '*/binding.node' {
  export interface OtherEvent {
    type:
    | 'Closed'
    | 'LostFocus'
    | 'GainedFocus'
    | 'MouseLeft'
    | 'MouseEntered';
  }

  export interface SizeEvent {
    type: 'Resized';
    size: {
      width: number;
      height: number;
    };
  }

  export interface KeyEvent {
    type: 'KeyPressed' | 'KeyReleased';
    key: {
      code: KeyCode;
      codeStr: KeyStr;
      alt: boolean;
      shift: boolean;
      control: boolean;
      system: boolean;
    };
  }

  export interface TextEvent {
    type: 'TextEntered';
    text: {
      unicode: number;
      content: string;
    };
  }

  export interface MouseMoveEvent {
    type: 'MouseMoved';
    mouseMove: {
      x: number;
      y: number;
    };
  }

  export interface MouseButtonEvent {
    type: 'MouseButtonPressed' | 'MouseButtonReleased';
    mouseButton: {
      x: number;
      y: number;
      button: MouseCode;
      buttonStr: MouseStr;
    };
  }

  export interface MouseWheelEvent {
    type: 'MouseWheelMoved';
    mouseWheel: {
      x: number;
      y: number;
      delta: number;
    };
  }

  export interface MouseWheelScrollEvent {
    type: 'MouseWheelScrolled';
    mouseWheelScroll: {
      x: number;
      y: number;
      delta: number;
      wheel: MouseWheelCode;
      wheelStr: MouseWheelStr;
    };
  }

  export interface JoystickButtonEvent {
    type: 'JoystickButtonPressed' | 'JoystickButtonReleased';
    joystickButton: {
      joystickId: number;
      button: number;
    }
  }

  export interface JoystickConnectEvent {
    type: 'JoystickConnected' | 'JoystickDisconnected';
    joystickConnect: {
      joystickId: number;
    }
  }

  export interface JoystickMoveEvent {
    type: 'JoystickMoved',
    joystickMove: {
      joystickId: number;
      axis: JoystickCode;
      axisStr: JoystickStr;
      position: number;
    }
  }

  export interface TouchEvent {
    type: 'TouchBegan' | 'TouchMoved' | 'TouchEnded';
    touch: {
      finger: number;
      x: number;
      y: number;
    }
  }

  export interface SensorEvent {
    type: 'SensorChanged',
    sensor: {
      type: SensorCode;
      typeStr: SensorStr;
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
}
