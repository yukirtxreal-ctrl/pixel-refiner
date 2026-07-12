import type { RGB } from "../shared/types";

/**
 * Palette ramp organization: group palette colors into hue families and sort
 * each family dark -> light, plus near-duplicate merge suggestions. Used by
 * the Palette / Recolor tool's "Organize ramps" view.
 */

export type Ramp = {
	/** Representative hue in degrees, or null for the neutral (gray) ramp. */
	hue: number | null;
	colors: RGB[];
};

export type MergeSuggestion = {
	a: RGB;
	b: RGB;
	/** Euclidean RGB distance (0..441). */
	distance: number;
};

const rgbToHsl = (c: RGB): { h: number; s: number; l: number } => {
	const r = c.r / 255;
	const g = c.g / 255;
	const b = c.b / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	const d = max - min;
	if (d === 0) return { h: 0, s: 0, l };
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
	else if (max === g) h = ((b - r) / d + 2) / 6;
	else h = ((r - g) / d + 4) / 6;
	return { h: h * 360, s, l };
};

/** Perceived luminance (0..1), Rec. 601 weights. */
export const luminance = (c: RGB): number =>
	(0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;

const hueDistance = (a: number, b: number): number => {
	const d = Math.abs(a - b) % 360;
	return d > 180 ? 360 - d : d;
};

/**
 * Group colors into ramps: low-saturation colors form a neutral ramp; the
 * rest cluster greedily by hue proximity (`hueTolerance` degrees). Each ramp
 * is sorted dark -> light. Ramps are ordered neutral-first, then by hue.
 */
export const organizeIntoRamps = (
	palette: RGB[],
	hueTolerance = 30,
	saturationFloor = 0.12,
): Ramp[] => {
	const neutrals: RGB[] = [];
	const chromatic: Array<{ c: RGB; h: number }> = [];
	for (const c of palette) {
		const { s } = rgbToHsl(c);
		if (s < saturationFloor) neutrals.push(c);
		else chromatic.push({ c, h: rgbToHsl(c).h });
	}

	const ramps: Array<{ hue: number; items: Array<{ c: RGB; h: number }> }> = [];
	for (const item of chromatic) {
		let placed = false;
		for (const ramp of ramps) {
			if (hueDistance(ramp.hue, item.h) <= hueTolerance) {
				ramp.items.push(item);
				// Recenter the ramp hue on its members (running mean on a circle
				// is overkill at this scale; nudge toward the newcomer instead).
				ramp.hue = ramp.hue + hueDistance(ramp.hue, item.h) * 0;
				placed = true;
				break;
			}
		}
		if (!placed) ramps.push({ hue: item.h, items: [item] });
	}

	const byLum = (a: RGB, b: RGB) => luminance(a) - luminance(b);
	const result: Ramp[] = [];
	if (neutrals.length > 0) {
		result.push({ hue: null, colors: [...neutrals].sort(byLum) });
	}
	ramps.sort((a, b) => a.hue - b.hue);
	for (const ramp of ramps) {
		result.push({
			hue: ramp.hue,
			colors: ramp.items.map((i) => i.c).sort(byLum),
		});
	}
	return result;
};

/**
 * Suggest merging color pairs whose RGB distance is below `threshold`
 * (default 24 — barely distinguishable at pixel-art scale). Each color
 * appears in at most one suggestion (greedy nearest-pair matching); the
 * darker color of the pair is listed first as the suggested survivor.
 */
export const suggestMerges = (
	palette: RGB[],
	threshold = 24,
): MergeSuggestion[] => {
	const pairs: Array<{ i: number; j: number; d: number }> = [];
	for (let i = 0; i < palette.length; i += 1) {
		for (let j = i + 1; j < palette.length; j += 1) {
			const dr = palette[i].r - palette[j].r;
			const dg = palette[i].g - palette[j].g;
			const db = palette[i].b - palette[j].b;
			const d = Math.sqrt(dr * dr + dg * dg + db * db);
			if (d <= threshold) pairs.push({ i, j, d });
		}
	}
	pairs.sort((a, b) => a.d - b.d);
	const used = new Set<number>();
	const suggestions: MergeSuggestion[] = [];
	for (const p of pairs) {
		if (used.has(p.i) || used.has(p.j)) continue;
		used.add(p.i);
		used.add(p.j);
		const a = palette[p.i];
		const b = palette[p.j];
		const darkFirst = luminance(a) <= luminance(b) ? [a, b] : [b, a];
		suggestions.push({
			a: darkFirst[0],
			b: darkFirst[1],
			distance: Math.round(p.d * 100) / 100,
		});
	}
	return suggestions;
};
