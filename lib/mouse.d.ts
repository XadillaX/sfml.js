import * as RenderWindow from './render_window';
import { PointType, Vector2I } from './vector2';

export function isButtonPressed(button: number | string): boolean;
export function getPosition(window?: RenderWindow): Vector2I;
export function setPosition(pos: PointType<Vector2I>, window?: RenderWindow): void;
