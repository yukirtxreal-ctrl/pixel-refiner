import type { RGB } from "../shared/types";

/**
 * Parses a GIMP Palette (.gpl) string and returns an array of RGB colors.
 * Ignores comments and header lines.
 */
export const parseGPL = (text: string): RGB[] => {
	const lines = text.split(/\r?\n/);
	const colors: RGB[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		// Skip comments and the magic header. A GIMP palette starts with
		// "GIMP Palette", then optional "Name: ..." / "Columns: ..." headers and
		// "#" comments, then the color rows. Color rows always begin with the red
		// channel (a digit), while header lines begin with a letter, so we skip
		// any line that does not start with a digit. (An earlier version skipped
		// every line containing ":", which also dropped valid rows whose trailing
		// color name contains a colon, e.g. "255 0 0 Shade: dark".)
		if (trimmed.startsWith("#") || !/^\d/.test(trimmed)) {
			continue;
		}

		// Try to parse "R G B [Name]"
		const parts = trimmed.split(/\s+/).filter(Boolean);
		if (parts.length >= 3) {
			const r = parseInt(parts[0], 10);
			const g = parseInt(parts[1], 10);
			const b = parseInt(parts[2], 10);

			if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
				// Clamp out-of-range values (e.g. "999 0 0") like parseJASCPAL
				// does; unclamped channels corrupt distance math and hex output.
				colors.push({
					r: Math.max(0, Math.min(255, r)),
					g: Math.max(0, Math.min(255, g)),
					b: Math.max(0, Math.min(255, b)),
				});
			}
		}
	}

	return colors;
};

/**
 * Generates a GIMP Palette (.gpl) string from an array of RGB colors.
 */
export const generateGPL = (colors: RGB[], name: string): string => {
	const lines = ["GIMP Palette", `Name: ${name}`, "Columns: 4", "#"];

	for (const c of colors) {
		// Format: R G B Name
		const r = c.r.toString().padStart(3, " ");
		const g = c.g.toString().padStart(3, " ");
		const b = c.b.toString().padStart(3, " ");

		// Convert to hex for the name part
		const rHex = c.r.toString(16).padStart(2, "0").toUpperCase();
		const gHex = c.g.toString(16).padStart(2, "0").toUpperCase();
		const bHex = c.b.toString(16).padStart(2, "0").toUpperCase();
		const hex = `#${rHex}${gHex}${bHex}`;

		lines.push(`${r} ${g} ${b}\t${hex}`);
	}

	return lines.join("\n");
};

/**
 * Generates a PNG blob from an array of RGB colors.
 * The image will be 1px high and Npx wide.
 * Note: This function uses DOM APIs so it must run in browser context.
 */
export const generatePaletteImage = (colors: RGB[]): Promise<Blob | null> => {
	return new Promise((resolve) => {
		if (colors.length === 0) {
			resolve(null);
			return;
		}

		const canvas = document.createElement("canvas");
		canvas.width = colors.length;
		canvas.height = 1;
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			resolve(null);
			return;
		}

		const imgData = ctx.createImageData(colors.length, 1);
		for (let i = 0; i < colors.length; i++) {
			const c = colors[i];
			const idx = i * 4;
			imgData.data[idx] = c.r;
			imgData.data[idx + 1] = c.g;
			imgData.data[idx + 2] = c.b;
			imgData.data[idx + 3] = 255; // Alpha
		}
		ctx.putImageData(imgData, 0, 0);

		canvas.toBlob((blob) => {
			resolve(blob);
		}, "image/png");
	});
};

/**
 * Finds the nearest color in the palette using Euclidean distance.
 */
export const findNearestColor = (target: RGB, palette: RGB[]): RGB => {
	if (palette.length === 0) return target;

	let minDist = Infinity;
	let nearest = palette[0];

	for (const p of palette) {
		// Simple Euclidean distance in RGB space
		const dr = target.r - p.r;
		const dg = target.g - p.g;
		const db = target.b - p.b;
		const dist = dr * dr + dg * dg + db * db;

		if (dist < minDist) {
			minDist = dist;
			nearest = p;
		}
	}

	return nearest;
};

/**
 * Sorts palette colors by relative luminance (perceived brightness).
 * Sorts from Brightest to Darkest.
 */
export const sortPalette = (palette: RGB[]): RGB[] => {
	return [...palette].sort((a, b) => {
		// Calculate relative luminance
		// L = 0.2126*R + 0.7152*G + 0.0722*B (Rec. 709)
		// or simpler: 0.299*R + 0.587*G + 0.114*B (Rec. 601)
		// Using Rec. 601 for simplicity as it matches common perception well enough
		const getLum = (c: RGB) => c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
		return getLum(b) - getLum(a); // Descending (High L -> Low L)
	});
};

/**
 * Median cut algorithm to select representative colors from a palette.
 * Recursively divides the color space to find the most diverse colors.
 */
const medianCut = (colors: RGB[], maxColors: number): RGB[] => {
	if (colors.length <= maxColors) {
		return colors;
	}

	// Create buckets for recursive division
	const buckets: RGB[][] = [colors];

	while (buckets.length < maxColors) {
		// Find the bucket with the largest range
		let maxRange = -1;
		let maxBucketIndex = 0;
		let maxChannel: "r" | "g" | "b" = "r";

		for (let i = 0; i < buckets.length; i++) {
			const bucket = buckets[i];
			if (bucket.length === 1) continue;

			// Calculate range for each channel
			const rRange = getRange(bucket, "r");
			const gRange = getRange(bucket, "g");
			const bRange = getRange(bucket, "b");

			const range = Math.max(rRange, gRange, bRange);
			if (range > maxRange) {
				maxRange = range;
				maxBucketIndex = i;
				if (rRange >= gRange && rRange >= bRange) {
					maxChannel = "r";
				} else if (gRange >= bRange) {
					maxChannel = "g";
				} else {
					maxChannel = "b";
				}
			}
		}

		// If no bucket can be split, break
		if (maxRange === -1) break;

		// Split the bucket at the median
		const bucket = buckets[maxBucketIndex];
		bucket.sort((a, b) => a[maxChannel] - b[maxChannel]);
		const median = Math.floor(bucket.length / 2);

		buckets.splice(
			maxBucketIndex,
			1,
			bucket.slice(0, median),
			bucket.slice(median),
		);
	}

	// Return the average color of each bucket
	return buckets.map((bucket) => {
		const sum = bucket.reduce(
			(acc, c) => ({
				r: acc.r + c.r,
				g: acc.g + c.g,
				b: acc.b + c.b,
			}),
			{ r: 0, g: 0, b: 0 },
		);
		return {
			r: Math.round(sum.r / bucket.length),
			g: Math.round(sum.g / bucket.length),
			b: Math.round(sum.b / bucket.length),
		};
	});
};

/**
 * Calculate the range of a color channel in a bucket.
 */
const getRange = (colors: RGB[], channel: "r" | "g" | "b"): number => {
	let min = 255;
	let max = 0;
	for (const c of colors) {
		if (c[channel] < min) min = c[channel];
		if (c[channel] > max) max = c[channel];
	}
	return max - min;
};

/**
 * Extracts unique colors from ImageData.
 * @param imageData - The ImageData to extract colors from
 * @param maxColors - Maximum number of colors to return (default: no limit)
 * @returns Object containing extracted colors array and total unique color count
 */
export const extractColorsFromImage = (
	imageData: ImageData,
	maxColors?: number,
): { colors: RGB[]; totalColors: number } => {
	const colors: RGB[] = [];
	const seen = new Set<string>();
	const data = imageData.data;

	// Extract all unique colors
	for (let i = 0; i < data.length; i += 4) {
		// Skip transparent pixels (alpha < 128)
		if (data[i + 3] < 128) continue;

		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const key = `${r},${g},${b}`;

		if (!seen.has(key)) {
			seen.add(key);
			colors.push({ r, g, b });
		}
	}

	const totalColors = colors.length;

	// If maxColors is specified and we have more colors than the limit,
	// use median cut algorithm to select representative colors
	if (maxColors !== undefined && colors.length > maxColors) {
		const selected = medianCut(colors, maxColors);
		// Sort the selected colors by luminance for consistent display
		const sorted = sortPalette(selected);
		return {
			colors: sorted,
			totalColors,
		};
	}

	return { colors, totalColors };
};

const clamp255 = (n: number): number =>
	Math.max(0, Math.min(255, Math.round(n)));

const toHex2 = (n: number): string =>
	clamp255(n).toString(16).padStart(2, "0").toUpperCase();

/**
 * Generates a plain hex list (one `RRGGBB` per line). Compatible with Lospec /
 * Paint.NET and importable by Aseprite.
 */
export const generateHEX = (colors: RGB[]): string =>
	colors.map((c) => `${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}`).join("\n");

/**
 * Parses a hex list (one color per line, `#RRGGBB` or `RRGGBB`, optional 8-digit
 * form with alpha which is ignored). Lines starting with `;` are comments.
 */
export const parseHEX = (text: string): RGB[] => {
	const colors: RGB[] = [];
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line || line.startsWith(";")) continue;
		const token = line.split(/\s+/)[0].replace(/^#/, "");
		const m = token.match(/^([0-9a-fA-F]{6})(?:[0-9a-fA-F]{2})?$/);
		if (!m) continue;
		colors.push({
			r: parseInt(m[1].slice(0, 2), 16),
			g: parseInt(m[1].slice(2, 4), 16),
			b: parseInt(m[1].slice(4, 6), 16),
		});
	}
	return colors;
};

/** Generates a JASC-PAL (.pal) string, the format used by Paint Shop Pro / GraphicsGale. */
export const generateJASCPAL = (colors: RGB[]): string => {
	const lines = ["JASC-PAL", "0100", String(colors.length)];
	for (const c of colors) {
		lines.push(`${clamp255(c.r)} ${clamp255(c.g)} ${clamp255(c.b)}`);
	}
	// The JASC-PAL format expects CRLF line endings; Paint Shop Pro rejects
	// LF-only .pal files. Our own parseJASCPAL accepts both.
	return lines.join("\r\n");
};

/** Parses a JASC-PAL (.pal) string. */
export const parseJASCPAL = (text: string): RGB[] => {
	const lines = text.split(/\r?\n/).map((l) => l.trim());
	const start = lines[0] && /^JASC-PAL/i.test(lines[0]) ? 3 : 0;
	const colors: RGB[] = [];
	for (let i = start; i < lines.length; i++) {
		if (!lines[i]) continue;
		const parts = lines[i].split(/\s+/).filter(Boolean);
		if (parts.length < 3) continue;
		const r = parseInt(parts[0], 10);
		const g = parseInt(parts[1], 10);
		const b = parseInt(parts[2], 10);
		if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) continue;
		colors.push({ r: clamp255(r), g: clamp255(g), b: clamp255(b) });
	}
	return colors;
};

/**
 * Parses a palette from text, auto-detecting the format: JASC-PAL, GIMP (.gpl),
 * or a plain hex list.
 */
export const parseAnyPalette = (text: string): RGB[] => {
	const t = text.trimStart();
	if (/^JASC-PAL/i.test(t)) return parseJASCPAL(text);
	if (/^GIMP Palette/i.test(t)) return parseGPL(text);
	const hex = parseHEX(text);
	if (hex.length > 0) return hex;
	return parseGPL(text);
};
