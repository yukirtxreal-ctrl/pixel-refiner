import type { RawImage } from "../shared/types";

/**
 * Animation frame utilities: size normalization, duplicate-frame detection,
 * and simple timing helpers. Pure functions — no DOM, no codecs — so they are
 * unit-testable and usable from both the browser UI and the worker.
 */

export type AnimFrame = {
	image: RawImage;
	/** Frame display duration in milliseconds. */
	durationMs: number;
};

export type DedupedFrame = AnimFrame & {
	/** Indices (into the original frame list) that this frame represents. */
	sourceIndices: number[];
};

/** FNV-1a hash over dimensions + pixel bytes. Stable across runs. */
export const frameHash = (img: RawImage): string => {
	let h = 0x811c9dc5;
	const mix = (byte: number) => {
		h ^= byte;
		// FNV prime 16777619, kept in 32-bit space.
		h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
	};
	mix(img.width & 0xff);
	mix((img.width >> 8) & 0xff);
	mix(img.height & 0xff);
	mix((img.height >> 8) & 0xff);
	const d = img.data;
	for (let i = 0; i < d.length; i += 1) {
		mix(d[i]);
	}
	return h.toString(16).padStart(8, "0");
};

/**
 * Merge consecutive AND non-consecutive identical frames into one entry each,
 * summing durations of consecutive repeats only. Non-consecutive repeats keep
 * playback order intact by NOT being merged across different neighbors —
 * animation player order must be preserved, so this dedupes storage, not the
 * timeline. Returns unique frames plus a play sequence referencing them.
 */
export const dedupeFrames = (
	frames: AnimFrame[],
): {
	unique: DedupedFrame[];
	/** For each original frame index, the index into `unique`. */
	sequence: number[];
	duplicatesRemoved: number;
} => {
	const byHash = new Map<string, number>();
	const unique: DedupedFrame[] = [];
	const sequence: number[] = [];
	for (let i = 0; i < frames.length; i += 1) {
		const f = frames[i];
		const key = frameHash(f.image);
		const existing = byHash.get(key);
		if (existing === undefined) {
			byHash.set(key, unique.length);
			sequence.push(unique.length);
			unique.push({
				image: f.image,
				durationMs: f.durationMs,
				sourceIndices: [i],
			});
		} else {
			unique[existing].sourceIndices.push(i);
			sequence.push(existing);
		}
	}
	return {
		unique,
		sequence,
		duplicatesRemoved: frames.length - unique.length,
	};
};

/**
 * Collapse consecutive repeats in a play sequence by extending the previous
 * frame's duration. Returns a timeline of {frameIndex, durationMs} entries.
 */
export const buildTimeline = (
	sequence: number[],
	frames: AnimFrame[],
): Array<{ frameIndex: number; durationMs: number }> => {
	const timeline: Array<{ frameIndex: number; durationMs: number }> = [];
	for (let i = 0; i < sequence.length; i += 1) {
		const idx = sequence[i];
		const dur = frames[i]?.durationMs ?? 100;
		const last = timeline[timeline.length - 1];
		if (last && last.frameIndex === idx) {
			last.durationMs += dur;
		} else {
			timeline.push({ frameIndex: idx, durationMs: dur });
		}
	}
	return timeline;
};

/**
 * Center-pad every frame with transparent pixels to the union of all frame
 * sizes so an animation whose frames were trimmed independently lines up
 * again. Odd differences bias the extra pixel to the right/bottom.
 */
export const padFramesToUnion = (frames: RawImage[]): RawImage[] => {
	if (frames.length === 0) return [];
	let w = 0;
	let h = 0;
	for (const f of frames) {
		if (f.width > w) w = f.width;
		if (f.height > h) h = f.height;
	}
	return frames.map((f) => {
		if (f.width === w && f.height === h) return f;
		const out = new Uint8ClampedArray(w * h * 4);
		const left = Math.floor((w - f.width) / 2);
		const top = Math.floor((h - f.height) / 2);
		for (let y = 0; y < f.height; y += 1) {
			const src = y * f.width * 4;
			const dst = ((top + y) * w + left) * 4;
			out.set(f.data.subarray(src, src + f.width * 4), dst);
		}
		return { width: w, height: h, data: out };
	});
};

/** Clamp a GIF-style delay to something players actually honor. */
export const normalizeDelayMs = (ms: number): number => {
	if (!Number.isFinite(ms) || ms <= 0) return 100;
	return Math.max(20, Math.round(ms));
};
