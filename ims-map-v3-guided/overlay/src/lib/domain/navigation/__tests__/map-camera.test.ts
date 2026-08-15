import { describe, expect, it } from 'vitest';
import {
  applyViewportInsets,
  boundsFromPoints,
  cameraBoundsForAspect,
  canvasBounds,
  clampViewBox,
  ensureRectVisible,
  fitBounds,
  focusRect,
  matchAspectRatio,
  panViewBox,
  zoomViewBoxAt
} from '../map-camera';

const canvas = canvasBounds(1200, 760);

describe('map camera', () => {
  it('builds padded route bounds from points', () => {
    expect(boundsFromPoints([{ x: 100, y: 200 }, { x: 300, y: 500 }], 20)).toEqual({
      x: 80,
      y: 180,
      width: 240,
      height: 340
    });
  });

  it('clamps a camera inside the supplied map canvas', () => {
    const box = clampViewBox({ x: -100, y: -100, width: 500, height: 400 }, canvas);
    expect(box.x).toBe(0);
    expect(box.y).toBe(0);
    expect(box.width).toBe(500);
    expect(box.height).toBe(400);
  });

  it('focuses a room without over-zooming tiny rectangles', () => {
    const box = focusRect(
      { x: 330, y: 455, width: 175, height: 105 },
      { canvas, aspectRatio: 390 / 560 }
    );
    expect(box.width).toBeGreaterThanOrEqual(430);
    expect(box.height).toBeGreaterThanOrEqual(300);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
  });

  it('fits route bounds while matching the visible viewport aspect ratio', () => {
    const aspect = 1280 / 690;
    const cameraBounds = cameraBoundsForAspect(canvas, aspect);
    const box = fitBounds(
      { x: 200, y: 300, width: 200, height: 40 },
      { padding: 60, minWidth: 520, minHeight: 320, canvas: cameraBounds, aspectRatio: aspect }
    );
    expect(box.width / box.height).toBeCloseTo(aspect, 3);
  });

  it('expands a portrait camera boundary so the full wide map can still fit', () => {
    const aspect = 390 / 560;
    const cameraBounds = cameraBoundsForAspect(canvas, aspect);
    expect(cameraBounds.width).toBeGreaterThanOrEqual(canvas.width);
    expect(cameraBounds.height).toBeGreaterThan(canvas.height);
    expect(cameraBounds.width / cameraBounds.height).toBeCloseTo(aspect, 3);

    const next = matchAspectRatio({ x: 300, y: 200, width: 300, height: 300 }, aspect);
    expect(next.width / next.height).toBeCloseTo(aspect, 3);
  });

  it('zooms around an anchor while remaining clamped', () => {
    const next = zoomViewBoxAt(canvas, 0.5, { x: 900, y: 400 }, canvas);
    expect(next.width).toBe(600);
    expect(next.height).toBe(380);
    expect(next.x).toBeGreaterThan(0);
  });

  it('pans without escaping the canvas', () => {
    const start = { x: 200, y: 200, width: 500, height: 320 };
    expect(panViewBox(start, -1000, -1000, canvas)).toMatchObject({ x: 0, y: 0 });
  });

  it('biases a focused box above a mobile bottom overlay', () => {
    const start = { x: 300, y: 180, width: 500, height: 400 };
    const biased = applyViewportInsets(
      start,
      { width: 390, height: 560 },
      { bottom: 120 },
      canvas
    );
    expect(biased.y).toBeGreaterThan(start.y);
  });

  it('keeps a focused room inside the unobscured camera region', () => {
    const start = { x: 200, y: 120, width: 600, height: 430 };
    const shifted = ensureRectVisible(
      start,
      { x: 450, y: 490, width: 120, height: 60 },
      { width: 390, height: 560 },
      { bottom: 120 },
      canvas
    );
    expect(shifted.y).toBeGreaterThan(start.y);
  });
});
