import type { RawImage } from "../shared/types";

/**
 * Per-tile color budget analysis and enforcement, in the spirit of retro
 * hardware limits (e.g. 3 colors + transparent per 8x8 tile on the NES, 15
 * per SFC tile). This enforces a maximum number of distinct visible colors
 * per tile; it does not model shared sub-palettes across tiles.
 */

export type TileConstraintOptions = {
	tileW: number;
	tileH: number;
	/** Max distinct opaque colors allowed per tile. */
	maxColors: number;
	/** Pixels below this alpha are ignored (treated as transparent). */
	alphaThreshold?: number;
};

export type TileAnalysis = {
	tilesX: number;
	tilesY: number;
	/** Distinct visible color count per tile, row-major. */
	counts: number[];
	maxCount: number;
	/** Tile indices (row-major) exceeding the budget. */
	violations: number[];
};

const colorKey = (r: number, g: number, b: number): number =>
	(r << 16) | (g << 8) | b;

/** Count distinct visible colors in every tile. */
export const analyzeTileColors = (
	img: RawImage,
	opts: TileConstraintOptions,
): TileAnalysis => {
	const { tileW, tileH, maxColors } = opts;
	const alphaThreshold = opts.alphaThreshold ?? 1;
	const tilesX = Math.max(1, Math.ceil(img.width / tileW));
	const tilesY = Math.max(1, Math.ceil(img.height / tileH));
	const counts: number[] = new Array(tilesX * tilesY).fill(0);
	const violations: number[] = [];
	let maxCount = 0;

	for (let ty = 0; ty < tilesY; ty += 1) {
		for (let tx = 0; tx < tilesX; tx += 1) {
			const seen = new Set<number>();
			const x1 = Math.min(img.width, (tx + 1) * tileW);
			const y1 = Math.min(img.height, (ty + 1) * tileH);
			for (let y = ty * tileH; y < y1; y += 1) {
				for (let x = tx * tileW; x < x1; x += 1) {
					const i = (y * img.width + x) * 4;
					if (img.data[i + 3] < alphaThreshold) continue;
					seen.add(colorKey(img.data[i], img.data[i + 1], img.data[i + 2]));
				}
			}
			const c = seen.size;
			const t = ty * tilesX + tx;
			counts[t] = c;
			if (c > maxCount) maxCount = c;
			if (c > maxColors) violations.push(t);
		}
	}
	return { tilesX, tilesY, counts, maxCount, violations };
};

/**
 * Enforce the per-tile budget: inside each violating tile, keep the
 * `maxColors` most frequent colors and remap every other pixel to the nearest
 * kept color (plain RGB distance). Returns a NEW image plus stats.
 */
export const enforceTileColorBudget = (
	img: RawImage,
	opts: TileConstraintOptions,
): { image: RawImage; changedPixels: number; violatingTiles: number } => {
	const { tileW, tileH, maxColors } = opts;
	const alphaThreshold = opts.alphaThreshold ?? 1;
	const out: RawImage = {
		width: img.width,
		height: img.height,
		data: new Uint8ClampedArray(img.data),
	};
	const tilesX = Math.max(1, Math.ceil(img.width / tileW));
	const tilesY = Math.max(1, Math.ceil(img.height / tileH));
	let changedPixels = 0;
	let violatingTiles = 0;

	for (let ty = 0; ty < tilesY; ty += 1) {
		for (let tx = 0; tx < tilesX; tx += 1) {
			const x1 = Math.min(img.width, (tx + 1) * tileW);
			const y1 = Math.min(img.height, (ty + 1) * tileH);

			// Tally color frequencies inside the tile.
			const freq = new Map<number, number>();
			for (let y = ty * tileH; y < y1; y += 1) {
				for (let x = tx * tileW; x < x1; x += 1) {
					const i = (y * out.width + x) * 4;
					if (out.data[i + 3] < alphaThreshold) continue;
					const k = colorKey(out.data[i], out.data[i + 1], out.data[i + 2]);
					freq.set(k, (freq.get(k) ?? 0) + 1);
				}
			}
			if (freq.size <= maxColors) continue;
			violatingTiles += 1;

			// Keep the most frequent colors (ties: darker first for stability).
			const kept = [...freq.entries()]
				.sort((a, b) => b[1] - a[1] || a[0] - b[0])
				.slice(0, maxColors)
				.map(([k]) => k);
			const keptRgb = kept.map((k) => [
				(k >> 16) & 255,
				(k >> 8) & 255,
				k & 255,
			]);
			const keptSet = new Set(kept);

			// Remap non-kept pixels to the nearest kept color.
			for (let y = ty * tileH; y < y1; y += 1) {
				for (let x = tx * tileW; x < x1; x += 1) {
					const i = (y * out.width + x) * 4;
					if (out.data[i + 3] < alphaThreshold) continue;
					const r = out.data[i];
					const g = out.data[i + 1];
					const b = out.data[i + 2];
					if (keptSet.has(colorKey(r, g, b))) continue;
					let best = 0;
					let bestDist = Number.POSITIVE_INFINITY;
					for (let c = 0; c < keptRgb.length; c += 1) {
						const dr = r - keptRgb[c][0];
						const dg = g - keptRgb[c][1];
						const db = b - keptRgb[c][2];
						const dist = dr * dr + dg * dg + db * db;
						if (dist < bestDist) {
							bestDist = dist;
							best = c;
						}
					}
					out.data[i] = keptRgb[best][0];
					out.data[i + 1] = keptRgb[best][1];
					out.data[i + 2] = keptRgb[best][2];
					changedPixels += 1;
				}
			}
		}
	}
	return { image: out, changedPixels, violatingTiles };
};
