import { Point } from './point';
import { Rect } from './rect';
import { Track } from './track';


export class Geometry {
    public static isPointInRect(pt: Point, r: Rect): boolean {
        return false;
    }

    public static isPointInTrack(pt: Point, s: Track): boolean {
        return false;
    }
}