import { describe, expect, it } from "vitest";
import type { RawImage } from "../shared/types";
import {
	cleanStrayPixelsInPlace,
	despeckleInPlace,
	removeOrphanPixelsInPlace,
} from "./cleanup";

const blank = (w: number, h: number): RawImage => ({
	width: w,
	height: h,
	data: new Uint8ClampedArray(w * h * 4),
});

const setPx = (img: RawImage, x: number, y: number, rgba: number[]) => {
	img.data.set(rgba, (y * img.width + x) * 4);
};
const alphaAt = (img: RawImage, x: number, y: number): number =>
	img.data[(y * img.width + x) * 4 + 3];
const rgbAt = (img: RawImage, x: number, y: number): number[] => {
	const i = (y * img.width + x) * 4;
	return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

describe("removeOrphanPixelsInPlace", () => {
	it("clears isolated pixels but keeps connected ones", () => {
		const img = blank(8, 8);
		// 2x2 block (connected, kept)
		setPx(img, 1, 1, [255, 0, 0, 255]);
		setPx(img, 2, 1, [255, 0, 0, 255]);
		setPx(img, 1, 2, [255, 0, 0, 255]);
		// isolated speck (removed)
		setPx(img, 6, 6, [0, 255, 0, 255]);
		const removed = removeOrphanPixelsInPlace(img);
		expect(removed).toBe(1);
		expect(alphaAt(img, 6, 6)).toBe(0);
		expect(alphaAt(img, 1, 1)).toBe(255);
	});

	it("keeps diagonal-only neighbors (8-connectivity)", () => {
		const img = blank(4, 4);
		setPx(img, 1, 1, [255, 0, 0, 255]);
		setPx(img, 2, 2, [255, 0, 0, 255]);
		const removed = removeOrphanPixelsInPlace(img);
		expect(removed).toBe(0);
	});
});

describe("despeckleInPlace", () => {
	it("recolors a lone pixel surrounded by one flat color", () => {
		const img = blank(5, 5);
		for (let y = 0; y < 5; y += 1)
			for (let x = 0; x < 5; x += 1) setPx(img, x, y, [10, 10, 10, 255]);
		setPx(img, 2, 2, [200, 0, 0, 255]);
		const fixed = despeckleInPlace(img);
		expect(fixed).toBe(1);
		expect(rgbAt(img, 2, 2)).toEqual([10, 10, 10]);
	});

	it("leaves edges and two-pixel details alone", () => {
		const img = blank(5, 5);
		for (let y = 0; y < 5; y += 1)
			for (let x = 0; x < 5; x += 1) setPx(img, x, y, [10, 10, 10, 255]);
		// horizontal two-pixel detail: neighbors of each are not uniform
		setPx(img, 1, 2, [200, 0, 0, 255]);
		setPx(img, 2, 2, [200, 0, 0, 255]);
		const fixed = despeckleInPlace(img);
		expect(fixed).toBe(0);
		expect(rgbAt(img, 1, 2)).toEqual([200, 0, 0]);
	});
});

describe("cleanStrayPixelsInPlace", () => {
	it("runs both passes and reports counts", () => {
		const img = blank(7, 7);
		for (let y = 2; y < 5; y += 1)
			for (let x = 2; x < 5; x += 1) setPx(img, x, y, [10, 10, 10, 255]);
		setPx(img, 3, 3, [250, 250, 0, 255]); // speckle inside the block
		setPx(img, 6, 0, [0, 255, 0, 255]); // orphan
		const res = cleanStrayPixelsInPlace(img);
		expect(res.orphansRemoved).toBe(1);
		expect(res.speckleRecolored).toBe(1);
		expect(rgbAt(img, 3, 3)).toEqual([10, 10, 10]);
		expect(alphaAt(img, 6, 0)).toBe(0);
	});
});
