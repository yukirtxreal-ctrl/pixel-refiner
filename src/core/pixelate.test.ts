import { describe, expect, it } from "vitest";
import type { RawImage } from "../shared/types";
import {
	computeTargetSize,
	downscaleAreaAverage,
	photoToPixelArt,
} from "./pixelate";

const solid = (
	w: number,
	h: number,
	r: number,
	g: number,
	b: number,
): RawImage => {
	const data = new Uint8ClampedArray(w * h * 4);
	for (let i = 0; i < w * h; i++) {
		data[i * 4] = r;
		data[i * 4 + 1] = g;
		data[i * 4 + 2] = b;
		data[i * 4 + 3] = 255;
	}
	return { width: w, height: h, data };
};

describe("pixelate", () => {
	it("computeTargetSize keeps aspect ratio and never upscales", () => {
		expect(computeTargetSize(200, 100, 50)).toEqual({ width: 50, height: 25 });
		expect(computeTargetSize(100, 200, 50)).toEqual({ width: 25, height: 50 });
		expect(computeTargetSize(30, 20, 64)).toEqual({ width: 30, height: 20 });
	});

	it("area-average of a solid image stays that color", () => {
		const img = solid(8, 8, 120, 60, 30);
		const out = downscaleAreaAverage(img, 2, 2);
		expect(out.width).toBe(2);
		expect(out.height).toBe(2);
		expect([out.data[0], out.data[1], out.data[2], out.data[3]]).toEqual([
			120, 60, 30, 255,
		]);
	});

	it("averages a half-black half-white row to gray", () => {
		const data = new Uint8ClampedArray(2 * 1 * 4);
		data.set([0, 0, 0, 255], 0);
		data.set([255, 255, 255, 255], 4);
		const img: RawImage = { width: 2, height: 1, data };
		const out = downscaleAreaAverage(img, 1, 1);
		expect(out.data[0]).toBeGreaterThan(120);
		expect(out.data[0]).toBeLessThan(135);
		expect(out.data[3]).toBe(255);
	});

	it("photoToPixelArt downsizes and limits colors", () => {
		const img = solid(64, 64, 200, 100, 50);
		const out = photoToPixelArt(img, {
			maxSide: 16,
			paletteMode: "auto",
			colorCount: 4,
			ditherMode: "none",
			ditherStrength: 0,
		});
		expect(Math.max(out.width, out.height)).toBe(16);
		const seen = new Set<string>();
		for (let i = 0; i < out.data.length; i += 4) {
			if (out.data[i + 3] === 0) continue;
			seen.add(`${out.data[i]},${out.data[i + 1]},${out.data[i + 2]}`);
		}
		expect(seen.size).toBeLessThanOrEqual(4);
	});
});
