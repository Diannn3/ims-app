export type MapViewBox = { x: number; y: number; width: number; height: number };
export type MapPoint = { x: number; y: number };
export type MapBounds = MapViewBox;
export type MapViewportSize = { width: number; height: number };
export type MapInsets = { top?: number; right?: number; bottom?: number; left?: number };

export const MAP_CANVAS_BOUNDS: MapBounds = { x: 0, y: 0, width: 1200, height: 760 };
const DEFAULT_MIN_CAMERA_WIDTH = 280;
const DEFAULT_MIN_CAMERA_HEIGHT = 190;

export function canvasBounds(width: number, height: number): MapBounds { return { x: 0, y: 0, width, height }; }
function finitePositive(value: number, fallback: number) { return Number.isFinite(value) && value > 0 ? value : fallback; }

export function clampViewBox(box: MapViewBox, bounds: MapBounds = MAP_CANVAS_BOUNDS, minWidth = DEFAULT_MIN_CAMERA_WIDTH, minHeight = DEFAULT_MIN_CAMERA_HEIGHT): MapViewBox {
  let width = Math.max(1, box.width); let height = Math.max(1, box.height);
  const minScale = Math.max(1, Math.min(minWidth, bounds.width) / width, Math.min(minHeight, bounds.height) / height);
  width *= minScale; height *= minScale;
  const maxScale = Math.min(1, bounds.width / width, bounds.height / height);
  width *= maxScale; height *= maxScale;
  const centerX = box.x + box.width / 2; const centerY = box.y + box.height / 2;
  const maxX = bounds.x + bounds.width - width; const maxY = bounds.y + bounds.height - height;
  return { x: Math.min(maxX, Math.max(bounds.x, centerX - width / 2)), y: Math.min(maxY, Math.max(bounds.y, centerY - height / 2)), width, height };
}

export function boundsFromPoints(points: MapPoint[], padding = 0): MapBounds | null {
  if (!points.length) return null;
  const xs = points.map((point) => point.x); const ys = points.map((point) => point.y);
  const minX = Math.min(...xs) - padding; const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xs) + padding; const maxY = Math.max(...ys) + padding;
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

export function padBounds(bounds: MapBounds, padding: number): MapBounds { return { x: bounds.x - padding, y: bounds.y - padding, width: bounds.width + padding * 2, height: bounds.height + padding * 2 }; }

export function ensureMinimumSize(bounds: MapBounds, minWidth: number, minHeight: number): MapBounds {
  const width = Math.max(bounds.width, minWidth); const height = Math.max(bounds.height, minHeight);
  return { x: bounds.x + bounds.width / 2 - width / 2, y: bounds.y + bounds.height / 2 - height / 2, width, height };
}

export function matchAspectRatio(bounds: MapBounds, aspectRatio: number): MapBounds {
  const aspect = finitePositive(aspectRatio, bounds.width / Math.max(1, bounds.height));
  const current = bounds.width / Math.max(1, bounds.height); const centerX = bounds.x + bounds.width / 2; const centerY = bounds.y + bounds.height / 2;
  if (Math.abs(current - aspect) < 0.0001) return { ...bounds };
  if (current < aspect) { const width = bounds.height * aspect; return { x: centerX - width / 2, y: bounds.y, width, height: bounds.height }; }
  const height = bounds.width / aspect; return { x: bounds.x, y: centerY - height / 2, width: bounds.width, height };
}

export function cameraBoundsForAspect(canvas: MapBounds, aspectRatio: number): MapBounds { return matchAspectRatio(canvas, aspectRatio); }

export function fitInsideCanvas(box: MapViewBox, canvas: MapBounds): MapViewBox {
  const scale = Math.min(1, canvas.width / box.width, canvas.height / box.height);
  const width = box.width * scale; const height = box.height * scale;
  return clampViewBox({ x: box.x + box.width / 2 - width / 2, y: box.y + box.height / 2 - height / 2, width, height }, canvas, Math.min(width, DEFAULT_MIN_CAMERA_WIDTH), Math.min(height, DEFAULT_MIN_CAMERA_HEIGHT));
}

export function fitBounds(bounds: MapBounds, options: { padding?: number; minWidth?: number; minHeight?: number; canvas?: MapBounds; aspectRatio?: number } = {}): MapViewBox {
  const canvas = options.canvas ?? MAP_CANVAS_BOUNDS;
  let candidate = ensureMinimumSize(padBounds(bounds, options.padding ?? 0), options.minWidth ?? DEFAULT_MIN_CAMERA_WIDTH, options.minHeight ?? DEFAULT_MIN_CAMERA_HEIGHT);
  if (options.aspectRatio) candidate = matchAspectRatio(candidate, options.aspectRatio);
  return fitInsideCanvas(candidate, canvas);
}

export function focusRect(rect: { x: number; y: number; width: number; height: number }, paddingOrOptions: number | { canvas?: MapBounds; aspectRatio?: number; padding?: number; minWidth?: number; minHeight?: number } = 80): MapViewBox {
  const options = typeof paddingOrOptions === 'number' ? { padding: paddingOrOptions } : paddingOrOptions;
  return fitBounds(rect, { ...options, padding: options.padding ?? 80, minWidth: options.minWidth ?? 430, minHeight: options.minHeight ?? 300 });
}

export function zoomViewBoxAt(box: MapViewBox, scale: number, anchor: MapPoint, bounds: MapBounds = MAP_CANVAS_BOUNDS): MapViewBox {
  const nextWidth = box.width * scale; const nextHeight = box.height * scale;
  const ratioX = box.width > 0 ? (anchor.x - box.x) / box.width : 0.5; const ratioY = box.height > 0 ? (anchor.y - box.y) / box.height : 0.5;
  return clampViewBox({ x: anchor.x - nextWidth * ratioX, y: anchor.y - nextHeight * ratioY, width: nextWidth, height: nextHeight }, bounds);
}

export function zoomViewBox(box: MapViewBox, scale: number, bounds: MapBounds = MAP_CANVAS_BOUNDS): MapViewBox { return zoomViewBoxAt(box, scale, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, bounds); }
export function panViewBox(box: MapViewBox, deltaX: number, deltaY: number, bounds: MapBounds = MAP_CANVAS_BOUNDS): MapViewBox { return clampViewBox({ ...box, x: box.x + deltaX, y: box.y + deltaY }, bounds); }
export function viewBoxZoomPercent(box: MapViewBox, canvas = MAP_CANVAS_BOUNDS) { return Math.round((canvas.width / box.width) * 100); }

/** Fallback mapping for browsers where getScreenCTM() is unavailable. */
export function mapPointFromViewport(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }, box: MapViewBox): MapPoint {
  const ratioX = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5; const ratioY = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5;
  return { x: box.x + box.width * ratioX, y: box.y + box.height * ratioY };
}

export function applyViewportInsets(box: MapViewBox, viewport: MapViewportSize, insets: MapInsets, bounds: MapBounds): MapViewBox {
  if (viewport.width <= 0 || viewport.height <= 0) return box;
  const left = Math.max(0, insets.left ?? 0); const right = Math.max(0, insets.right ?? 0); const top = Math.max(0, insets.top ?? 0); const bottom = Math.max(0, insets.bottom ?? 0);
  const safeCenterX = left + Math.max(0, viewport.width - left - right) / 2; const safeCenterY = top + Math.max(0, viewport.height - top - bottom) / 2;
  return clampViewBox({ ...box, x: box.x + (0.5 - safeCenterX / viewport.width) * box.width, y: box.y + (0.5 - safeCenterY / viewport.height) * box.height }, bounds);
}

export function ensureRectVisible(box: MapViewBox, rect: { x: number; y: number; width: number; height: number }, viewport: MapViewportSize, insets: MapInsets, bounds: MapBounds, marginPx = 18): MapViewBox {
  if (viewport.width <= 0 || viewport.height <= 0) return box;
  const unitX = box.width / viewport.width; const unitY = box.height / viewport.height;
  const safeLeft = box.x + ((insets.left ?? 0) + marginPx) * unitX; const safeRight = box.x + box.width - ((insets.right ?? 0) + marginPx) * unitX;
  const safeTop = box.y + ((insets.top ?? 0) + marginPx) * unitY; const safeBottom = box.y + box.height - ((insets.bottom ?? 0) + marginPx) * unitY;
  let dx = 0; let dy = 0;
  if (rect.x < safeLeft) dx = rect.x - safeLeft; else if (rect.x + rect.width > safeRight) dx = rect.x + rect.width - safeRight;
  if (rect.y < safeTop) dy = rect.y - safeTop; else if (rect.y + rect.height > safeBottom) dy = rect.y + rect.height - safeBottom;
  return panViewBox(box, dx, dy, bounds);
}
