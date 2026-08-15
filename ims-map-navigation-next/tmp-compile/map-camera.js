"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAP_CANVAS_BOUNDS = void 0;
exports.clampViewBox = clampViewBox;
exports.boundsFromPoints = boundsFromPoints;
exports.padBounds = padBounds;
exports.ensureMinimumSize = ensureMinimumSize;
exports.fitBounds = fitBounds;
exports.focusRect = focusRect;
exports.zoomViewBoxAt = zoomViewBoxAt;
exports.zoomViewBox = zoomViewBox;
exports.panViewBox = panViewBox;
exports.viewBoxZoomPercent = viewBoxZoomPercent;
exports.mapPointFromViewport = mapPointFromViewport;
exports.MAP_CANVAS_BOUNDS = { x: 0, y: 0, width: 1200, height: 760 };
const MIN_CAMERA_WIDTH = 280;
const MIN_CAMERA_HEIGHT = 190;
function clampViewBox(box, bounds = exports.MAP_CANVAS_BOUNDS) {
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
function boundsFromPoints(points, padding = 0) {
    if (!points.length)
        return null;
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
function padBounds(bounds, padding) {
    return {
        x: bounds.x - padding,
        y: bounds.y - padding,
        width: bounds.width + padding * 2,
        height: bounds.height + padding * 2
    };
}
function ensureMinimumSize(bounds, minWidth, minHeight) {
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
function fitBounds(bounds, options = {}) {
    const { padding = 0, minWidth = MIN_CAMERA_WIDTH, minHeight = MIN_CAMERA_HEIGHT, canvas = exports.MAP_CANVAS_BOUNDS } = options;
    return clampViewBox(ensureMinimumSize(padBounds(bounds, padding), minWidth, minHeight), canvas);
}
function focusRect(rect, padding = 80) {
    return fitBounds(rect, {
        padding,
        minWidth: 430,
        minHeight: 300
    });
}
function zoomViewBoxAt(box, scale, anchor, bounds = exports.MAP_CANVAS_BOUNDS) {
    const nextWidth = box.width * scale;
    const nextHeight = box.height * scale;
    const ratioX = box.width > 0 ? (anchor.x - box.x) / box.width : 0.5;
    const ratioY = box.height > 0 ? (anchor.y - box.y) / box.height : 0.5;
    return clampViewBox({
        x: anchor.x - nextWidth * ratioX,
        y: anchor.y - nextHeight * ratioY,
        width: nextWidth,
        height: nextHeight
    }, bounds);
}
function zoomViewBox(box, scale, bounds = exports.MAP_CANVAS_BOUNDS) {
    return zoomViewBoxAt(box, scale, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, bounds);
}
function panViewBox(box, deltaX, deltaY, bounds = exports.MAP_CANVAS_BOUNDS) {
    return clampViewBox({
        ...box,
        x: box.x + deltaX,
        y: box.y + deltaY
    }, bounds);
}
function viewBoxZoomPercent(box, canvas = exports.MAP_CANVAS_BOUNDS) {
    return Math.round((canvas.width / box.width) * 100);
}
function mapPointFromViewport(clientX, clientY, rect, box) {
    const ratioX = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5;
    const ratioY = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5;
    return {
        x: box.x + box.width * ratioX,
        y: box.y + box.height * ratioY
    };
}
