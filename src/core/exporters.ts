import type { AtlasResult } from "./spritesheet";

/**
 * Extra atlas metadata exporters: Aseprite-compatible JSON (array form),
 * Godot 4 SpriteFrames resource, and a plain CSV. The atlas PNG itself is
 * produced by the caller; these serialize the frame layout.
 */

export type AtlasExportFormat = "texturepacker" | "aseprite" | "godot" | "csv";

/**
 * Aseprite sprite-sheet JSON (array form), as produced by Aseprite's own
 * "Export Sprite Sheet" and accepted by most Aseprite-JSON importers.
 */
export const atlasToAsepriteJSON = (
	result: AtlasResult,
	imageName: string,
	frameDurationMs = 100,
): string => {
	const frames = result.frames.map((f) => ({
		filename: f.name,
		frame: { x: f.x, y: f.y, w: f.w, h: f.h },
		rotated: false,
		trimmed: false,
		spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
		sourceSize: { w: f.w, h: f.h },
		duration: frameDurationMs,
	}));
	return JSON.stringify(
		{
			frames,
			meta: {
				app: "PixelRefiner",
				version: "1.0",
				image: imageName,
				format: "RGBA8888",
				size: { w: result.atlas.width, h: result.atlas.height },
				scale: "1",
				frameTags: [
					{
						name: "default",
						from: 0,
						to: Math.max(0, result.frames.length - 1),
						direction: "forward",
					},
				],
				layers: [{ name: "Layer 1", opacity: 255, blendMode: "normal" }],
				slices: [],
			},
		},
		null,
		2,
	);
};

/**
 * Godot 4 SpriteFrames .tres resource: one AtlasTexture sub-resource per
 * frame, all in a "default" animation. `pngPath` is the resource path of the
 * atlas image inside the Godot project (e.g. "res://sprites/atlas.png").
 */
export const atlasToGodotSpriteFrames = (
	result: AtlasResult,
	pngPath: string,
	fps = 10,
): string => {
	const n = result.frames.length;
	const lines: string[] = [];
	lines.push(
		`[gd_resource type="SpriteFrames" load_steps=${n + 2} format=3]`,
		"",
		`[ext_resource type="Texture2D" path="${pngPath}" id="1"]`,
		"",
	);
	result.frames.forEach((f, i) => {
		lines.push(
			`[sub_resource type="AtlasTexture" id="AtlasTexture_${i + 1}"]`,
			`atlas = ExtResource("1")`,
			`region = Rect2(${f.x}, ${f.y}, ${f.w}, ${f.h})`,
			"",
		);
	});
	const frameRefs = result.frames
		.map(
			(_f, i) =>
				`{\n"duration": 1.0,\n"texture": SubResource("AtlasTexture_${i + 1}")\n}`,
		)
		.join(", ");
	lines.push(
		"[resource]",
		`animations = [{`,
		`"frames": [${frameRefs}],`,
		`"loop": true,`,
		`"name": &"default",`,
		`"speed": ${fps.toFixed(1)}`,
		`}]`,
		"",
	);
	return lines.join("\n");
};

/** Plain CSV: name,x,y,w,h — trivially parseable anywhere. */
export const atlasToCSV = (result: AtlasResult): string => {
	const rows = ["name,x,y,w,h"];
	for (const f of result.frames) {
		const safe = /[",\n]/.test(f.name)
			? `"${f.name.replace(/"/g, '""')}"`
			: f.name;
		rows.push(`${safe},${f.x},${f.y},${f.w},${f.h}`);
	}
	return `${rows.join("\n")}\n`;
};
