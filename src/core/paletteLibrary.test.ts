import { describe, expect, it } from "vitest";
import {
	BUILTIN_PALETTES,
	getBuiltinPalette,
	hexToRgb,
} from "./paletteLibrary";

describe("BUILTIN_PALETTES", () => {
	it("has unique ids and valid hex colors", () => {
		const ids = new Set<string>();
		for (const p of BUILTIN_PALETTES) {
			expect(ids.has(p.id)).toBe(false);
			ids.add(p.id);
			expect(p.colors.length).toBeGreaterThan(0);
			for (const c of p.colors) {
				expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
			}
			// no duplicate colors within a palette
			expect(new Set(p.colors.map((c) => c.toUpperCase())).size).toBe(
				p.colors.length,
			);
		}
	});

	it("contains the expected classics with correct sizes", () => {
		const sizes = Object.fromEntries(
			BUILTIN_PALETTES.map((p) => [p.id, p.colors.length]),
		);
		expect(sizes.pico8).toBe(16);
		expect(sizes.sweetie16).toBe(16);
		expect(sizes.db16).toBe(16);
		expect(sizes.db32).toBe(32);
		expect(sizes.endesga32).toBe(32);
		expect(sizes.slso8).toBe(8);
		expect(sizes.oil6).toBe(6);
	});
});

describe("getBuiltinPalette", () => {
	it("parses hex into RGB and returns null for unknown ids", () => {
		const pico = getBuiltinPalette("pico8");
		expect(pico?.length).toBe(16);
		expect(pico?.[0]).toEqual({ r: 0, g: 0, b: 0 });
		expect(getBuiltinPalette("nope")).toBeNull();
	});
});

describe("hexToRgb", () => {
	it("parses with and without the leading hash", () => {
		expect(hexToRgb("#FF8000")).toEqual({ r: 255, g: 128, b: 0 });
		expect(hexToRgb("0080FF")).toEqual({ r: 0, g: 128, b: 255 });
	});
});
