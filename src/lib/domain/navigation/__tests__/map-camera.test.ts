import { describe, expect, it } from 'vitest';
import {
  MAP_CANVAS_BOUNDS,
  boundsFromPoints,
  cameraBoundsForAspect,
  clampViewBox,
  fitBounds,
  focusRect,
  panViewBox,
  zoomViewBoxAt
} from '../map-camera';

describe('map camera', () => {
  it('builds padded route bounds from points', () => {
    expect(boundsFromPoints([{ x: 100, y: 200 }, { x: 300, y: 500 }], 20)).toEqual({
      x: 80,
      y: 180,
      width: 240,
      height: 340
    });
  });

  it('clamps a camera inside the map canvas', () => {
    const box = clampViewBox({ x: -100, y: -100, width: 500, height: 400 });
    expect(box.x).toBe(0);
    expect(box.y).toBe(0);
    expect(box.width).toBe(500);
    expect(box.height).toBe(400);
  });

  it('focuses a room without over-zooming tiny rectangles', () => {
    const box = focusRect({ x: 330, y: 455, width: 175, height: 105 });
    expect(box.width).toBeGreaterThanOrEqual(430);
    expect(box.height).toBeGreaterThanOrEqual(300);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
  });

  it('fits route bounds with requested minimum dimensions', () => {
    const box = fitBounds({ x: 200, y: 300, width: 200, height: 40 }, {
      padding: 60,
      minWidth: 520,
      minHeight: 320
    });
    expect(box.width).toBe(520);
    expect(box.height).toBe(320);
  });

  it('zooms around an anchor while remaining clamped', () => {
    const start = { ...MAP_CANVAS_BOUNDS };
    const next = zoomViewBoxAt(start, 0.5, { x: 900, y: 400 });
    expect(next.width).toBe(600);
    expect(next.height).toBe(380);
    expect(next.x).toBeGreaterThan(0);
  });

  it('pans without escaping the canvas', () => {
    const start = { x: 200, y: 200, width: 500, height: 320 };
    expect(panViewBox(start, -1000, -1000)).toMatchObject({ x: 0, y: 0 });
  });

  it('expands the legal camera on portrait screens without distorting the floor', () => {
    const camera = cameraBoundsForAspect(MAP_CANVAS_BOUNDS, 0.55);
    expect(camera.height).toBeGreaterThan(MAP_CANVAS_BOUNDS.height);
    expect(camera.width / camera.height).toBeCloseTo(0.55, 2);
  });
});
