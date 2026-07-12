import type { RawImage } from "../shared/types";

/**
 * Seamless-tile helpers: repeat an image into an nx x ny grid and report
 * mismatches between opposite edges (what breaks visible seams when the
 * image is used as a repeating tile).
 */

export type SeamReport = {
	/** Rows (y) where the left and right edges differ. */
	horizontalMismatches: number[];
	/** Columns (x) where the top and bottom edges differ. */
	verticalMismatches: number[];
	horizontalSeamless: boolean;
	verticalSeamless: boolean;
};

/** Repeat `img` nx x ny times into one image. */
export const tileImage = (img: RawImage, nx: number, ny: number): RawImage => {
	const w = img.width * nx;
	const h = img.height * ny;
	const out = new Uint8ClampedArray(w * h * 4);
	const rowBytes = img.width * 4;
	for (let ty = 0; ty < ny; ty += 1) {
		for (let y = 0; y < img.height; y += 1) {
			const srcRow = img.data.subarray(y * rowBytes, (y + 1) * rowBytes);
			const dstY = ty * img.height + y;
			for (let tx = 0; tx < nx; tx += 1) {
				out.set(srcRow, (dstY * w + tx * img.width) * 4);
			}
		}
	}
	return { width: w, height: h, data: out };
};

const pxDiffers = (
	img: RawImage,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	tolerance: number,
): boolean => {
	const a = (y1 * img.width + x1) * 4;
	const b = (y2 * img.width + x2) * 4;
	// Both fully transparent -> equal regardless of RGB.
	if (img.data[a + 3] === 0 && img.data[b + 3] === 0) return false;
	return (
		Math.abs(img.data[a] - img.data[b]) > tolerance ||
		Math.abs(img.data[a + 1] - img.data[b + 1]) > tolerance ||
		Math.abs(img.data[a + 2] - img.data[b + 2]) > tolerance ||
		Math.abs(img.data[a + 3] - img.data[b + 3]) > tolerance
	);
};

/**
 * Compare the wrap edges: left column vs right column (horizontal repeat)
 * and top row vs bottom row (vertical repeat).
 */
export const analyzeSeams = (img: RawImage, tolerance = 0): SeamReport => {
	const horizontalMismatches: number[] = [];
	const verticalMismatches: number[] = [];
	for (let y = 0; y < img.height; y += 1) {
		if (pxDiffers(img, 0, y, img.width - 1, y, tolerance)) {
			horizontalMismatches.push(y);
		}
	}
	for (let x = 0; x < img.width; x += 1) {
		if (pxDiffers(img, x, 0, x, img.height - 1, tolerance)) {
			verticalMismatches.push(x);
		}
	}
	return {
		horizontalMismatches,
		verticalMismatches,
		horizontalSeamless: horizontalMismatches.length === 0,
		verticalSeamless: verticalMismatches.length === 0,
	};
};
