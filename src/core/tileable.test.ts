import { describe, expect, it } from "vitest";
import type { RawImage } from "../shared/types";
import { analyzeSeams, tileImage } from "./tileable";

const fromRows = (rows: number[][][]): RawImage => {
	const h = rows.length;
	const w = rows[0].length;
	const data = new Uint8ClampedArray(w * h * 4);
	rows.forEach((row, y) => {
		row.forEach((px, x) => {
			data.set(px, (y * w + x) * 4);
		});
	});
	return { width: w, height: h, data };
};

const R = [255, 0, 0, 255];
const G = [0, 255, 0, 255];

describe("tileImage", () => {
	it("repeats the image in a grid", () => {
		const img = fromRows([
			[R, G],
			[G, R],
		]);
		const tiled = tileImage(img, 3, 2);
		expect(tiled.width).toBe(6);
		expect(tiled.height).toBe(4);
		// (2,0) is the start of the second horizontal repeat -> same as (0,0)
		const i = (0 * 6 + 2) * 4;
		expect([...tiled.data.slice(i, i + 4)]).toEqual(R);
		// (0,2) starts the second vertical repeat -> same as (0,0)
		const j = (2 * 6 + 0) * 4;
		expect([...tiled.data.slice(j, j + 4)]).toEqual(R);
	});
});

describe("analyzeSeams", () => {
	it("reports a perfectly tileable image as seamless", () => {
		const img = fromRows([
			[R, G, R],
			[G, R, G],
			[R, G, R],
		]);
		const report = analyzeSeams(img);
		expect(report.horizontalSeamless).toBe(true);
		expect(report.verticalSeamless).toBe(true);
	});

	it("finds the rows/columns that break the wrap", () => {
		const img = fromRows([
			[R, R, G], // row 0: left != right
			[R, R, R],
		]);
		const report = analyzeSeams(img);
		expect(report.horizontalSeamless).toBe(false);
		expect(report.horizontalMismatches).toEqual([0]);
		// top vs bottom: column 2 differs (G vs R)
		expect(report.verticalMismatches).toEqual([2]);
	});

	it("treats fully transparent pixels as equal and honors tolerance", () => {
		const img = fromRows([
			[
				[0, 0, 0, 0],
				[10, 10, 10, 255],
				[0, 99, 0, 0],
			],
		]);
		const strict = analyzeSeams(img);
		expect(strict.horizontalSeamless).toBe(true);
		const img2 = fromRows([
			[
				[100, 0, 0, 255],
				[0, 0, 0, 255],
				[104, 0, 0, 255],
			],
		]);
		expect(analyzeSeams(img2, 0).horizontalSeamless).toBe(false);
		expect(analyzeSeams(img2, 8).horizontalSeamless).toBe(true);
	});
});
