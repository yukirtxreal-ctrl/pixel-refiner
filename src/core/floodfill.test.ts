import { describe, expect, it } from "vitest";
import type { Pixel, RawImage } from "../shared/types";
import { floodFillTransparent } from "./floodfill";
import { getPixel, setPixel } from "./ops";

describe("floodfill.ts", () => {
	describe("floodFillTransparent", () => {
		it("should fill connected color area with transparency", () => {
			// 5x5 image, white background
			const width = 5;
			const height = 5;
			const data = new Uint8ClampedArray(width * height * 4).fill(255); // White
			const img: RawImage = { width, height, data };

			// Draw a red box (2x2) at (1,1)
			const red: Pixel = [255, 0, 0, 255];
			setPixel(img, 1, 1, red);
			setPixel(img, 2, 1, red);
			setPixel(img, 1, 2, red);
			setPixel(img, 2, 2, red);

			// Fill from (1,1)
			floodFillTransparent(img, 1, 1, 0);

			// (1,1) should be transparent red
			expect(getPixel(img, 1, 1)).toEqual([255, 0, 0, 0]);
			expect(getPixel(img, 2, 2)).toEqual([255, 0, 0, 0]);

			// (0,0) should still be white
			expect(getPixel(img, 0, 0)).toEqual([255, 255, 255, 255]);
		});

		it("should respect tolerance", () => {
			const width = 3;
			const height = 1;
			const data = new Uint8ClampedArray(width * height * 4);
			const img: RawImage = { width, height, data };

			// [R=255, R=250, R=240]
			setPixel(img, 0, 0, [255, 0, 0, 255]);
			setPixel(img, 1, 0, [250, 0, 0, 255]);
			setPixel(img, 2, 0, [240, 0, 0, 255]);

			// Fill from (0,0) with tolerance 5
			// R=250 is within tolerance (255-250=5), R=240 is NOT (255-240=15)
			floodFillTransparent(img, 0, 0, 5);

			expect(getPixel(img, 0, 0)[3]).toBe(0); // Transparent
			expect(getPixel(img, 1, 0)[3]).toBe(0); // Transparent
			expect(getPixel(img, 2, 0)[3]).toBe(255); // Opaque
		});

		it("fills adjacent different-colored regions sharing a visited map (regression)", () => {
			// 5x1: [transparent, red, green, green, green]. This mirrors the
			// "outer" background scope, where every opaque border pixel is a seed
			// and they share one visited map. Previously red's flood marked the
			// adjacent green pixel visited (as a rejected neighbor), so green's own
			// seed skipped it and left a stray opaque background pixel.
			const width = 5;
			const height = 1;
			const data = new Uint8ClampedArray(width * height * 4);
			const img: RawImage = { width, height, data };
			setPixel(img, 0, 0, [0, 0, 0, 0]); // transparent
			setPixel(img, 1, 0, [255, 0, 0, 255]); // red
			setPixel(img, 2, 0, [0, 200, 0, 255]); // green
			setPixel(img, 3, 0, [0, 200, 0, 255]); // green
			setPixel(img, 4, 0, [0, 200, 0, 255]); // green

			const visited = new Uint8Array(width * height);
			floodFillTransparent(img, 1, 0, 0, visited);
			floodFillTransparent(img, 2, 0, 0, visited);
			floodFillTransparent(img, 3, 0, 0, visited);
			floodFillTransparent(img, 4, 0, 0, visited);

			expect(getPixel(img, 1, 0)[3]).toBe(0);
			expect(getPixel(img, 2, 0)[3]).toBe(0); // was 255 before the fix
			expect(getPixel(img, 3, 0)[3]).toBe(0);
			expect(getPixel(img, 4, 0)[3]).toBe(0);
		});

		it("should not fill non-connected areas", () => {
			const width = 5;
			const height = 1;
			const data = new Uint8ClampedArray(width * height * 4).fill(255);
			const img: RawImage = { width, height, data };

			// [Red, White, Red, White, White]
			const red: Pixel = [255, 0, 0, 255];
			setPixel(img, 0, 0, red);
			setPixel(img, 2, 0, red);

			// Fill from (0,0)
			floodFillTransparent(img, 0, 0, 0);

			expect(getPixel(img, 0, 0)[3]).toBe(0); // Filled
			expect(getPixel(img, 1, 0)).toEqual([255, 255, 255, 255]); // White separator
			expect(getPixel(img, 2, 0)).toEqual([255, 0, 0, 255]); // Other red area (not connected)
		});
	});
});
