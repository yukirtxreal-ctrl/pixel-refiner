import JSZip from "jszip";
import {
	type AnimFrame,
	buildTimeline,
	dedupeFrames,
	padFramesToUnion,
} from "../core/animation";
import { decodeAnimation, encodeAPNG, encodeGIF } from "../core/animcodec";
import {
	atlasToAsepriteJSON,
	atlasToCSV,
	atlasToGodotSpriteFrames,
} from "../core/exporters";
import { BUILTIN_PALETTES, getBuiltinPalette } from "../core/paletteLibrary";
import { organizeIntoRamps, suggestMerges } from "../core/paletteRamps";
import { mapImageToPalette } from "../core/recolor";
import { atlasToJSON, packAtlas } from "../core/spritesheet";
import { analyzeSeams, tileImage } from "../core/tileable";
import { analyzeTileColors } from "../core/tileConstraint";
import type { RawImage, RGB } from "../shared/types";
import { extractColorsFromImage } from "../utils/palette";
import { i18n } from "./i18n";
import { drawRawImageToCanvas } from "./io";

/**
 * Extra features added on top of the three fork tools: Animation Studio,
 * Touch-up editor, Seamless check, Tile heatmap, palette library / ramps,
 * and shareable settings links. Wired from app.ts via initExtras().
 */

export type ExtrasDeps = {
	getActiveResult: () => RawImage | null;
	getActiveName: () => string;
	addRawAsImage: (name: string, raw: RawImage) => Promise<void> | void;
	showInfo: (msg: string) => void;
	showError: (msg: string) => void;
	getUiState: () => Record<string, string | number | boolean>;
	applyUiState: (state: Record<string, string | number | boolean>) => void;
	/** Run the full refine pipeline with the CURRENT settings on any image. */
	processRaw: (raw: RawImage) => Promise<RawImage>;
	/** Replace the active image's result (updates session + viewers). */
	setActiveResult: (raw: RawImage) => void;
	/** Pre-transparency comparison image for the active result, if any. */
	getRestoreSource: () => RawImage | null;
	/** Install a fixed palette and switch color reduction to it. */
	setFixedPalette: (colors: RGB[]) => void;
};

const byId = <T extends HTMLElement>(id: string): T => {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Element #${id} not found.`);
	return el as T;
};

type Modal = { open: () => void; close: () => void; el: HTMLElement };

const setupModal = (modalId: string, onClose?: () => void): Modal => {
	const modal = byId<HTMLElement>(modalId);
	const onKey = (e: KeyboardEvent) => {
		if (e.key === "Escape") close();
	};
	const close = () => {
		modal.style.display = "none";
		document.removeEventListener("keydown", onKey);
		onClose?.();
	};
	const open = () => {
		modal.style.display = "flex";
		document.addEventListener("keydown", onKey);
	};
	modal.addEventListener("click", (e) => {
		if (e.target === modal) close();
	});
	modal.querySelectorAll<HTMLElement>(".js-xt-close").forEach((btn) => {
		btn.addEventListener("click", close);
	});
	return { open, close, el: modal };
};

const rawToImageData = (raw: RawImage): ImageData =>
	new ImageData(new Uint8ClampedArray(raw.data), raw.width, raw.height);

const cloneRaw = (raw: RawImage): RawImage => ({
	width: raw.width,
	height: raw.height,
	data: new Uint8ClampedArray(raw.data),
});

const rawToBlob = (raw: RawImage): Promise<Blob | null> => {
	const canvas = document.createElement("canvas");
	drawRawImageToCanvas(raw, canvas);
	return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
};

const downloadBlob = (blob: Blob, filename: string): void => {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const downloadBytes = (bytes: Uint8Array, mime: string, name: string): void => {
	const copy = new Uint8Array(bytes.length);
	copy.set(bytes);
	downloadBlob(new Blob([copy.buffer], { type: mime }), name);
};

const rgbToHex = (c: RGB): string =>
	`#${[c.r, c.g, c.b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;

/** Draw a raw image into a canvas, integer-scaled to fit maxSize. */
const drawScaled = (
	raw: RawImage,
	canvas: HTMLCanvasElement,
	maxSize: number,
): number => {
	const scale = Math.max(
		1,
		Math.min(24, Math.floor(maxSize / Math.max(raw.width, raw.height))),
	);
	canvas.width = raw.width * scale;
	canvas.height = raw.height * scale;
	const ctx = canvas.getContext("2d");
	if (!ctx) return scale;
	ctx.imageSmoothingEnabled = false;
	const tmp = document.createElement("canvas");
	drawRawImageToCanvas(raw, tmp);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
	return scale;
};

// ---------------------------------------------------------------------------
// Shareable settings links
// ---------------------------------------------------------------------------

const encodeState = (
	state: Record<string, string | number | boolean>,
): string => {
	const json = JSON.stringify(state);
	return btoa(String.fromCharCode(...new TextEncoder().encode(json)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
};

const decodeState = (
	b64: string,
): Record<string, string | number | boolean> | null => {
	try {
		const std = b64.replace(/-/g, "+").replace(/_/g, "/");
		const pad = std + "=".repeat((4 - (std.length % 4)) % 4);
		const bin = atob(pad);
		const bytes = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
		const json = new TextDecoder().decode(bytes);
		const parsed: unknown = JSON.parse(json);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			return parsed as Record<string, string | number | boolean>;
		}
		return null;
	} catch {
		return null;
	}
};

const initShareLink = (deps: ExtrasDeps): void => {
	byId<HTMLButtonElement>("copy-settings-link").addEventListener(
		"click",
		async () => {
			const url = `${location.origin}${location.pathname}#s=${encodeState(
				deps.getUiState(),
			)}`;
			try {
				await navigator.clipboard.writeText(url);
				deps.showInfo(i18n.t("xt.share.copied"));
			} catch {
				window.prompt(i18n.t("xt.share.copy"), url);
			}
		},
	);

	// Apply settings arriving via a shared link.
	if (location.hash.startsWith("#s=")) {
		const state = decodeState(location.hash.slice(3));
		history.replaceState(null, "", location.pathname + location.search);
		if (state) {
			deps.applyUiState(state);
			deps.showInfo(i18n.t("xt.share.loaded"));
		}
	}
};

// ---------------------------------------------------------------------------
// Animation Studio
// ---------------------------------------------------------------------------

const initAnimationStudio = (deps: ExtrasDeps): void => {
	const fileInput = byId<HTMLInputElement>("anim-file-input");
	const importBtn = byId<HTMLButtonElement>("anim-import-btn");
	const infoEl = byId<HTMLElement>("anim-info");
	const strip = byId<HTMLElement>("anim-frame-strip");
	const refineBtn = byId<HTMLButtonElement>("anim-refine-btn");
	const dedupeCheck = byId<HTMLInputElement>("anim-dedupe");
	const preview = byId<HTMLCanvasElement>("anim-preview");
	const playBtn = byId<HTMLButtonElement>("anim-play-btn");
	const onionCheck = byId<HTMLInputElement>("anim-onion");
	const progressEl = byId<HTMLElement>("anim-progress");
	const exportGifBtn = byId<HTMLButtonElement>("anim-export-gif");
	const exportApngBtn = byId<HTMLButtonElement>("anim-export-apng");
	const exportZipBtn = byId<HTMLButtonElement>("anim-export-zip");
	const exportSheetBtn = byId<HTMLButtonElement>("anim-export-sheet");
	const sheetFormat = byId<HTMLSelectElement>("anim-sheet-format");

	let source: AnimFrame[] = [];
	let refined: AnimFrame[] = [];
	let frameIndex = 0;
	let playing = false;
	let playTimer: number | undefined;

	const activeFrames = (): AnimFrame[] =>
		refined.length > 0 ? refined : source;

	const stopPlayback = () => {
		playing = false;
		if (playTimer !== undefined) window.clearTimeout(playTimer);
		playTimer = undefined;
		playBtn.textContent = i18n.t("xt.anim.play");
	};

	const modal = setupModal("anim-modal", stopPlayback);
	byId<HTMLButtonElement>("open-anim-tool").addEventListener("click", () =>
		modal.open(),
	);

	const drawFrame = () => {
		const frames = activeFrames();
		if (frames.length === 0) return;
		frameIndex = ((frameIndex % frames.length) + frames.length) % frames.length;
		const cur = frames[frameIndex];
		drawScaled(cur.image, preview, 320);
		if (onionCheck.checked && frames.length > 1) {
			const prev = frames[(frameIndex + frames.length - 1) % frames.length];
			const ctx = preview.getContext("2d");
			if (ctx) {
				const tmp = document.createElement("canvas");
				drawRawImageToCanvas(prev.image, tmp);
				ctx.globalAlpha = 0.3;
				ctx.imageSmoothingEnabled = false;
				ctx.drawImage(tmp, 0, 0, preview.width, preview.height);
				ctx.globalAlpha = 1;
			}
		}
	};

	const tick = () => {
		if (!playing) return;
		const frames = activeFrames();
		if (frames.length === 0) {
			stopPlayback();
			return;
		}
		drawFrame();
		const dur = frames[frameIndex].durationMs;
		frameIndex = (frameIndex + 1) % frames.length;
		playTimer = window.setTimeout(tick, Math.max(20, dur));
	};

	playBtn.addEventListener("click", () => {
		if (playing) {
			stopPlayback();
			drawFrame();
			return;
		}
		if (activeFrames().length === 0) {
			deps.showInfo(i18n.t("xt.anim.no_anim"));
			return;
		}
		playing = true;
		playBtn.textContent = i18n.t("xt.anim.pause");
		tick();
	});

	onionCheck.addEventListener("change", drawFrame);

	const renderStrip = () => {
		strip.innerHTML = "";
		const frames = activeFrames();
		frames.forEach((f, i) => {
			const c = document.createElement("canvas");
			c.className = "xt-thumb";
			drawScaled(f.image, c, 48);
			c.title = `#${i} (${f.durationMs}ms)`;
			c.addEventListener("click", () => {
				stopPlayback();
				frameIndex = i;
				drawFrame();
			});
			strip.appendChild(c);
		});
	};

	importBtn.addEventListener("click", () => fileInput.click());
	fileInput.addEventListener("change", async () => {
		const file = fileInput.files?.[0];
		fileInput.value = "";
		if (!file) return;
		try {
			const buf = await file.arrayBuffer();
			const decoded = decodeAnimation(buf);
			source = decoded.frames;
			refined = [];
			frameIndex = 0;
			stopPlayback();
			infoEl.textContent = i18n.t("xt.anim.frames_info", {
				count: decoded.frames.length,
				w: decoded.width,
				h: decoded.height,
			});
			renderStrip();
			drawFrame();
		} catch (e) {
			console.error(e);
			deps.showError(i18n.t("xt.anim.decode_failed"));
		}
	});

	refineBtn.addEventListener("click", async () => {
		if (source.length === 0) {
			deps.showInfo(i18n.t("xt.anim.no_anim"));
			return;
		}
		stopPlayback();
		refineBtn.disabled = true;
		try {
			const out: AnimFrame[] = [];
			for (let i = 0; i < source.length; i += 1) {
				progressEl.textContent = i18n.t("xt.anim.refining", {
					current: i + 1,
					total: source.length,
				});
				const result = await deps.processRaw(source[i].image);
				out.push({ image: result, durationMs: source[i].durationMs });
			}
			const padded = padFramesToUnion(out.map((f) => f.image));
			refined = out.map((f, i) => ({
				image: padded[i],
				durationMs: f.durationMs,
			}));
			frameIndex = 0;
			progressEl.textContent = "";
			infoEl.textContent = i18n.t("xt.anim.refined_info", {
				count: refined.length,
				w: refined[0].image.width,
				h: refined[0].image.height,
			});
			renderStrip();
			drawFrame();
		} catch (e) {
			progressEl.textContent = "";
			deps.showError(`${i18n.t("error.load_failed")}: ${(e as Error).message}`);
		} finally {
			refineBtn.disabled = false;
		}
	});

	/** Frames for export, with optional duplicate merging. */
	const exportFrames = (): {
		playback: AnimFrame[];
		unique: AnimFrame[];
	} | null => {
		const frames = activeFrames();
		if (frames.length === 0) {
			deps.showInfo(i18n.t("xt.anim.no_anim"));
			return null;
		}
		if (!dedupeCheck.checked) {
			return { playback: frames, unique: frames };
		}
		const { unique, sequence, duplicatesRemoved } = dedupeFrames(frames);
		const timeline = buildTimeline(sequence, frames);
		if (duplicatesRemoved > 0) {
			deps.showInfo(
				i18n.t("xt.anim.dedupe_info", { removed: duplicatesRemoved }),
			);
		}
		return {
			playback: timeline.map((t) => ({
				image: unique[t.frameIndex].image,
				durationMs: t.durationMs,
			})),
			unique: unique.map((u) => ({
				image: u.image,
				durationMs: u.durationMs,
			})),
		};
	};

	const baseName = () => `${deps.getActiveName()}_anim`;

	exportGifBtn.addEventListener("click", () => {
		const f = exportFrames();
		if (!f) return;
		try {
			downloadBytes(encodeGIF(f.playback), "image/gif", `${baseName()}.gif`);
		} catch (e) {
			deps.showError((e as Error).message);
		}
	});

	exportApngBtn.addEventListener("click", () => {
		const f = exportFrames();
		if (!f) return;
		try {
			downloadBytes(encodeAPNG(f.playback), "image/png", `${baseName()}.png`);
		} catch (e) {
			deps.showError((e as Error).message);
		}
	});

	exportZipBtn.addEventListener("click", async () => {
		const f = exportFrames();
		if (!f) return;
		const zip = new JSZip();
		for (let i = 0; i < f.unique.length; i += 1) {
			const blob = await rawToBlob(f.unique[i].image);
			if (blob) zip.file(`frame_${String(i).padStart(3, "0")}.png`, blob);
		}
		const content = await zip.generateAsync({ type: "blob" });
		downloadBlob(content, `${baseName()}_frames.zip`);
	});

	exportSheetBtn.addEventListener("click", async () => {
		const f = exportFrames();
		if (!f) return;
		const named = f.unique.map((fr, i) => ({
			name: `frame_${String(i).padStart(3, "0")}`,
			image: fr.image,
		}));
		const atlas = packAtlas(named, {});
		const zip = new JSZip();
		const blob = await rawToBlob(atlas.atlas);
		if (!blob) {
			deps.showError(i18n.t("tool.msg.atlas_export_failed"));
			return;
		}
		zip.file("sheet.png", blob);
		const avgDelay = Math.round(
			f.unique.reduce((s, fr) => s + fr.durationMs, 0) / f.unique.length,
		);
		switch (sheetFormat.value) {
			case "aseprite":
				zip.file(
					"sheet.json",
					atlasToAsepriteJSON(atlas, "sheet.png", avgDelay),
				);
				break;
			case "godot":
				zip.file(
					"sheet.tres",
					atlasToGodotSpriteFrames(atlas, "res://sheet.png", 1000 / avgDelay),
				);
				break;
			case "csv":
				zip.file("sheet.csv", atlasToCSV(atlas));
				break;
			default:
				zip.file("sheet.json", atlasToJSON(atlas, "sheet.png"));
		}
		const content = await zip.generateAsync({ type: "blob" });
		downloadBlob(content, `${baseName()}_sheet.zip`);
	});
};

// ---------------------------------------------------------------------------
// Touch-up editor
// ---------------------------------------------------------------------------

type TouchupTool = "pencil" | "eraser" | "fill" | "picker" | "restore";

const initTouchup = (deps: ExtrasDeps): void => {
	const canvas = byId<HTMLCanvasElement>("tu-canvas");
	const swatchesEl = byId<HTMLElement>("tu-swatches");
	const colorInput = byId<HTMLInputElement>("tu-color");
	const infoEl = byId<HTMLElement>("tu-info");
	const applyBtn = byId<HTMLButtonElement>("tu-apply");
	const undoBtn = byId<HTMLButtonElement>("tu-undo");
	const redoBtn = byId<HTMLButtonElement>("tu-redo");
	const toolButtons: Record<TouchupTool, HTMLButtonElement> = {
		pencil: byId<HTMLButtonElement>("tu-pencil"),
		eraser: byId<HTMLButtonElement>("tu-eraser"),
		fill: byId<HTMLButtonElement>("tu-fill"),
		picker: byId<HTMLButtonElement>("tu-picker"),
		restore: byId<HTMLButtonElement>("tu-restore"),
	};

	let img: RawImage | null = null;
	let restoreSource: RawImage | null = null;
	let tool: TouchupTool = "pencil";
	let color: RGB = { r: 0, g: 0, b: 0 };
	let drawing = false;
	const undoStack: Uint8ClampedArray[] = [];
	const redoStack: Uint8ClampedArray[] = [];

	const modal = setupModal("touchup-modal");

	const setTool = (t: TouchupTool) => {
		tool = t;
		(Object.keys(toolButtons) as TouchupTool[]).forEach((k) => {
			toolButtons[k].classList.toggle("active", k === t);
		});
	};
	(Object.keys(toolButtons) as TouchupTool[]).forEach((k) => {
		toolButtons[k].addEventListener("click", () => setTool(k));
	});

	const redraw = () => {
		if (!img) return;
		drawScaled(img, canvas, 480);
	};

	const updateUndoButtons = () => {
		undoBtn.disabled = undoStack.length === 0;
		redoBtn.disabled = redoStack.length === 0;
	};

	const pushUndo = () => {
		if (!img) return;
		undoStack.push(new Uint8ClampedArray(img.data));
		if (undoStack.length > 40) undoStack.shift();
		redoStack.length = 0;
		updateUndoButtons();
	};

	undoBtn.addEventListener("click", () => {
		if (!img || undoStack.length === 0) return;
		redoStack.push(new Uint8ClampedArray(img.data));
		const prev = undoStack.pop();
		if (prev) img.data.set(prev);
		updateUndoButtons();
		redraw();
	});

	redoBtn.addEventListener("click", () => {
		if (!img || redoStack.length === 0) return;
		undoStack.push(new Uint8ClampedArray(img.data));
		const next = redoStack.pop();
		if (next) img.data.set(next);
		updateUndoButtons();
		redraw();
	});

	const renderSwatches = () => {
		if (!img) return;
		swatchesEl.innerHTML = "";
		const { colors } = extractColorsFromImage(rawToImageData(img), 64);
		colors.forEach((c) => {
			const b = document.createElement("button");
			b.type = "button";
			b.className = "xt-swatch";
			b.style.backgroundColor = rgbToHex(c);
			b.title = rgbToHex(c);
			b.addEventListener("click", () => {
				color = c;
				colorInput.value = rgbToHex(c);
			});
			swatchesEl.appendChild(b);
		});
	};

	colorInput.addEventListener("input", () => {
		const h = colorInput.value.replace("#", "");
		color = {
			r: parseInt(h.slice(0, 2), 16),
			g: parseInt(h.slice(2, 4), 16),
			b: parseInt(h.slice(4, 6), 16),
		};
	});

	const pxFromEvent = (e: PointerEvent): { x: number; y: number } | null => {
		if (!img) return null;
		const rect = canvas.getBoundingClientRect();
		const x = Math.floor(((e.clientX - rect.left) / rect.width) * img.width);
		const y = Math.floor(((e.clientY - rect.top) / rect.height) * img.height);
		if (x < 0 || y < 0 || x >= img.width || y >= img.height) return null;
		return { x, y };
	};

	const applyAt = (x: number, y: number) => {
		if (!img) return;
		const i = (y * img.width + x) * 4;
		if (tool === "pencil") {
			img.data[i] = color.r;
			img.data[i + 1] = color.g;
			img.data[i + 2] = color.b;
			img.data[i + 3] = 255;
		} else if (tool === "eraser") {
			img.data[i + 3] = 0;
		} else if (tool === "restore") {
			if (
				restoreSource &&
				restoreSource.width === img.width &&
				restoreSource.height === img.height
			) {
				img.data[i] = restoreSource.data[i];
				img.data[i + 1] = restoreSource.data[i + 1];
				img.data[i + 2] = restoreSource.data[i + 2];
				img.data[i + 3] = restoreSource.data[i + 3];
			}
		} else if (tool === "picker") {
			color = { r: img.data[i], g: img.data[i + 1], b: img.data[i + 2] };
			colorInput.value = rgbToHex(color);
			setTool("pencil");
		} else if (tool === "fill") {
			floodFill(x, y);
		}
	};

	const floodFill = (sx: number, sy: number) => {
		if (!img) return;
		const i0 = (sy * img.width + sx) * 4;
		const target = [
			img.data[i0],
			img.data[i0 + 1],
			img.data[i0 + 2],
			img.data[i0 + 3],
		];
		const replacement = [color.r, color.g, color.b, 255];
		if (target.join() === replacement.join()) return;
		const stack = [sy * img.width + sx];
		const seen = new Uint8Array(img.width * img.height);
		while (stack.length > 0) {
			const p = stack.pop() as number;
			if (seen[p]) continue;
			seen[p] = 1;
			const i = p * 4;
			if (
				img.data[i] !== target[0] ||
				img.data[i + 1] !== target[1] ||
				img.data[i + 2] !== target[2] ||
				img.data[i + 3] !== target[3]
			) {
				continue;
			}
			img.data.set(replacement, i);
			const x = p % img.width;
			const y = Math.floor(p / img.width);
			if (x > 0) stack.push(p - 1);
			if (x + 1 < img.width) stack.push(p + 1);
			if (y > 0) stack.push(p - img.width);
			if (y + 1 < img.height) stack.push(p + img.width);
		}
	};

	canvas.addEventListener("pointerdown", (e) => {
		if (!img) return;
		const px = pxFromEvent(e);
		if (!px) return;
		drawing = true;
		canvas.setPointerCapture(e.pointerId);
		pushUndo();
		applyAt(px.x, px.y);
		redraw();
	});
	canvas.addEventListener("pointermove", (e) => {
		if (!drawing || !img) return;
		if (tool === "fill" || tool === "picker") return;
		const px = pxFromEvent(e);
		if (!px) return;
		applyAt(px.x, px.y);
		redraw();
	});
	const stopDraw = () => {
		drawing = false;
	};
	canvas.addEventListener("pointerup", stopDraw);
	canvas.addEventListener("pointercancel", stopDraw);

	applyBtn.addEventListener("click", () => {
		if (!img) return;
		deps.setActiveResult(cloneRaw(img));
		deps.showInfo(i18n.t("xt.touchup.applied"));
		modal.close();
	});

	byId<HTMLButtonElement>("open-touchup-tool").addEventListener("click", () => {
		const active = deps.getActiveResult();
		if (!active) {
			deps.showInfo(i18n.t("xt.touchup.no_image"));
			return;
		}
		img = cloneRaw(active);
		restoreSource = deps.getRestoreSource();
		const restoreOk =
			!!restoreSource &&
			restoreSource.width === img.width &&
			restoreSource.height === img.height;
		toolButtons.restore.disabled = !restoreOk;
		toolButtons.restore.title = restoreOk
			? ""
			: i18n.t("xt.touchup.restore_na");
		undoStack.length = 0;
		redoStack.length = 0;
		updateUndoButtons();
		setTool("pencil");
		infoEl.textContent = `${img.width} x ${img.height} px`;
		renderSwatches();
		redraw();
		modal.open();
	});
};

// ---------------------------------------------------------------------------
// Seamless tile check
// ---------------------------------------------------------------------------

const initSeamless = (deps: ExtrasDeps): void => {
	const canvas = byId<HTMLCanvasElement>("seam-canvas");
	const tolInput = byId<HTMLInputElement>("seam-tolerance");
	const infoEl = byId<HTMLElement>("seam-info");
	const modal = setupModal("seamless-modal");

	const render = () => {
		const img = deps.getActiveResult();
		if (!img) return;
		const tol = Math.max(0, Math.min(64, Number(tolInput.value) || 0));
		const tiled = tileImage(img, 3, 3);
		const scale = drawScaled(tiled, canvas, 480);
		const report = analyzeSeams(img, tol);
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.fillStyle = "rgba(255, 64, 64, 0.9)";
			// vertical wrap boundaries: x = w and 2w
			for (const y of report.horizontalMismatches) {
				for (let ty = 0; ty < 3; ty += 1) {
					const py = (ty * img.height + y) * scale;
					for (const bx of [img.width, img.width * 2]) {
						ctx.fillRect(bx * scale - 2, py, 4, scale);
					}
				}
			}
			for (const x of report.verticalMismatches) {
				for (let tx = 0; tx < 3; tx += 1) {
					const px = (tx * img.width + x) * scale;
					for (const by of [img.height, img.height * 2]) {
						ctx.fillRect(px, by * scale - 2, scale, 4);
					}
				}
			}
		}
		infoEl.textContent =
			report.horizontalSeamless && report.verticalSeamless
				? i18n.t("xt.seamless.ok")
				: i18n.t("xt.seamless.info", {
						h: report.horizontalMismatches.length,
						v: report.verticalMismatches.length,
					});
	};

	tolInput.addEventListener("change", render);
	byId<HTMLButtonElement>("open-seamless-tool").addEventListener(
		"click",
		() => {
			if (!deps.getActiveResult()) {
				deps.showInfo(i18n.t("xt.touchup.no_image"));
				return;
			}
			render();
			modal.open();
		},
	);
};

// ---------------------------------------------------------------------------
// Tile color heatmap
// ---------------------------------------------------------------------------

const initHeatmap = (deps: ExtrasDeps): void => {
	const canvas = byId<HTMLCanvasElement>("hm-canvas");
	const sizeSel = byId<HTMLSelectElement>("hm-tile-size");
	const maxInput = byId<HTMLInputElement>("hm-max-colors");
	const infoEl = byId<HTMLElement>("hm-info");
	const modal = setupModal("heatmap-modal");

	const render = () => {
		const img = deps.getActiveResult();
		if (!img) return;
		const tile = Math.max(1, Number(sizeSel.value) || 8);
		const maxColors = Math.max(1, Math.min(64, Number(maxInput.value) || 4));
		const scale = drawScaled(img, canvas, 480);
		const analysis = analyzeTileColors(img, {
			tileW: tile,
			tileH: tile,
			maxColors,
		});
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.fillStyle = "rgba(255, 48, 48, 0.4)";
			ctx.strokeStyle = "rgba(255, 48, 48, 0.9)";
			for (const t of analysis.violations) {
				const tx = t % analysis.tilesX;
				const ty = Math.floor(t / analysis.tilesX);
				const x = tx * tile * scale;
				const y = ty * tile * scale;
				const w = Math.min(tile * scale, canvas.width - x);
				const h = Math.min(tile * scale, canvas.height - y);
				ctx.fillRect(x, y, w, h);
				ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
			}
		}
		infoEl.textContent =
			analysis.violations.length === 0
				? i18n.t("xt.heatmap.none")
				: i18n.t("xt.heatmap.info", {
						violations: analysis.violations.length,
						tiles: analysis.counts.length,
						max: maxColors,
					});
	};

	sizeSel.addEventListener("change", render);
	maxInput.addEventListener("change", render);
	byId<HTMLButtonElement>("open-heatmap-tool").addEventListener("click", () => {
		if (!deps.getActiveResult()) {
			deps.showInfo(i18n.t("xt.touchup.no_image"));
			return;
		}
		render();
		modal.open();
	});
};

// ---------------------------------------------------------------------------
// Palette library + ramps (inside the Palette / Recolor tool modal)
// ---------------------------------------------------------------------------

const initPaletteLab = (deps: ExtrasDeps): void => {
	const librarySel = byId<HTMLSelectElement>("plib-select");
	const previewEl = byId<HTMLElement>("plib-preview");
	const applyBtn = byId<HTMLButtonElement>("plib-apply");
	const fixedBtn = byId<HTMLButtonElement>("plib-set-fixed");
	const rampsBtn = byId<HTMLButtonElement>("ramps-organize");
	const mergeBtn = byId<HTMLButtonElement>("ramps-merge");
	const thresholdInput = byId<HTMLInputElement>("ramps-threshold");
	const rampsView = byId<HTMLElement>("ramps-view");

	// Populate the library select.
	for (const p of BUILTIN_PALETTES) {
		const opt = document.createElement("option");
		opt.value = p.id;
		opt.textContent = `${p.name} (${p.colors.length})`;
		librarySel.appendChild(opt);
	}

	const renderPreview = () => {
		previewEl.innerHTML = "";
		const colors = getBuiltinPalette(librarySel.value);
		if (!colors) return;
		for (const c of colors) {
			const s = document.createElement("span");
			s.className = "xt-swatch xt-swatch-static";
			s.style.backgroundColor = rgbToHex(c);
			s.title = rgbToHex(c);
			previewEl.appendChild(s);
		}
	};
	librarySel.addEventListener("change", renderPreview);
	renderPreview();

	const paletteName = (): string =>
		BUILTIN_PALETTES.find((p) => p.id === librarySel.value)?.name ??
		librarySel.value;

	applyBtn.addEventListener("click", async () => {
		const img = deps.getActiveResult();
		const colors = getBuiltinPalette(librarySel.value);
		if (!img || !colors) {
			deps.showInfo(i18n.t("xt.pal.no_image"));
			return;
		}
		const mapped = mapImageToPalette(img, colors);
		await deps.addRawAsImage(
			`${deps.getActiveName()}_${librarySel.value}`,
			mapped,
		);
		deps.showInfo(i18n.t("xt.pal.applied", { name: paletteName() }));
	});

	fixedBtn.addEventListener("click", () => {
		const colors = getBuiltinPalette(librarySel.value);
		if (!colors) return;
		deps.setFixedPalette(colors);
		deps.showInfo(
			i18n.t("xt.pal.fixed_set", {
				name: paletteName(),
				count: colors.length,
			}),
		);
	});

	const currentImagePalette = (): RGB[] | null => {
		const img = deps.getActiveResult();
		if (!img) return null;
		return extractColorsFromImage(rawToImageData(img), 256).colors;
	};

	rampsBtn.addEventListener("click", () => {
		const palette = currentImagePalette();
		if (!palette) {
			deps.showInfo(i18n.t("xt.pal.no_image"));
			return;
		}
		const ramps = organizeIntoRamps(palette);
		rampsView.innerHTML = "";
		for (const ramp of ramps) {
			const row = document.createElement("div");
			row.className = "xt-ramp-row";
			const label = document.createElement("span");
			label.className = "xt-ramp-label";
			label.textContent =
				ramp.hue === null
					? i18n.t("xt.pal.ramp_neutral")
					: `${Math.round(ramp.hue)} deg`;
			row.appendChild(label);
			for (const c of ramp.colors) {
				const s = document.createElement("span");
				s.className = "xt-swatch xt-swatch-static";
				s.style.backgroundColor = rgbToHex(c);
				s.title = rgbToHex(c);
				row.appendChild(s);
			}
			rampsView.appendChild(row);
		}
	});

	mergeBtn.addEventListener("click", async () => {
		const img = deps.getActiveResult();
		const palette = currentImagePalette();
		if (!img || !palette) {
			deps.showInfo(i18n.t("xt.pal.no_image"));
			return;
		}
		const threshold = Math.max(
			1,
			Math.min(96, Number(thresholdInput.value) || 24),
		);
		const merges = suggestMerges(palette, threshold);
		if (merges.length === 0) {
			deps.showInfo(i18n.t("xt.pal.no_merges"));
			return;
		}
		const dropped = new Set(merges.map((m) => rgbToHex(m.b)));
		const survivors = palette.filter((c) => !dropped.has(rgbToHex(c)));
		const mapped = mapImageToPalette(img, survivors);
		await deps.addRawAsImage(`${deps.getActiveName()}_merged`, mapped);
		deps.showInfo(i18n.t("xt.pal.merges_applied", { count: merges.length }));
	});
};

// ---------------------------------------------------------------------------

export const initExtras = (deps: ExtrasDeps): void => {
	initShareLink(deps);
	initAnimationStudio(deps);
	initTouchup(deps);
	initSeamless(deps);
	initHeatmap(deps);
	initPaletteLab(deps);
};
