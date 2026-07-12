import { applyPalette, GIFEncoder, quantize } from "gifenc";
import { decompressFrames, parseGIF } from "gifuct-js";
import UPNG from "upng-js";
import { type AnimFrame, normalizeDelayMs } from "./animation";

/**
 * Animated image decode/encode: GIF (gifuct-js / gifenc) and APNG (upng-js).
 * Works in both the browser and Node (vitest), so the round-trip is unit
 * tested. All frames are full-canvas RGBA — GIF patch/disposal compositing is
 * resolved here at decode time.
 */

export type DecodedAnimation = {
	width: number;
	height: number;
	frames: AnimFrame[];
	/** Source container, for UI labels. */
	format: "gif" | "png";
};

export const sniffAnimatedFormat = (buf: ArrayBuffer): "gif" | "png" | null => {
	const b = new Uint8Array(buf);
	if (b.length > 5 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
		return "gif"; // "GIF"
	}
	if (b.length > 7 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e) {
		return "png"; // \x89PNG
	}
	return null;
};

/** Decode a GIF into full composited RGBA frames (handles disposal 0-3). */
export const decodeGIF = (buf: ArrayBuffer): DecodedAnimation => {
	const gif = parseGIF(buf);
	const parsed = decompressFrames(gif, true);
	if (parsed.length === 0) {
		throw new Error("GIF contains no frames.");
	}
	const width = gif.lsd.width;
	const height = gif.lsd.height;
	const canvas = new Uint8ClampedArray(width * height * 4);
	const frames: AnimFrame[] = [];
	let previous: Uint8ClampedArray | null = null;

	for (const f of parsed) {
		const disposal = f.disposalType ?? 0;
		if (disposal === 3) {
			previous = new Uint8ClampedArray(canvas);
		}
		const { top, left, width: fw, height: fh } = f.dims;
		const patch = f.patch;
		for (let y = 0; y < fh; y += 1) {
			for (let x = 0; x < fw; x += 1) {
				const s = (y * fw + x) * 4;
				if (patch[s + 3] === 0) continue; // transparent -> keep canvas
				const d = ((top + y) * width + (left + x)) * 4;
				canvas[d] = patch[s];
				canvas[d + 1] = patch[s + 1];
				canvas[d + 2] = patch[s + 2];
				canvas[d + 3] = patch[s + 3];
			}
		}
		frames.push({
			image: { width, height, data: new Uint8ClampedArray(canvas) },
			durationMs: normalizeDelayMs(f.delay ?? 100),
		});
		if (disposal === 2) {
			// restore to background: clear the frame region
			for (let y = 0; y < fh; y += 1) {
				const d = ((top + y) * width + left) * 4;
				canvas.fill(0, d, d + fw * 4);
			}
		} else if (disposal === 3 && previous) {
			canvas.set(previous);
		}
	}
	return { width, height, frames, format: "gif" };
};

/** Decode a PNG or APNG; static PNGs come back as a single frame. */
export const decodeAPNG = (buf: ArrayBuffer): DecodedAnimation => {
	const img = UPNG.decode(buf);
	const rgba = UPNG.toRGBA8(img);
	if (rgba.length === 0) {
		throw new Error("PNG contains no image data.");
	}
	const frames: AnimFrame[] = rgba.map((frameBuf, i) => ({
		image: {
			width: img.width,
			height: img.height,
			data: new Uint8ClampedArray(frameBuf),
		},
		durationMs: normalizeDelayMs(Number(img.frames[i]?.delay ?? 100)),
	}));
	return { width: img.width, height: img.height, frames, format: "png" };
};

export const decodeAnimation = (buf: ArrayBuffer): DecodedAnimation => {
	const format = sniffAnimatedFormat(buf);
	if (format === "gif") return decodeGIF(buf);
	if (format === "png") return decodeAPNG(buf);
	throw new Error("Unsupported file: expected a GIF or (A)PNG.");
};

/**
 * Encode frames as an infinitely looping GIF. When the frames use at most
 * 255 distinct opaque colors (the norm after refining), an exact global
 * palette is used with index 0 reserved for transparency; otherwise each
 * frame is quantized to 255 colors.
 */
export const encodeGIF = (frames: AnimFrame[]): Uint8Array => {
	if (frames.length === 0) {
		throw new Error("No frames to encode.");
	}
	const w = frames[0].image.width;
	const h = frames[0].image.height;
	for (const f of frames) {
		if (f.image.width !== w || f.image.height !== h) {
			throw new Error("All frames must share the same size.");
		}
	}

	// Gather the exact set of opaque colors (bail once it exceeds 255).
	const colorIndex = new Map<number, number>();
	let overflow = false;
	outer: for (const f of frames) {
		const d = f.image.data;
		for (let i = 0; i < d.length; i += 4) {
			if (d[i + 3] < 128) continue;
			const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
			if (!colorIndex.has(key)) {
				if (colorIndex.size >= 255) {
					overflow = true;
					break outer;
				}
				colorIndex.set(key, colorIndex.size + 1); // 0 is transparent
			}
		}
	}

	const gif = GIFEncoder();
	if (!overflow) {
		const palette: number[][] = [[0, 0, 0]];
		for (const key of colorIndex.keys()) {
			palette.push([(key >> 16) & 255, (key >> 8) & 255, key & 255]);
		}
		for (const f of frames) {
			const d = f.image.data;
			const index = new Uint8Array(w * h);
			for (let p = 0; p < w * h; p += 1) {
				const i = p * 4;
				index[p] =
					d[i + 3] < 128
						? 0
						: (colorIndex.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]) ?? 0);
			}
			gif.writeFrame(index, w, h, {
				palette,
				delay: normalizeDelayMs(f.durationMs),
				repeat: 0,
				transparent: true,
				transparentIndex: 0,
				dispose: 2,
			});
		}
	} else {
		for (const f of frames) {
			const palette = quantize(f.image.data, 255, {
				format: "rgba4444",
				oneBitAlpha: true,
				clearAlpha: true,
			});
			const index = applyPalette(f.image.data, palette, "rgba4444");
			const transparentIndex = palette.findIndex(
				(c) => c.length > 3 && c[3] === 0,
			);
			gif.writeFrame(index, w, h, {
				palette,
				delay: normalizeDelayMs(f.durationMs),
				repeat: 0,
				transparent: transparentIndex >= 0,
				transparentIndex: Math.max(0, transparentIndex),
				dispose: 2,
			});
		}
	}
	gif.finish();
	return gif.bytes();
};

/** Encode frames as a lossless APNG (or a plain PNG when one frame). */
export const encodeAPNG = (frames: AnimFrame[]): Uint8Array => {
	if (frames.length === 0) {
		throw new Error("No frames to encode.");
	}
	const w = frames[0].image.width;
	const h = frames[0].image.height;
	for (const f of frames) {
		if (f.image.width !== w || f.image.height !== h) {
			throw new Error("All frames must share the same size.");
		}
	}
	const buffers = frames.map((f) => {
		const copy = new Uint8Array(f.image.data.length);
		copy.set(f.image.data);
		return copy.buffer as ArrayBuffer;
	});
	const delays = frames.map((f) => normalizeDelayMs(f.durationMs));
	return new Uint8Array(UPNG.encode(buffers, w, h, 0, delays));
};
