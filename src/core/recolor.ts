import type { RawImage, RGB } from "../shared/types";
import { findNearestColor } from "../utils/palette";

/** Stable string key for an RGB triple. */
export const colorKey = (r: number, g: number, b: number): string =>
	`${r},${g},${b}`;

/**
 * Recolor an image using an exact source-color -> target-color map.
 * The map is keyed by `colorKey(r, g, b)`. Pixels whose color is not present in
 * the map are left unchanged. Alpha is always preserved. Fully transparent
 * pixels are skipped. Useful for palette swaps / character variants.
 */
export const recolorImage = (
	img: RawImage,
	mapping: Map<string, RGB>,
): RawImage => {
	const data = new Uint8ClampedArray(img.data);
	if (mapping.size === 0) {
		return { width: img.width, height: img.height, data };
	}
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] === 0) continue;
		const to = mapping.get(colorKey(data[i], data[i + 1], data[i + 2]));
		if (to) {
			data[i] = to.r;
			data[i + 1] = to.g;
			data[i + 2] = to.b;
		}
	}
	return { width: img.width, height: img.height, data };
};

/**
 * Recolor using a palette-aware swap. Each opaque pixel is matched to the
 * nearest color in `palette`; if that palette color has an entry in `mapping`
 * (keyed by `colorKey`), the pixel is replaced with the mapped target color.
 * Pixels whose nearest palette color was not changed keep their original color.
 *
 * This is the robust counterpart to `recolorImage`: the extracted palette shown
 * to the user can contain cluster-average colors that are not present verbatim
 * in the image (median-cut output for photos with > 256 colors), for which an
 * exact-match swap would silently do nothing. Matching each pixel to its nearest
 * swatch makes the swap take effect while still leaving untouched swatches
 * pixel-identical. For true pixel art (palette colors are exact image colors)
 * the nearest color is the pixel's own color, so behavior is unchanged. Results
 * per unique source color are memoized.
 */
export const recolorImageNearest = (
	img: RawImage,
	palette: RGB[],
	mapping: Map<string, RGB>,
): RawImage => {
	const data = new Uint8ClampedArray(img.data);
	if (mapping.size === 0 || palette.length === 0) {
		return { width: img.width, height: img.height, data };
	}
	// Cache maps a source color key to its replacement, or null when the nearest
	// swatch is unchanged (so we can distinguish "computed, no-op" from "unseen").
	const cache = new Map<string, RGB | null>();
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] === 0) continue;
		const key = colorKey(data[i], data[i + 1], data[i + 2]);
		let to = cache.get(key);
		if (to === undefined) {
			const nearest = findNearestColor(
				{ r: data[i], g: data[i + 1], b: data[i + 2] },
				palette,
			);
			to = mapping.get(colorKey(nearest.r, nearest.g, nearest.b)) ?? null;
			cache.set(key, to);
		}
		if (to) {
			data[i] = to.r;
			data[i + 1] = to.g;
			data[i + 2] = to.b;
		}
	}
	return { width: img.width, height: img.height, data };
};

/**
 * Map every opaque pixel to the nearest color in the given palette (Euclidean
 * RGB distance). Alpha is preserved. Results per unique color are memoized.
 */
export const mapImageToPalette = (img: RawImage, palette: RGB[]): RawImage => {
	const data = new Uint8ClampedArray(img.data);
	if (palette.length === 0) {
		return { width: img.width, height: img.height, data };
	}
	const cache = new Map<string, RGB>();
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] === 0) continue;
		const key = colorKey(data[i], data[i + 1], data[i + 2]);
		let nc = cache.get(key);
		if (!nc) {
			nc = findNearestColor(
				{ r: data[i], g: data[i + 1], b: data[i + 2] },
				palette,
			);
			cache.set(key, nc);
		}
		data[i] = nc.r;
		data[i + 1] = nc.g;
		data[i + 2] = nc.b;
	}
	return { width: img.width, height: img.height, data };
};
