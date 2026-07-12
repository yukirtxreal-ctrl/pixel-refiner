/**
 * Minimal type declarations for codec dependencies that ship without types
 * (gifenc, upng-js). gifuct-js bundles its own declarations.
 */

declare module "gifenc" {
	export type GifPaletteColor = number[];
	export type GifPalette = GifPaletteColor[];

	export function quantize(
		rgba: Uint8Array | Uint8ClampedArray,
		maxColors: number,
		opts?: {
			format?: "rgb565" | "rgb444" | "rgba4444";
			oneBitAlpha?: boolean | number;
			clearAlpha?: boolean;
			clearAlphaThreshold?: number;
			clearAlphaColor?: number;
		},
	): GifPalette;

	export function applyPalette(
		rgba: Uint8Array | Uint8ClampedArray,
		palette: GifPalette,
		format?: "rgb565" | "rgb444" | "rgba4444",
	): Uint8Array;

	export interface GifEncoderInstance {
		writeFrame(
			index: Uint8Array,
			width: number,
			height: number,
			opts?: {
				palette?: GifPalette;
				delay?: number;
				repeat?: number;
				transparent?: boolean;
				transparentIndex?: number;
				dispose?: number;
				colorDepth?: number;
				first?: boolean;
			},
		): void;
		finish(): void;
		bytes(): Uint8Array;
		bytesView(): Uint8Array;
	}

	export function GIFEncoder(opts?: {
		auto?: boolean;
		initialCapacity?: number;
	}): GifEncoderInstance;
}

declare module "upng-js" {
	export interface UPNGFrame {
		delay?: number;
		[key: string]: unknown;
	}
	export interface UPNGImage {
		width: number;
		height: number;
		depth: number;
		ctype: number;
		frames: UPNGFrame[];
		data: Uint8Array;
	}
	export function decode(buffer: ArrayBuffer | Uint8Array): UPNGImage;
	export function toRGBA8(img: UPNGImage): ArrayBuffer[];
	export function encode(
		imgs: ArrayBuffer[],
		w: number,
		h: number,
		cnum: number,
		dels?: number[],
	): ArrayBuffer;
}
