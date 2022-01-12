import { Vector2I } from './vector2';
import { RenderWindow } from './render_window';

export function isDown(finger: number): boolean;
export function getPosition(finger: number, window?: RenderWindow): Vector2I;
