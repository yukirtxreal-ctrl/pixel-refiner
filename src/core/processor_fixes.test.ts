import { describe, expect, it } from "vitest";
import type { PixelGrid, RawImage } from "../shared/types";
import {
	_keepLargestOpaqueComponentInPlace,
	_lockGridToSquarePixels,
	processImage,
} from "./processor";

const blank = (w: number, h: number): RawImage => ({
	width: w,
	height: h,
	data: new Uint8ClampedArray(w * h * 4),
});

const setPx = (img: RawImage, x: number, y: number, a: number, rgb = 200) => {
	const i = (y * img.width + x) * 4;
	img.data[i] = rgb;
	img.data[i + 1] = rgb;
	img.data[i + 2] = rgb;
	img.data[i + 3] = a;
};
const alphaAt = (img: RawImage, x: number, y: number): number =>
	img.data[(y * img.width + x) * 4 + 3];

describe("keepLargestOpaqueComponentInPlace", () => {
	it("keeps the largest blob and clears strays; leaves faint pixels", () => {
		const img = blank(8, 8);
		// Large 4x4 blob (16 px) top-left
		for (let y = 0; y < 4; y++)
			for (let x = 0; x < 4; x++) setPx(img, x, y, 255);
		// Stray opaque pixel bottom-right
		setPx(img, 7, 7, 255);
		// Faint pixel (below alpha threshold) should be untouched
		setPx(img, 7, 0, 10);

		const res = _keepLargestOpaqueComponentInPlace(img, 16);
		expect(res.keptSize).toBe(16);
		expect(res.removedPixels).toBe(1);
		expect(alphaAt(img, 0, 0)).toBe(255); // main object kept
		expect(alphaAt(img, 7, 7)).toBe(0); // stray removed
		expect(alphaAt(img, 7, 0)).toBe(10); // faint pixel untouched
	});

	it("no-op when there is a single component", () => {
		const img = blank(4, 4);
		for (let y = 0; y < 4; y++)
			for (let x = 0; x < 4; x++) setPx(img, x, y, 255);
		const res = _keepLargestOpaqueComponentInPlace(img, 16);
		expect(res.removedPixels).toBe(0);
	});
});

describe("lockGridToSquarePixels", () => {
	const base: PixelGrid = {
		cellW: 6.7,
		cellH: 6.8,
		offsetX: 0,
		offsetY: 0,
		outW: 0,
		outH: 0,
		score: 0,
	};

	it("forces square pixels and a square output for a square input", () => {
		const g = _lockGridToSquarePixels(base, 1024, 1024);
		expect(g.cellW).toBe(g.cellH);
		expect(g.cellW).toBe(6.7); // min of the two
		expect(g.outW).toBe(152);
		expect(g.outH).toBe(152);
		expect(g.outW).toBe(g.outH);
	});

	it("preserves the source aspect ratio (2:1)", () => {
		const g = _lockGridToSquarePixels(
			{ ...base, cellW: 5, cellH: 5 },
			200,
			100,
		);
		expect(g.outW).toBe(40);
		expect(g.outH).toBe(20);
		expect((g.outW ?? 0) / (g.outH ?? 1)).toBeCloseTo(2, 5);
	});
});

describe("processImage integration: lockAspectRatio", () => {
	// Build a square, blocky, opaque image (no background removal) so the only
	// variable is the grid/scale path.
	const makeSquarePixelArt = (size: number, cell: number): RawImage => {
		const img = blank(size, size);
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				const bx = Math.floor(x / cell);
				const by = Math.floor(y / cell);
				const on = (bx + by) % 2 === 0;
				setPx(img, x, y, 255, on ? 220 : 40);
			}
		}
		return img;
	};

	it("keeps a square input square when lockAspectRatio is on", () => {
		const img = makeSquarePixelArt(96, 6);
		const { result } = processImage(img, {
			bgExtractionMethod: "none",
			enableGridDetection: true,
			lockAspectRatio: true,
			trimToContent: false,
			reduceColors: false,
		});
		expect(result.width).toBe(result.height);
	});
});

describe("processImage: outline in non-auto grid modes", () => {
	// A solid opaque square on a transparent canvas.
	const makeSprite = (): RawImage => {
		const img = blank(8, 8);
		for (let y = 2; y < 6; y++) {
			for (let x = 2; x < 6; x++) setPx(img, x, y, 255, 200);
		}
		return img;
	};

	const outlineColor = { r: 255, g: 0, b: 0 };

	const countOutlinePixels = (img: RawImage): number => {
		let n = 0;
		for (let i = 0; i < img.data.length; i += 4) {
			if (
				img.data[i] === 255 &&
				img.data[i + 1] === 0 &&
				img.data[i + 2] === 0 &&
				img.data[i + 3] > 0
			) {
				n += 1;
			}
		}
		return n;
	};

	it("applies the outline when grid detection is off (1:1)", () => {
		const { result } = processImage(makeSprite(), {
			bgExtractionMethod: "none",
			enableGridDetection: false,
			trimToContent: false,
			reduceColors: false,
			outlineStyle: "sharp",
			outlineColor,
		});
		expect(countOutlinePixels(result)).toBeGreaterThan(0);
	});

	it("applies the outline when a pixel size is forced", () => {
		const { result } = processImage(makeSprite(), {
			bgExtractionMethod: "none",
			forcePixelsW: 4,
			forcePixelsH: 4,
			trimToContent: false,
			reduceColors: false,
			outlineStyle: "sharp",
			outlineColor,
		});
		expect(countOutlinePixels(result)).toBeGreaterThan(0);
	});
});

describe("processImage: post background removal without grid detection", () => {
	it("removes the background when only postRemoveBackground is set", () => {
		// White background with a dark 2x2 object in the center.
		const img = blank(6, 6);
		for (let y = 0; y < 6; y++) {
			for (let x = 0; x < 6; x++) setPx(img, x, y, 255, 255);
		}
		setPx(img, 2, 2, 255, 10);
		setPx(img, 3, 2, 255, 10);
		setPx(img, 2, 3, 255, 10);
		setPx(img, 3, 3, 255, 10);

		const { result } = processImage(img, {
			bgExtractionMethod: "top-left",
			enableGridDetection: false,
			preRemoveBackground: false,
			postRemoveBackground: true,
			backgroundTolerance: 8,
			trimToContent: false,
			reduceColors: false,
		});
		expect(alphaAt(result, 0, 0)).toBe(0); // background removed
		expect(alphaAt(result, 2, 2)).toBe(255); // object kept
	});
});

describe("processImage: RGB background removal is scan-order independent", () => {
	const buildPair = (): [RawImage, RawImage] => {
		// Two pixels: one slightly outside the bgRgb tolerance (115) and one
		// inside it (108). The 115 pixel is only reachable through the 108
		// seed's flood fill.
		const a = blank(2, 1);
		setPx(a, 0, 0, 255, 115);
		setPx(a, 1, 0, 255, 108);
		const b = blank(2, 1);
		setPx(b, 0, 0, 255, 108);
		setPx(b, 1, 0, 255, 115);
		return [a, b];
	};

	it("removes the same pixels for mirrored inputs", () => {
		const [a, b] = buildPair();
		const opts = {
			bgExtractionMethod: "rgb",
			bgRgb: "#646464",
			backgroundTolerance: 10,
			bgRemovalScope: "selected",
			enableGridDetection: false,
			preRemoveBackground: true,
			postRemoveBackground: false,
			trimToContent: false,
			reduceColors: false,
			keepLargestObject: false,
			floatingMaxPixels: 0,
		} as const;
		const ra = processImage(a, { ...opts });
		const rb = processImage(b, { ...opts });
		const alphasA = [alphaAt(ra.result, 0, 0), alphaAt(ra.result, 1, 0)];
		const alphasB = [alphaAt(rb.result, 1, 0), alphaAt(rb.result, 0, 0)];
		expect(alphasA).toEqual(alphasB);
	});
});

describe("processImage: empty fixed palette is ignored", () => {
	it("does not black out the image", () => {
		const img = blank(2, 2);
		for (let y = 0; y < 2; y++) {
			for (let x = 0; x < 2; x++) setPx(img, x, y, 255, 120);
		}
		const { result } = processImage(img, {
			bgExtractionMethod: "none",
			enableGridDetection: false,
			trimToContent: false,
			reduceColors: false,
			fixedPalette: [],
		});
		expect(result.data[0]).toBe(120); // unchanged, not 0
	});
});
