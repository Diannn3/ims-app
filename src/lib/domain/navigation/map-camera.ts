export type MapViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MapPoint = { x: number; y: number };
export type MapBounds = MapViewBox;

export const MAP_CANVAS_BOUNDS: MapBounds = { x: 0, y: 0, width: 1200, height: 760 };

const MIN_CAMERA_WIDTH = 280;
const MIN_CAMERA_HEIGHT = 190;

export function clampViewBox(
  box: MapViewBox,
  bounds: MapBounds = MAP_CANVAS_BOUNDS
): MapViewBox {
  const width = Math.min(bounds.width, Math.max(MIN_CAMERA_WIDTH, box.width));
  const height = Math.min(bounds.height, Math.max(MIN_CAMERA_HEIGHT, box.height));
  const maxX = bounds.x + bounds.width - width;
  const maxY = bounds.y + bounds.height - height;

  return {
    x: Math.min(maxX, Math.max(bounds.x, box.x)),
    y: Math.min(maxY, Math.max(bounds.y, box.y)),
    width,
    height
  };
}

export function boundsFromPoints(points: MapPoint[], padding = 0): MapBounds | null {
  if (!points.length) return null;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xs) + padding;
  const maxY = Math.max(...ys) + padding;

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY)
  };
}

export function padBounds(bounds: MapBounds, padding: number): MapBounds {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2
  };
}

export function ensureMinimumSize(
  bounds: MapBounds,
  minWidth: number,
  minHeight: number
): MapBounds {
  const width = Math.max(bounds.width, minWidth);
  const height = Math.max(bounds.height, minHeight);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height
  };
}

export function fitBounds(
  bounds: MapBounds,
  options: {
    padding?: number;
    minWidth?: number;
    minHeight?: number;
    canvas?: MapBounds;
  } = {}
): MapViewBox {
  const {
    padding = 0,
    minWidth = MIN_CAMERA_WIDTH,
    minHeight = MIN_CAMERA_HEIGHT,
    canvas = MAP_CANVAS_BOUNDS
  } = options;

  return clampViewBox(
    ensureMinimumSize(padBounds(bounds, padding), minWidth, minHeight),
    canvas
  );
}

export function focusRect(
  rect: { x: number; y: number; width: number; height: number },
  padding = 80
): MapViewBox {
  return fitBounds(rect, {
    padding,
    minWidth: 430,
    minHeight: 300
  });
}

export function zoomViewBoxAt(
  box: MapViewBox,
  scale: number,
  anchor: MapPoint,
  bounds: MapBounds = MAP_CANVAS_BOUNDS
): MapViewBox {
  const nextWidth = box.width * scale;
  const nextHeight = box.height * scale;
  const ratioX = box.width > 0 ? (anchor.x - box.x) / box.width : 0.5;
  const ratioY = box.height > 0 ? (anchor.y - box.y) / box.height : 0.5;

  return clampViewBox(
    {
      x: anchor.x - nextWidth * ratioX,
      y: anchor.y - nextHeight * ratioY,
      width: nextWidth,
      height: nextHeight
    },
    bounds
  );
}

export function zoomViewBox(
  box: MapViewBox,
  scale: number,
  bounds: MapBounds = MAP_CANVAS_BOUNDS
): MapViewBox {
  return zoomViewBoxAt(
    box,
    scale,
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    bounds
  );
}

export function panViewBox(
  box: MapViewBox,
  deltaX: number,
  deltaY: number,
  bounds: MapBounds = MAP_CANVAS_BOUNDS
): MapViewBox {
  return clampViewBox(
    {
      ...box,
      x: box.x + deltaX,
      y: box.y + deltaY
    },
    bounds
  );
}

export function viewBoxZoomPercent(box: MapViewBox, canvas = MAP_CANVAS_BOUNDS) {
  return Math.round((canvas.width / box.width) * 100);
}

export function mapPointFromViewport(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  box: MapViewBox
): MapPoint {
  const ratioX = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5;
  const ratioY = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5;

  return {
    x: box.x + box.width * ratioX,
    y: box.y + box.height * ratioY
  };
}
