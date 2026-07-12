import { describe, expect, it } from "vitest";
import type { RawImage } from "../shared/types";
import type { AnimFrame } from "./animation";
import {
	decodeAnimation,
	decodeAPNG,
	decodeGIF,
	encodeAPNG,
	encodeGIF,
	sniffAnimatedFormat,
} from "./animcodec";

const solid = (w: number, h: number, rgba: number[]): RawImage => {
	const data = new Uint8ClampedArray(w * h * 4);
	for (let i = 0; i < w * h; i += 1) data.set(rgba, i * 4);
	return { width: w, height: h, data };
};

const twoFrames = (): AnimFrame[] => {
	const a = solid(8, 8, [255, 0, 0, 255]);
	// second frame: green with a transparent hole
	const b = solid(8, 8, [0, 200, 0, 255]);
	b.data.set([0, 0, 0, 0], (3 * 8 + 3) * 4);
	return [
		{ image: a, durationMs: 200 },
		{ image: b, durationMs: 120 },
	];
};

describe("GIF round-trip", () => {
	it("preserves size, frame count, delays, and exact colors", () => {
		const frames = twoFrames();
		const bytes = encodeGIF(frames);
		expect(sniffAnimatedFormat(bytes.buffer as ArrayBuffer)).toBe("gif");
		const decoded = decodeGIF(bytes.buffer as ArrayBuffer);
		expect(decoded.width).toBe(8);
		expect(decoded.height).toBe(8);
		expect(decoded.frames.length).toBe(2);
		expect(decoded.frames[0].durationMs).toBe(200);
		expect(decoded.frames[1].durationMs).toBe(120);
		// frame 0 pixel is exactly red
		const d0 = decoded.frames[0].image.data;
		expect([d0[0], d0[1], d0[2], d0[3]]).toEqual([255, 0, 0, 255]);
		// frame 1 keeps its transparent hole (dispose=2 between frames)
		const d1 = decoded.frames[1].image.data;
		const hole = (3 * 8 + 3) * 4;
		expect(d1[hole + 3]).toBe(0);
		expect([d1[0], d1[1], d1[2]]).toEqual([0, 200, 0]);
	});

	it("encodes >255-color frames via quantization without throwing", () => {
		const img = solid(32, 32, [0, 0, 0, 255]);
		// 1024 distinct colors
		for (let i = 0; i < 32 * 32; i += 1) {
			img.data[i * 4] = i % 256;
			img.data[i * 4 + 1] = Math.floor(i / 4) % 256;
			img.data[i * 4 + 2] = (i * 7) % 256;
		}
		const bytes = encodeGIF([{ image: img, durationMs: 100 }]);
		const decoded = decodeGIF(bytes.buffer as ArrayBuffer);
		expect(decoded.frames.length).toBe(1);
	});

	it("rejects mismatched frame sizes", () => {
		expect(() =>
			encodeGIF([
				{ image: solid(4, 4, [0, 0, 0, 255]), durationMs: 100 },
				{ image: solid(5, 4, [0, 0, 0, 255]), durationMs: 100 },
			]),
		).toThrow();
	});
});

describe("APNG round-trip", () => {
	it("preserves frames, delays, and exact RGBA (lossless)", () => {
		const frames = twoFrames();
		const bytes = encodeAPNG(frames);
		expect(sniffAnimatedFormat(bytes.buffer as ArrayBuffer)).toBe("png");
		const decoded = decodeAPNG(bytes.buffer as ArrayBuffer);
		expect(decoded.frames.length).toBe(2);
		expect(decoded.frames[0].durationMs).toBe(200);
		const d1 = decoded.frames[1].image.data;
		const hole = (3 * 8 + 3) * 4;
		expect(d1[hole + 3]).toBe(0);
		expect([d1[0], d1[1], d1[2], d1[3]]).toEqual([0, 200, 0, 255]);
	});

	it("decodes a single static PNG as one frame", () => {
		const bytes = encodeAPNG([
			{ image: solid(4, 4, [10, 20, 30, 255]), durationMs: 100 },
		]);
		const decoded = decodeAnimation(bytes.buffer as ArrayBuffer);
		expect(decoded.frames.length).toBe(1);
		expect(decoded.frames[0].image.width).toBe(4);
	});
});

describe("sniffAnimatedFormat", () => {
	it("returns null for unknown data", () => {
		expect(
			sniffAnimatedFormat(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer),
		).toBeNull();
	});
});
