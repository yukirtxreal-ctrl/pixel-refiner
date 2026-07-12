import { describe, expect, it } from "vitest";
import type { RawImage } from "../shared/types";
import { analyzeTileColors, enforceTileColorBudget } from "./tileConstraint";

const blank = (w: number, h: number): RawImage => ({
	width: w,
	height: h,
	data: new Uint8ClampedArray(w * h * 4),
});
const setPx = (img: RawImage, x: number, y: number, rgb: number[]) => {
	img.data.set([...rgb, 255], (y * img.width + x) * 4);
};
const rgbAt = (img: RawImage, x: number, y: number): number[] => {
	const i = (y * img.width + x) * 4;
	return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

describe("analyzeTileColors", () => {
	it("counts distinct visible colors per tile and flags violations", () => {
		const img = blank(8, 4); // two 4x4 tiles
		// left tile: 2 colors
		for (let y = 0; y < 4; y += 1)
			for (let x = 0; x < 4; x += 1)
				setPx(img, x, y, x < 2 ? [255, 0, 0] : [0, 255, 0]);
		// right tile: 4 colors
		setPx(img, 4, 0, [1, 1, 1]);
		setPx(img, 5, 0, [2, 2, 2]);
		setPx(img, 6, 0, [3, 3, 3]);
		setPx(img, 7, 0, [4, 4, 4]);
		const a = analyzeTileColors(img, { tileW: 4, tileH: 4, maxColors: 3 });
		expect(a.tilesX).toBe(2);
		expect(a.tilesY).toBe(1);
		expect(a.counts).toEqual([2, 4]);
		expect(a.violations).toEqual([1]);
		expect(a.maxCount).toBe(4);
	});

	it("ignores transparent pixels", () => {
		const img = blank(4, 4);
		setPx(img, 0, 0, [9, 9, 9]);
		const a = analyzeTileColors(img, { tileW: 4, tileH: 4, maxColors: 1 });
		expect(a.counts).toEqual([1]);
		expect(a.violations).toEqual([]);
	});
});

describe("enforceTileColorBudget", () => {
	it("remaps least-frequent colors to the nearest kept color", () => {
		const img = blank(4, 4);
		// 12 px dark red, 3 px bright red-ish, 1 px blue
		for (let y = 0; y < 3; y += 1)
			for (let x = 0; x < 4; x += 1) setPx(img, x, y, [120, 0, 0]);
		setPx(img, 0, 3, [130, 10, 10]);
		setPx(img, 1, 3, [130, 10, 10]);
		setPx(img, 2, 3, [130, 10, 10]);
		setPx(img, 3, 3, [0, 0, 200]);
		const { image, changedPixels, violatingTiles } = enforceTileColorBudget(
			img,
			{ tileW: 4, tileH: 4, maxColors: 2 },
		);
		expect(violatingTiles).toBe(1);
		expect(changedPixels).toBe(1);
		// blue was least frequent -> mapped to the nearest kept color
		// (130,10,10 is marginally closer to blue than 120,0,0)
		expect(rgbAt(image, 3, 3)).toEqual([130, 10, 10]);
		// original image untouched
		expect(rgbAt(img, 3, 3)).toEqual([0, 0, 200]);
	});

	it("leaves compliant tiles alone", () => {
		const img = blank(4, 4);
		for (let y = 0; y < 4; y += 1)
			for (let x = 0; x < 4; x += 1) setPx(img, x, y, [50, 60, 70]);
		const { changedPixels, violatingTiles } = enforceTileColorBudget(img, {
			tileW: 4,
			tileH: 4,
			maxColors: 2,
		});
		expect(changedPixels).toBe(0);
		expect(violatingTiles).toBe(0);
	});
});
