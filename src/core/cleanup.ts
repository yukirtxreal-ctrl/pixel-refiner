import type { RawImage } from "../shared/types";

/**
 * Post-process cleanup passes for refined pixel art: stray ("orphan") pixel
 * removal and single-pixel speckle smoothing. Both operate in place and are
 * conservative by design — they only touch pixels whose entire neighborhood
 * disagrees with them.
 */

export type CleanupResult = {
	orphansRemoved: number;
	speckleRecolored: number;
};

const idx = (w: number, x: number, y: number): number => (y * w + x) * 4;

/**
 * Remove opaque pixels that have NO opaque neighbor (8-connectivity): true
 * isolated specks, usually AA leftovers or background-removal residue.
 * Pixels below `alphaThreshold` count as transparent.
 */
export const removeOrphanPixelsInPlace = (
	img: RawImage,
	alphaThreshold = 1,
): number => {
	const { width: w, height: h, data } = img;
	const toClear: number[] = [];
	for (let y = 0; y < h; y += 1) {
		for (let x = 0; x < w; x += 1) {
			const i = idx(w, x, y);
			if (data[i + 3] < alphaThreshold) continue;
			let hasOpaqueNeighbor = false;
			for (let dy = -1; dy <= 1 && !hasOpaqueNeighbor; dy += 1) {
				for (let dx = -1; dx <= 1; dx += 1) {
					if (dx === 0 && dy === 0) continue;
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
					if (data[idx(w, nx, ny) + 3] >= alphaThreshold) {
						hasOpaqueNeighbor = true;
						break;
					}
				}
			}
			if (!hasOpaqueNeighbor) toClear.push(i);
		}
	}
	for (const i of toClear) {
		data[i + 3] = 0;
	}
	return toClear.length;
};

/**
 * Recolor single-pixel speckles: an opaque pixel whose 4-neighbors are all
 * opaque and all share ONE color different from its own gets that color.
 * This smooths lone "noise" pixels inside flat areas without touching edges
 * (edges never have four identical neighbors).
 */
export const despeckleInPlace = (img: RawImage, alphaThreshold = 1): number => {
	const { width: w, height: h, data } = img;
	// Collect replacements first so earlier fixes don't cascade into later ones.
	const fixes: Array<{ i: number; r: number; g: number; b: number }> = [];
	for (let y = 1; y < h - 1; y += 1) {
		for (let x = 1; x < w - 1; x += 1) {
			const i = idx(w, x, y);
			if (data[i + 3] < alphaThreshold) continue;
			const n = idx(w, x, y - 1);
			const s = idx(w, x, y + 1);
			const e = idx(w, x + 1, y);
			const west = idx(w, x - 1, y);
			if (
				data[n + 3] < alphaThreshold ||
				data[s + 3] < alphaThreshold ||
				data[e + 3] < alphaThreshold ||
				data[west + 3] < alphaThreshold
			) {
				continue;
			}
			const nr = data[n];
			const ng = data[n + 1];
			const nb = data[n + 2];
			const allSame =
				data[s] === nr &&
				data[s + 1] === ng &&
				data[s + 2] === nb &&
				data[e] === nr &&
				data[e + 1] === ng &&
				data[e + 2] === nb &&
				data[west] === nr &&
				data[west + 1] === ng &&
				data[west + 2] === nb;
			if (!allSame) continue;
			const differs =
				data[i] !== nr || data[i + 1] !== ng || data[i + 2] !== nb;
			if (differs) fixes.push({ i, r: nr, g: ng, b: nb });
		}
	}
	for (const f of fixes) {
		data[f.i] = f.r;
		data[f.i + 1] = f.g;
		data[f.i + 2] = f.b;
	}
	return fixes.length;
};

/** Run both passes (orphans first, then speckles). */
export const cleanStrayPixelsInPlace = (
	img: RawImage,
	alphaThreshold = 1,
): CleanupResult => {
	const orphansRemoved = removeOrphanPixelsInPlace(img, alphaThreshold);
	const speckleRecolored = despeckleInPlace(img, alphaThreshold);
	return { orphansRemoved, speckleRecolored };
};
