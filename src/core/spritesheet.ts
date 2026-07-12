import type { RawImage } from "../shared/types";

/** How to cut a sheet into frames. */
export type SliceSpec =
	| { mode: "grid"; cols: number; rows: number }
	| {
			mode: "cell";
			cellW: number;
			cellH: number;
			offsetX?: number;
			offsetY?: number;
			spacingX?: number;
			spacingY?: number;
	  };

const cropRegion = (
	img: RawImage,
	sx: number,
	sy: number,
	w: number,
	h: number,
): RawImage => {
	const out = new Uint8ClampedArray(w * h * 4);
	for (let y = 0; y < h; y++) {
		const srcY = sy + y;
		if (srcY < 0 || srcY >= img.height) continue;
		for (let x = 0; x < w; x++) {
			const srcX = sx + x;
			if (srcX < 0 || srcX >= img.width) continue;
			const s = (srcY * img.width + srcX) * 4;
			const d = (y * w + x) * 4;
			out[d] = img.data[s];
			out[d + 1] = img.data[s + 1];
			out[d + 2] = img.data[s + 2];
			out[d + 3] = img.data[s + 3];
		}
	}
	return { width: w, height: h, data: out };
};

/**
 * Slice a sprite sheet into individual frames, left-to-right then top-to-bottom.
 * - "grid": divide the sheet into cols x rows equal cells.
 * - "cell": fixed cell size with optional offset and spacing (margins/gutters).
 */
export const sliceSheet = (img: RawImage, spec: SliceSpec): RawImage[] => {
	const frames: RawImage[] = [];
	if (spec.mode === "grid") {
		const cols = Math.max(1, Math.floor(spec.cols));
		const rows = Math.max(1, Math.floor(spec.rows));
		const cw = Math.floor(img.width / cols);
		const ch = Math.floor(img.height / rows);
		if (cw < 1 || ch < 1) return frames;
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				frames.push(cropRegion(img, c * cw, r * ch, cw, ch));
			}
		}
		return frames;
	}

	const cw = Math.max(1, Math.floor(spec.cellW));
	const ch = Math.max(1, Math.floor(spec.cellH));
	const ox = Math.max(0, Math.floor(spec.offsetX ?? 0));
	const oy = Math.max(0, Math.floor(spec.offsetY ?? 0));
	const spx = Math.max(0, Math.floor(spec.spacingX ?? 0));
	const spy = Math.max(0, Math.floor(spec.spacingY ?? 0));
	for (let y = oy; y + ch <= img.height; y += ch + spy) {
		for (let x = ox; x + cw <= img.width; x += cw + spx) {
			frames.push(cropRegion(img, x, y, cw, ch));
		}
	}
	return frames;
};

/**
 * Interior cut positions (in source pixels) for a slice spec, matching the exact
 * geometry `sliceSheet` uses. Returns the vertical (`xs`) and horizontal (`ys`)
 * lines that separate frames, excluding the outer edges. Used to draw a cut-line
 * overlay on the slice preview so the user can see where frames will be cut.
 */
export const sliceCutLines = (
	width: number,
	height: number,
	spec: SliceSpec,
): { xs: number[]; ys: number[] } => {
	const xs: number[] = [];
	const ys: number[] = [];
	if (width < 1 || height < 1) return { xs, ys };

	if (spec.mode === "grid") {
		const cols = Math.max(1, Math.floor(spec.cols));
		const rows = Math.max(1, Math.floor(spec.rows));
		const cw = Math.floor(width / cols);
		const ch = Math.floor(height / rows);
		if (cw < 1 || ch < 1) return { xs, ys };
		for (let c = 1; c < cols; c++) xs.push(c * cw);
		for (let r = 1; r < rows; r++) ys.push(r * ch);
		return { xs, ys };
	}

	const cw = Math.max(1, Math.floor(spec.cellW));
	const ch = Math.max(1, Math.floor(spec.cellH));
	const ox = Math.max(0, Math.floor(spec.offsetX ?? 0));
	const oy = Math.max(0, Math.floor(spec.offsetY ?? 0));
	const spx = Math.max(0, Math.floor(spec.spacingX ?? 0));
	const spy = Math.max(0, Math.floor(spec.spacingY ?? 0));
	for (let x = ox; x + cw <= width; x += cw + spx) {
		if (x > 0) xs.push(x);
		if (x + cw < width) xs.push(x + cw);
	}
	for (let y = oy; y + ch <= height; y += ch + spy) {
		if (y > 0) ys.push(y);
		if (y + ch < height) ys.push(y + ch);
	}
	return { xs, ys };
};

export type AtlasFrame = {
	index: number;
	name: string;
	x: number;
	y: number;
	w: number;
	h: number;
};

export type AtlasResult = {
	atlas: RawImage;
	frames: AtlasFrame[];
	columns: number;
	rows: number;
};

const blit = (
	dst: Uint8ClampedArray,
	dstW: number,
	src: RawImage,
	dx: number,
	dy: number,
): void => {
	for (let y = 0; y < src.height; y++) {
		for (let x = 0; x < src.width; x++) {
			const s = (y * src.width + x) * 4;
			const d = ((dy + y) * dstW + (dx + x)) * 4;
			dst[d] = src.data[s];
			dst[d + 1] = src.data[s + 1];
			dst[d + 2] = src.data[s + 2];
			dst[d + 3] = src.data[s + 3];
		}
	}
};

/**
 * Pack multiple images into a single atlas on a uniform grid. Every cell is
 * sized to the largest frame; smaller frames are top-left aligned within their
 * cell. Optional transparent padding is added around every cell.
 */
export const packAtlas = (
	images: Array<{ name: string; image: RawImage }>,
	opts: { columns?: number; padding?: number } = {},
): AtlasResult => {
	const padding = Math.max(0, Math.floor(opts.padding ?? 0));
	const n = images.length;
	const columns = Math.max(
		1,
		Math.floor(opts.columns ?? Math.ceil(Math.sqrt(Math.max(1, n)))),
	);
	const rows = Math.max(1, Math.ceil(n / columns));

	let cellW = 1;
	let cellH = 1;
	for (const it of images) {
		if (it.image.width > cellW) cellW = it.image.width;
		if (it.image.height > cellH) cellH = it.image.height;
	}

	const atlasW = columns * cellW + (columns + 1) * padding;
	const atlasH = rows * cellH + (rows + 1) * padding;
	const data = new Uint8ClampedArray(atlasW * atlasH * 4);
	const frames: AtlasFrame[] = [];

	images.forEach((it, i) => {
		const col = i % columns;
		const row = Math.floor(i / columns);
		const x = padding + col * (cellW + padding);
		const y = padding + row * (cellH + padding);
		blit(data, atlasW, it.image, x, y);
		frames.push({
			index: i,
			name: it.name,
			x,
			y,
			w: it.image.width,
			h: it.image.height,
		});
	});

	return {
		atlas: { width: atlasW, height: atlasH, data },
		frames,
		columns,
		rows,
	};
};

/** Serialize atlas frame data as TexturePacker-style (hash) JSON. */
export const atlasToJSON = (result: AtlasResult, imageName: string): string => {
	const framesObj: Record<string, unknown> = {};
	for (const f of result.frames) {
		// Frame names come from user file names and can collide; a duplicate
		// key would silently drop the earlier frame from the JSON even though
		// the atlas PNG contains it. Uniquify with a numeric suffix instead.
		let key = f.name;
		if (key in framesObj) {
			let n = 1;
			while (`${f.name}_${n}` in framesObj) n += 1;
			key = `${f.name}_${n}`;
		}
		framesObj[key] = {
			frame: { x: f.x, y: f.y, w: f.w, h: f.h },
			rotated: false,
			trimmed: false,
			spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
			sourceSize: { w: f.w, h: f.h },
		};
	}
	return JSON.stringify(
		{
			frames: framesObj,
			meta: {
				app: "PixelRefiner",
				image: imageName,
				format: "RGBA8888",
				size: { w: result.atlas.width, h: result.atlas.height },
				scale: "1",
			},
		},
		null,
		2,
	);
};
