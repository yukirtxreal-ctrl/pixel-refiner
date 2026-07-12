import { describe, expect, it } from "vitest";
import { luminance, organizeIntoRamps, suggestMerges } from "./paletteRamps";

describe("organizeIntoRamps", () => {
	it("separates neutrals and groups hues, sorted dark to light", () => {
		const ramps = organizeIntoRamps([
			{ r: 200, g: 200, b: 200 }, // light gray (neutral)
			{ r: 40, g: 40, b: 40 }, // dark gray (neutral)
			{ r: 200, g: 30, b: 30 }, // red
			{ r: 90, g: 10, b: 10 }, // dark red
			{ r: 30, g: 60, b: 220 }, // blue
		]);
		// neutral ramp first
		expect(ramps[0].hue).toBeNull();
		expect(ramps[0].colors[0]).toEqual({ r: 40, g: 40, b: 40 });
		// two chromatic ramps: red family and blue family
		expect(ramps.length).toBe(3);
		const redRamp = ramps.find(
			(r) => r.hue !== null && (r.hue < 30 || r.hue > 330),
		);
		expect(redRamp).toBeDefined();
		expect(redRamp?.colors.length).toBe(2);
		// dark red before bright red
		expect(redRamp?.colors[0]).toEqual({ r: 90, g: 10, b: 10 });
	});

	it("handles an empty palette", () => {
		expect(organizeIntoRamps([])).toEqual([]);
	});
});

describe("suggestMerges", () => {
	it("pairs near-duplicates, darker color first, closest pairs first", () => {
		const merges = suggestMerges(
			[
				{ r: 100, g: 100, b: 100 },
				{ r: 104, g: 100, b: 100 }, // distance 4 from the first
				{ r: 250, g: 0, b: 0 },
				{ r: 0, g: 250, b: 0 }, // far from everything
			],
			24,
		);
		expect(merges.length).toBe(1);
		expect(merges[0].a).toEqual({ r: 100, g: 100, b: 100 });
		expect(merges[0].b).toEqual({ r: 104, g: 100, b: 100 });
		expect(merges[0].distance).toBe(4);
	});

	it("uses each color at most once (greedy nearest pairs)", () => {
		const merges = suggestMerges(
			[
				{ r: 100, g: 100, b: 100 },
				{ r: 102, g: 100, b: 100 },
				{ r: 105, g: 100, b: 100 },
			],
			24,
		);
		expect(merges.length).toBe(1);
		expect(merges[0].distance).toBe(2);
	});
});

describe("luminance", () => {
	it("orders black < mid < white", () => {
		const black = luminance({ r: 0, g: 0, b: 0 });
		const mid = luminance({ r: 128, g: 128, b: 128 });
		const white = luminance({ r: 255, g: 255, b: 255 });
		expect(black).toBeLessThan(mid);
		expect(mid).toBeLessThan(white);
	});
});
