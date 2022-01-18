import { Vector2I } from './vector2';
import { RenderWindow } from './render_window';

type UnsignedInteger = number;

export function isDown(finger: UnsignedInteger): boolean;
export function getPosition(finger: UnsignedInteger, window?: RenderWindow): Vector2I;
