import { describe, expect, it } from "vitest";
import type { RawImage } from "../shared/types";
import {
	buildTimeline,
	dedupeFrames,
	frameHash,
	normalizeDelayMs,
	padFramesToUnion,
} from "./animation";

const solid = (w: number, h: number, rgba: number[]): RawImage => {
	const data = new Uint8ClampedArray(w * h * 4);
	for (let i = 0; i < w * h; i += 1) {
		data.set(rgba, i * 4);
	}
	return { width: w, height: h, data };
};

describe("frameHash", () => {
	it("is stable and dimension-sensitive", () => {
		const a = solid(4, 4, [10, 20, 30, 255]);
		const b = solid(4, 4, [10, 20, 30, 255]);
		const c = solid(2, 8, [10, 20, 30, 255]);
		expect(frameHash(a)).toBe(frameHash(b));
		expect(frameHash(a)).not.toBe(frameHash(c));
	});

	it("changes when a single pixel changes", () => {
		const a = solid(4, 4, [10, 20, 30, 255]);
		const b = solid(4, 4, [10, 20, 30, 255]);
		b.data[0] = 11;
		expect(frameHash(a)).not.toBe(frameHash(b));
	});
});

describe("dedupeFrames", () => {
	it("merges identical frames and preserves the sequence", () => {
		const red = solid(2, 2, [255, 0, 0, 255]);
		const blue = solid(2, 2, [0, 0, 255, 255]);
		const red2 = solid(2, 2, [255, 0, 0, 255]);
		const { unique, sequence, duplicatesRemoved } = dedupeFrames([
			{ image: red, durationMs: 100 },
			{ image: blue, durationMs: 50 },
			{ image: red2, durationMs: 80 },
		]);
		expect(unique.length).toBe(2);
		expect(duplicatesRemoved).toBe(1);
		expect(sequence).toEqual([0, 1, 0]);
		expect(unique[0].sourceIndices).toEqual([0, 2]);
	});
});

describe("buildTimeline", () => {
	it("collapses consecutive repeats by summing durations", () => {
		const f = solid(1, 1, [0, 0, 0, 255]);
		const frames = [
			{ image: f, durationMs: 100 },
			{ image: f, durationMs: 40 },
			{ image: f, durationMs: 60 },
		];
		const timeline = buildTimeline([0, 0, 1], frames);
		expect(timeline).toEqual([
			{ frameIndex: 0, durationMs: 140 },
			{ frameIndex: 1, durationMs: 60 },
		]);
	});
});

describe("padFramesToUnion", () => {
	it("center-pads smaller frames with transparency", () => {
		const big = solid(4, 4, [1, 2, 3, 255]);
		const small = solid(2, 2, [9, 9, 9, 255]);
		const [a, b] = padFramesToUnion([big, small]);
		expect(a.width).toBe(4);
		expect(b.width).toBe(4);
		expect(b.height).toBe(4);
		// corner is transparent padding
		expect(b.data[3]).toBe(0);
		// center carries the original pixel
		const c = (1 * 4 + 1) * 4;
		expect(b.data[c]).toBe(9);
		expect(b.data[c + 3]).toBe(255);
	});

	it("returns frames unchanged when sizes already match", () => {
		const a = solid(3, 3, [5, 5, 5, 255]);
		const out = padFramesToUnion([a]);
		expect(out[0]).toBe(a);
	});
});

describe("normalizeDelayMs", () => {
	it("defaults bad values to 100 and floors tiny delays to 20", () => {
		expect(normalizeDelayMs(Number.NaN)).toBe(100);
		expect(normalizeDelayMs(0)).toBe(100);
		expect(normalizeDelayMs(5)).toBe(20);
		expect(normalizeDelayMs(66.6)).toBe(67);
	});
});
