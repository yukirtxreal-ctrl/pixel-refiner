import type { DitherMode, PixelData, RawImage, RGB } from "../shared/types";
import { OklabKMeans, PaletteQuantizer } from "./quantizer";

/**
 * Compute the output size when scaling an image so its longest side equals
 * `maxSide` (never upscales). Returns at least 1x1.
 */
export const computeTargetSize = (
	w: number,
	h: number,
	maxSide: number,
): { width: number; height: number } => {
	if (maxSide <= 0 || (w <= maxSide && h <= maxSide)) {
		return { width: Math.max(1, w), height: Math.max(1, h) };
	}
	const ratio = w >= h ? maxSide / w : maxSide / h;
	return {
		width: Math.max(1, Math.round(w * ratio)),
		height: Math.max(1, Math.round(h * ratio)),
	};
};

/**
 * Downscale using area-averaging (box filter). Alpha-weighted so transparent
 * regions do not bleed dark colors into edges. This is the right resampler for
 * turning a detailed photo/illustration into chunky pixels.
 */
export const downscaleAreaAverage = (
	img: RawImage,
	targetW: number,
	targetH: number,
): RawImage => {
	const tw = Math.max(1, Math.floor(targetW));
	const th = Math.max(1, Math.floor(targetH));
	if (tw >= img.width && th >= img.height) {
		return {
			width: img.width,
			height: img.height,
			data: new Uint8ClampedArray(img.data),
		};
	}
	const out = new Uint8ClampedArray(tw * th * 4);
	const sx = img.width / tw;
	const sy = img.height / th;
	for (let y = 0; y < th; y++) {
		const y0 = Math.floor(y * sy);
		const y1 = Math.max(y0 + 1, Math.min(img.height, Math.floor((y + 1) * sy)));
		for (let x = 0; x < tw; x++) {
			const x0 = Math.floor(x * sx);
			const x1 = Math.max(
				x0 + 1,
				Math.min(img.width, Math.floor((x + 1) * sx)),
			);
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			let count = 0;
			for (let yy = y0; yy < y1; yy++) {
				for (let xx = x0; xx < x1; xx++) {
					const idx = (yy * img.width + xx) * 4;
					const alpha = img.data[idx + 3];
					r += img.data[idx] * alpha;
					g += img.data[idx + 1] * alpha;
					b += img.data[idx + 2] * alpha;
					a += alpha;
					count++;
				}
			}
			const o = (y * tw + x) * 4;
			if (a > 0) {
				out[o] = Math.round(r / a);
				out[o + 1] = Math.round(g / a);
				out[o + 2] = Math.round(b / a);
				out[o + 3] = Math.round(a / Math.max(1, count));
			} else {
				out[o + 3] = 0;
			}
		}
	}
	return { width: tw, height: th, data: out };
};

export type PhotoToPixelOptions = {
	/** Target longest side in pixels. */
	maxSide: number;
	/** Palette strategy applied after downscaling. */
	paletteMode: "auto" | "none" | "fixed";
	/** Color count for "auto" (K-means) mode. */
	colorCount: number;
	/** Palette used when paletteMode is "fixed". */
	fixedPalette?: RGB[];
	ditherMode: DitherMode;
	/** Dithering strength 0-100. */
	ditherStrength: number;
};

/**
 * Convert an arbitrary image into pixel art: area-average downscale to the
 * requested size, then optional color reduction (K-means or a fixed palette)
 * with optional dithering. Reuses the app's existing quantizer.
 */
export const photoToPixelArt = (
	img: RawImage,
	opts: PhotoToPixelOptions,
): RawImage => {
	const target = computeTargetSize(img.width, img.height, opts.maxSide);
	const small = downscaleAreaAverage(img, target.width, target.height);
	if (opts.paletteMode === "none") {
		return small;
	}

	const pixels: PixelData[] = [];
	for (let i = 0; i < small.data.length; i += 4) {
		pixels.push({
			r: small.data[i],
			g: small.data[i + 1],
			b: small.data[i + 2],
			alpha: small.data[i + 3],
		});
	}

	const strength = opts.ditherStrength / 100;
	let reduced: PixelData[];
	if (
		opts.paletteMode === "fixed" &&
		opts.fixedPalette &&
		opts.fixedPalette.length > 0
	) {
		reduced = new PaletteQuantizer(opts.fixedPalette).applyDithering(
			pixels,
			small.width,
			small.height,
			opts.ditherMode,
			strength,
		);
	} else {
		reduced = new OklabKMeans(Math.max(2, opts.colorCount)).applyDithering(
			pixels,
			small.width,
			small.height,
			opts.ditherMode,
			strength,
		);
	}

	const out = new Uint8ClampedArray(small.data.length);
	for (let i = 0; i < reduced.length; i++) {
		const p = reduced[i];
		out[i * 4] = p.r;
		out[i * 4 + 1] = p.g;
		out[i * 4 + 2] = p.b;
		out[i * 4 + 3] = p.alpha;
	}
	return { width: small.width, height: small.height, data: out };
};
