import { describe, expect, it } from "vitest";
import {
	atlasToAsepriteJSON,
	atlasToCSV,
	atlasToGodotSpriteFrames,
} from "./exporters";
import type { AtlasResult } from "./spritesheet";

const atlas: AtlasResult = {
	atlas: { width: 32, height: 16, data: new Uint8ClampedArray(32 * 16 * 4) },
	frames: [
		{ index: 0, name: "walk_0", x: 0, y: 0, w: 16, h: 16 },
		{ index: 1, name: "walk_1", x: 16, y: 0, w: 16, h: 16 },
	],
	columns: 2,
	rows: 1,
};

describe("atlasToAsepriteJSON", () => {
	it("produces Aseprite array-form JSON with durations and frameTags", () => {
		const parsed = JSON.parse(atlasToAsepriteJSON(atlas, "sheet.png", 80));
		expect(Array.isArray(parsed.frames)).toBe(true);
		expect(parsed.frames.length).toBe(2);
		expect(parsed.frames[0].filename).toBe("walk_0");
		expect(parsed.frames[0].frame).toEqual({ x: 0, y: 0, w: 16, h: 16 });
		expect(parsed.frames[0].duration).toBe(80);
		expect(parsed.meta.image).toBe("sheet.png");
		expect(parsed.meta.size).toEqual({ w: 32, h: 16 });
		expect(parsed.meta.frameTags[0]).toMatchObject({ from: 0, to: 1 });
	});
});

describe("atlasToGodotSpriteFrames", () => {
	it("emits a Godot 4 SpriteFrames resource with one AtlasTexture per frame", () => {
		const tres = atlasToGodotSpriteFrames(atlas, "res://sheet.png", 12);
		expect(tres).toContain('[gd_resource type="SpriteFrames"');
		expect(tres).toContain('path="res://sheet.png"');
		expect(tres.match(/\[sub_resource type="AtlasTexture"/g)?.length).toBe(2);
		expect(tres).toContain("region = Rect2(16, 0, 16, 16)");
		expect(tres).toContain('"speed": 12.0');
		// load_steps = frames + ext resource + resource itself
		expect(tres).toContain("load_steps=4");
	});
});

describe("atlasToCSV", () => {
	it("writes a header and one row per frame, quoting when needed", () => {
		const csv = atlasToCSV({
			...atlas,
			frames: [
				...atlas.frames,
				{ index: 2, name: 'we,ird"name', x: 0, y: 0, w: 1, h: 1 },
			],
		});
		const lines = csv.trim().split("\n");
		expect(lines[0]).toBe("name,x,y,w,h");
		expect(lines[1]).toBe("walk_0,0,0,16,16");
		expect(lines[3]).toBe('"we,ird""name",0,0,1,1');
	});
});
