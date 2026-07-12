import { describe, expect, it } from "vitest";
import type { RawImage } from "../shared/types";
import {
	atlasToJSON,
	packAtlas,
	sliceCutLines,
	sliceSheet,
} from "./spritesheet";

// Build a 4x2 image where each pixel has a distinct red value = index+1.
const makeSheet = (w: number, h: number): RawImage => {
	const data = new Uint8ClampedArray(w * h * 4);
	for (let i = 0; i < w * h; i++) {
		data[i * 4] = i + 1;
		data[i * 4 + 3] = 255;
	}
	return { width: w, height: h, data };
};

describe("spritesheet", () => {
	it("slices in grid mode row-major", () => {
		const sheet = makeSheet(4, 2);
		const frames = sliceSheet(sheet, { mode: "grid", cols: 4, rows: 2 });
		expect(frames.length).toBe(8);
		expect(frames[0].width).toBe(1);
		expect(frames[0].height).toBe(1);
		// frame 0 is top-left pixel (value 1); frame 4 is second row first pixel (value 5)
		expect(frames[0].data[0]).toBe(1);
		expect(frames[4].data[0]).toBe(5);
	});

	it("slices in cell mode with spacing", () => {
		// 5 wide: two 2px cells with a 1px gutter between -> x=0 and x=3
		const sheet = makeSheet(5, 2);
		const frames = sliceSheet(sheet, {
			mode: "cell",
			cellW: 2,
			cellH: 2,
			spacingX: 1,
		});
		expect(frames.length).toBe(2);
		expect(frames[0].width).toBe(2);
		expect(frames[0].data[0]).toBe(1); // pixel (0,0)
		expect(frames[1].data[0]).toBe(4); // pixel (3,0) -> value 4
	});

	it("packs frames into an atlas with padding and correct placement", () => {
		const a: RawImage = {
			width: 2,
			height: 2,
			data: new Uint8ClampedArray(2 * 2 * 4).fill(255),
		};
		const b: RawImage = {
			width: 2,
			height: 2,
			data: new Uint8ClampedArray(2 * 2 * 4).fill(255),
		};
		const res = packAtlas(
			[
				{ name: "a", image: a },
				{ name: "b", image: b },
			],
			{ columns: 2, padding: 1 },
		);
		// 2 cols * 2px + 3 pad = 7 ; 1 row * 2px + 2 pad = 4
		expect(res.atlas.width).toBe(7);
		expect(res.atlas.height).toBe(4);
		expect(res.frames[0]).toMatchObject({ name: "a", x: 1, y: 1, w: 2, h: 2 });
		expect(res.frames[1]).toMatchObject({ name: "b", x: 4, y: 1, w: 2, h: 2 });
	});

	it("computes interior cut lines matching grid geometry", () => {
		// 4x2 sliced into 4 cols x 2 rows -> interior verticals at 1,2,3; horizontal at 1
		const cuts = sliceCutLines(4, 2, { mode: "grid", cols: 4, rows: 2 });
		expect(cuts.xs).toEqual([1, 2, 3]);
		expect(cuts.ys).toEqual([1]);
	});

	it("computes cut lines for cell mode with spacing", () => {
		// 5 wide: two 2px cells with a 1px gutter -> cell edges at 2 and 3 (5 is the outer edge, excluded)
		const cuts = sliceCutLines(5, 2, {
			mode: "cell",
			cellW: 2,
			cellH: 2,
			spacingX: 1,
		});
		expect(cuts.xs).toEqual([2, 3]);
		expect(cuts.ys).toEqual([]);
	});

	it("produces valid atlas JSON", () => {
		const a: RawImage = {
			width: 2,
			height: 2,
			data: new Uint8ClampedArray(2 * 2 * 4),
		};
		const res = packAtlas([{ name: "hero.png", image: a }], {
			columns: 1,
			padding: 0,
		});
		const json = JSON.parse(atlasToJSON(res, "atlas.png"));
		expect(json.meta.image).toBe("atlas.png");
		expect(json.frames["hero.png"].frame).toEqual({ x: 0, y: 0, w: 2, h: 2 });
	});

	it("keeps every frame in the JSON when names collide", () => {
		const a: RawImage = {
			width: 2,
			height: 2,
			data: new Uint8ClampedArray(2 * 2 * 4),
		};
		const res = packAtlas(
			[
				{ name: "sprite", image: a },
				{ name: "sprite", image: a },
				{ name: "sprite", image: a },
			],
			{ columns: 3, padding: 0 },
		);
		const json = JSON.parse(atlasToJSON(res, "atlas.png"));
		expect(Object.keys(json.frames)).toEqual([
			"sprite",
			"sprite_1",
			"sprite_2",
		]);
	});
});
