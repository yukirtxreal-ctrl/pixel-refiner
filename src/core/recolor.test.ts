import { describe, expect, it } from "vitest";
import type { RawImage, RGB } from "../shared/types";
import {
	colorKey,
	mapImageToPalette,
	recolorImage,
	recolorImageNearest,
} from "./recolor";

const makeImage = (pixels: number[][]): RawImage => {
	const data = new Uint8ClampedArray(pixels.length * 4);
	pixels.forEach((p, i) => {
		data[i * 4] = p[0];
		data[i * 4 + 1] = p[1];
		data[i * 4 + 2] = p[2];
		data[i * 4 + 3] = p[3];
	});
	return { width: pixels.length, height: 1, data };
};

describe("recolor", () => {
	it("swaps exact colors and preserves others and alpha", () => {
		const img = makeImage([
			[255, 0, 0, 255],
			[0, 255, 0, 255],
			[255, 0, 0, 128],
		]);
		const map = new Map<string, RGB>([
			[colorKey(255, 0, 0), { r: 0, g: 0, b: 255 }],
		]);
		const out = recolorImage(img, map);
		expect([out.data[0], out.data[1], out.data[2], out.data[3]]).toEqual([
			0, 0, 255, 255,
		]);
		expect([out.data[4], out.data[5], out.data[6]]).toEqual([0, 255, 0]);
		expect([out.data[8], out.data[9], out.data[10], out.data[11]]).toEqual([
			0, 0, 255, 128,
		]);
	});

	it("does not mutate the input image", () => {
		const img = makeImage([[255, 0, 0, 255]]);
		const map = new Map<string, RGB>([
			[colorKey(255, 0, 0), { r: 1, g: 2, b: 3 }],
		]);
		recolorImage(img, map);
		expect(img.data[0]).toBe(255);
	});

	it("skips fully transparent pixels", () => {
		const img = makeImage([[255, 0, 0, 0]]);
		const map = new Map<string, RGB>([
			[colorKey(255, 0, 0), { r: 0, g: 0, b: 255 }],
		]);
		const out = recolorImage(img, map);
		expect([out.data[0], out.data[1], out.data[2], out.data[3]]).toEqual([
			255, 0, 0, 0,
		]);
	});

	it("maps to nearest palette color", () => {
		const img = makeImage([
			[250, 10, 10, 255],
			[10, 10, 250, 255],
		]);
		const palette: RGB[] = [
			{ r: 255, g: 0, b: 0 },
			{ r: 0, g: 0, b: 255 },
		];
		const out = mapImageToPalette(img, palette);
		expect([out.data[0], out.data[1], out.data[2]]).toEqual([255, 0, 0]);
		expect([out.data[4], out.data[5], out.data[6]]).toEqual([0, 0, 255]);
	});

	it("returns a copy unchanged for an empty palette", () => {
		const img = makeImage([[123, 45, 67, 255]]);
		const out = mapImageToPalette(img, []);
		expect([out.data[0], out.data[1], out.data[2]]).toEqual([123, 45, 67]);
		expect(out.data).not.toBe(img.data);
	});

	describe("recolorImageNearest", () => {
		it("applies the swap even when swatch colors are not exact image colors", () => {
			// The palette swatch (100,100,100) is a cluster average that appears in
			// NO pixel of the image, mirroring median-cut output for > 256-color
			// images. Exact-match recoloring would be a silent no-op here.
			const img = makeImage([
				[90, 90, 90, 255],
				[110, 110, 110, 255],
			]);
			const palette: RGB[] = [{ r: 100, g: 100, b: 100 }];
			const mapping = new Map<string, RGB>([
				[colorKey(100, 100, 100), { r: 255, g: 0, b: 0 }],
			]);
			const out = recolorImageNearest(img, palette, mapping);
			expect([out.data[0], out.data[1], out.data[2]]).toEqual([255, 0, 0]);
			expect([out.data[4], out.data[5], out.data[6]]).toEqual([255, 0, 0]);
			// exact-match would have changed nothing:
			const exact = recolorImage(img, mapping);
			expect([exact.data[0], exact.data[1], exact.data[2]]).toEqual([
				90, 90, 90,
			]);
		});

		it("leaves pixels whose nearest swatch was not changed untouched", () => {
			const img = makeImage([
				[250, 10, 10, 255], // nearest red swatch (changed)
				[10, 10, 250, 255], // nearest blue swatch (unchanged)
			]);
			const palette: RGB[] = [
				{ r: 255, g: 0, b: 0 },
				{ r: 0, g: 0, b: 255 },
			];
			const mapping = new Map<string, RGB>([
				[colorKey(255, 0, 0), { r: 0, g: 255, b: 0 }],
			]);
			const out = recolorImageNearest(img, palette, mapping);
			expect([out.data[0], out.data[1], out.data[2]]).toEqual([0, 255, 0]);
			// blue pixel keeps its ORIGINAL color (not quantized to the swatch)
			expect([out.data[4], out.data[5], out.data[6]]).toEqual([10, 10, 250]);
		});

		it("preserves alpha, skips transparent pixels, and does not mutate input", () => {
			const img = makeImage([
				[100, 100, 100, 128],
				[100, 100, 100, 0],
			]);
			const palette: RGB[] = [{ r: 100, g: 100, b: 100 }];
			const mapping = new Map<string, RGB>([
				[colorKey(100, 100, 100), { r: 1, g: 2, b: 3 }],
			]);
			const out = recolorImageNearest(img, palette, mapping);
			expect([out.data[0], out.data[1], out.data[2], out.data[3]]).toEqual([
				1, 2, 3, 128,
			]);
			// transparent pixel untouched
			expect([out.data[4], out.data[5], out.data[6], out.data[7]]).toEqual([
				100, 100, 100, 0,
			]);
			// input unchanged
			expect(img.data[0]).toBe(100);
		});

		it("returns a copy unchanged for an empty mapping", () => {
			const img = makeImage([[100, 100, 100, 255]]);
			const out = recolorImageNearest(
				img,
				[{ r: 100, g: 100, b: 100 }],
				new Map(),
			);
			expect([out.data[0], out.data[1], out.data[2]]).toEqual([100, 100, 100]);
			expect(out.data).not.toBe(img.data);
		});
	});
});
