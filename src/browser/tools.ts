import JSZip from "jszip";
import {
	atlasToAsepriteJSON,
	atlasToCSV,
	atlasToGodotSpriteFrames,
} from "../core/exporters";
import { type PhotoToPixelOptions, photoToPixelArt } from "../core/pixelate";
import { mapImageToPalette, recolorImageNearest } from "../core/recolor";
import {
	atlasToJSON,
	packAtlas,
	type SliceSpec,
	sliceCutLines,
	sliceSheet,
} from "../core/spritesheet";
import { PROCESS_RANGES } from "../shared/config";
import type { DitherMode, RawImage, RGB } from "../shared/types";
import {
	extractColorsFromImage,
	generateGPL,
	generateHEX,
	generateJASCPAL,
	generatePaletteImage,
	parseAnyPalette,
	sortPalette,
} from "../utils/palette";
import { i18n } from "./i18n";
import { drawRawImageToCanvas } from "./io";

export type ToolsDeps = {
	getActiveOriginal: () => RawImage | null;
	getActiveResult: () => RawImage | null;
	getActiveName: () => string;
	getAllImages: () => Array<{ name: string; image: RawImage }>;
	addRawAsImage: (name: string, raw: RawImage) => Promise<void> | void;
	showInfo: (msg: string) => void;
	showError: (msg: string) => void;
};

// ---------------------------------------------------------------------------
// Small DOM / image helpers
// ---------------------------------------------------------------------------
const byId = <T extends HTMLElement>(id: string): T => {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Element #${id} not found.`);
	return el as T;
};

const rgbToHex = (c: RGB): string =>
	`#${[c.r, c.g, c.b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;

const hexToRgb = (hex: string): RGB => {
	const h = hex.replace(/^#/, "");
	return {
		r: parseInt(h.slice(0, 2), 16),
		g: parseInt(h.slice(2, 4), 16),
		b: parseInt(h.slice(4, 6), 16),
	};
};

const rawToImageData = (raw: RawImage): ImageData =>
	new ImageData(new Uint8ClampedArray(raw.data), raw.width, raw.height);

const extractPalette = (raw: RawImage, max = 256): RGB[] => {
	const { colors } = extractColorsFromImage(rawToImageData(raw), max);
	return sortPalette(colors);
};

const rawToBlob = (raw: RawImage): Promise<Blob | null> => {
	const canvas = document.createElement("canvas");
	drawRawImageToCanvas(raw, canvas);
	return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
};

const downloadBlob = (blob: Blob, filename: string): void => {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const downloadText = (
	text: string,
	filename: string,
	mime = "text/plain",
): void => {
	downloadBlob(new Blob([text], { type: mime }), filename);
};

/** Draw a raw image into a canvas and scale it up crisply for previewing. */
const showPreview = (canvas: HTMLCanvasElement, raw: RawImage): void => {
	drawRawImageToCanvas(raw, canvas);
	const longest = Math.max(raw.width, raw.height);
	const zoom = Math.max(1, Math.floor(320 / Math.max(1, longest)));
	canvas.style.width = `${raw.width * zoom}px`;
	canvas.style.height = `${raw.height * zoom}px`;
	canvas.style.imageRendering = "pixelated";
};

type Modal = { open: () => void; close: () => void };

const setupModal = (modalId: string): Modal => {
	const modal = byId<HTMLElement>(modalId);
	// Escape-to-close is bound on `document` (not the modal element) while the
	// modal is open: the modal <div> is not focusable, so a keydown listener on
	// it never receives Escape until the user focuses a control inside it.
	const onKeydown = (e: KeyboardEvent) => {
		if (e.key === "Escape") close();
	};
	const close = () => {
		modal.style.display = "none";
		document.removeEventListener("keydown", onKeydown);
	};
	const open = () => {
		modal.style.display = "flex";
		document.addEventListener("keydown", onKeydown);
	};
	modal.addEventListener("click", (e) => {
		if (e.target === modal) close();
	});
	modal.querySelectorAll<HTMLElement>(".js-tool-close").forEach((btn) => {
		btn.addEventListener("click", close);
	});
	return { open, close };
};

// ---------------------------------------------------------------------------
// Photo -> Pixel Art
// ---------------------------------------------------------------------------
const initPhotoTool = (deps: ToolsDeps): void => {
	const modal = setupModal("photo-modal");
	const maxSide = byId<HTMLInputElement>("photo-maxside");
	const paletteMode = byId<HTMLSelectElement>("photo-palette-mode");
	const colors = byId<HTMLInputElement>("photo-colors");
	const colorsRow = byId<HTMLElement>("photo-colors-row");
	const dither = byId<HTMLSelectElement>("photo-dither");
	const ditherRow = byId<HTMLElement>("photo-dither-row");
	const preview = byId<HTMLCanvasElement>("photo-preview");
	const info = byId<HTMLElement>("photo-info");
	const addBtn = byId<HTMLButtonElement>("photo-add");
	const dlBtn = byId<HTMLButtonElement>("photo-download");

	let last: RawImage | null = null;

	const syncRows = () => {
		const isAuto = paletteMode.value === "auto";
		colorsRow.style.display = isAuto ? "flex" : "none";
		// Dithering only runs when colors are reduced; hide the control in
		// "Keep original colors" mode so it does not look live while inert.
		ditherRow.style.display = isAuto ? "flex" : "none";
	};

	const render = () => {
		const src = deps.getActiveOriginal();
		if (!src) {
			deps.showError(i18n.t("tool.msg.load_first"));
			return;
		}
		const opts: PhotoToPixelOptions = {
			// Clamp to the HTML min/max: typed values above the max (e.g. 9999
			// colors) would otherwise run K-means synchronously on huge inputs
			// and freeze the tab.
			maxSide: Math.min(512, Math.max(4, Number(maxSide.value) || 64)),
			paletteMode: paletteMode.value === "none" ? "none" : "auto",
			colorCount: Math.min(
				PROCESS_RANGES.colorCount.max,
				Math.max(PROCESS_RANGES.colorCount.min, Number(colors.value) || 16),
			),
			ditherMode: dither.value as DitherMode,
			ditherStrength: 100,
		};
		last = photoToPixelArt(src, opts);
		showPreview(preview, last);
		info.textContent = `${last.width} x ${last.height} px`;
		addBtn.disabled = false;
		dlBtn.disabled = false;
	};

	byId<HTMLButtonElement>("open-photo-tool").addEventListener("click", () => {
		if (!deps.getActiveOriginal()) {
			deps.showError(i18n.t("tool.msg.load_first"));
			return;
		}
		modal.open();
		syncRows();
		render();
	});

	for (const el of [maxSide, colors]) {
		el.addEventListener("input", () => render());
	}
	for (const el of [paletteMode, dither]) {
		el.addEventListener("change", () => {
			syncRows();
			render();
		});
	}

	addBtn.addEventListener("click", async () => {
		if (!last) return;
		await deps.addRawAsImage(`${deps.getActiveName()}_pixel`, last);
		deps.showInfo(i18n.t("tool.msg.added_pixel"));
		modal.close();
	});

	dlBtn.addEventListener("click", async () => {
		if (!last) return;
		const blob = await rawToBlob(last);
		if (blob) {
			downloadBlob(blob, `${deps.getActiveName()}_pixel.png`);
		} else {
			deps.showError(i18n.t("tool.msg.export_failed"));
		}
	});
};

// ---------------------------------------------------------------------------
// Sprite sheet slicer + packer
// ---------------------------------------------------------------------------
const initSheetTool = (deps: ToolsDeps): void => {
	const modal = setupModal("sheet-modal");
	const mode = byId<HTMLSelectElement>("sheet-mode");
	const slicePanel = byId<HTMLElement>("sheet-slice-panel");
	const packPanel = byId<HTMLElement>("sheet-pack-panel");
	const source = byId<HTMLSelectElement>("sheet-source");
	const sliceBy = byId<HTMLSelectElement>("sheet-slice-by");
	const gridRow = byId<HTMLElement>("sheet-grid-row");
	const cellRow = byId<HTMLElement>("sheet-cell-row");
	const cols = byId<HTMLInputElement>("sheet-cols");
	const rows = byId<HTMLInputElement>("sheet-rows");
	const cellW = byId<HTMLInputElement>("sheet-cellw");
	const cellH = byId<HTMLInputElement>("sheet-cellh");
	const packCols = byId<HTMLInputElement>("sheet-pack-cols");
	const packPad = byId<HTMLInputElement>("sheet-pack-padding");
	const preview = byId<HTMLCanvasElement>("sheet-preview");
	const info = byId<HTMLElement>("sheet-info");
	const addFramesBtn = byId<HTMLButtonElement>("sheet-add-frames");
	const dlFramesBtn = byId<HTMLButtonElement>("sheet-download-frames");
	const dlAtlasBtn = byId<HTMLButtonElement>("sheet-download-atlas");
	const addAtlasBtn = byId<HTMLButtonElement>("sheet-add-atlas");

	let frames: RawImage[] = [];

	const buildSpec = (): SliceSpec =>
		sliceBy.value === "cell"
			? {
					mode: "cell",
					cellW: Math.max(1, Number(cellW.value) || 16),
					cellH: Math.max(1, Number(cellH.value) || 16),
				}
			: {
					mode: "grid",
					cols: Math.max(1, Number(cols.value) || 1),
					rows: Math.max(1, Number(rows.value) || 1),
				};

	// Slicing a sheet that auto-processing has already collapsed to a tiny
	// result (grid detection sees each sprite cell as one pixel) produces
	// nonsense frames, so let the user pick which image to slice.
	const getSliceSource = (): RawImage | null =>
		source.value === "original"
			? deps.getActiveOriginal()
			: deps.getActiveResult();

	const renderSlice = () => {
		const src = getSliceSource();
		if (!src) return;
		const spec = buildSpec();
		frames = sliceSheet(src, spec);
		// Preview: the source drawn crisply and scaled up, with a red overlay
		// marking where the frames will be cut.
		const canvas = preview;
		const longest = Math.max(src.width, src.height);
		const zoom = Math.max(1, Math.floor(320 / Math.max(1, longest)));
		canvas.width = src.width * zoom;
		canvas.height = src.height * zoom;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			const tmp = document.createElement("canvas");
			drawRawImageToCanvas(src, tmp);
			ctx.imageSmoothingEnabled = false;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
			const { xs, ys } = sliceCutLines(src.width, src.height, spec);
			ctx.strokeStyle = "rgba(255, 64, 129, 0.9)";
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (const x of xs) {
				const px = Math.round(x * zoom) + 0.5;
				ctx.moveTo(px, 0);
				ctx.lineTo(px, canvas.height);
			}
			for (const y of ys) {
				const py = Math.round(y * zoom) + 0.5;
				ctx.moveTo(0, py);
				ctx.lineTo(canvas.width, py);
			}
			ctx.stroke();
		}
		canvas.style.width = `${src.width * zoom}px`;
		canvas.style.height = `${src.height * zoom}px`;
		canvas.style.imageRendering = "pixelated";
		if (frames.length === 0) {
			// Previously this showed a puzzling "0 frames (0 x 0 px each)".
			info.textContent = i18n.t("tool.info.no_frames", {
				w: src.width,
				h: src.height,
			});
		} else {
			info.textContent = i18n.t("tool.info.frames", {
				count: frames.length,
				w: frames[0].width,
				h: frames[0].height,
			});
		}
		const enabled = frames.length > 0;
		addFramesBtn.disabled = !enabled;
		dlFramesBtn.disabled = !enabled;
	};

	const renderPack = () => {
		const all = deps.getAllImages();
		if (all.length === 0) {
			info.textContent = i18n.t("tool.msg.no_images_to_pack");
			dlAtlasBtn.disabled = true;
			addAtlasBtn.disabled = true;
			return;
		}
		const res = packAtlas(all, {
			columns: Math.max(0, Number(packCols.value) || 0) || undefined,
			padding: Math.max(0, Number(packPad.value) || 0),
		});
		showPreview(preview, res.atlas);
		info.textContent = i18n.t("tool.info.atlas", {
			w: res.atlas.width,
			h: res.atlas.height,
			count: all.length,
		});
		dlAtlasBtn.disabled = false;
		addAtlasBtn.disabled = false;
	};

	const render = () => {
		const isPack = mode.value === "pack";
		slicePanel.style.display = isPack ? "none" : "block";
		packPanel.style.display = isPack ? "block" : "none";
		addFramesBtn.style.display = isPack ? "none" : "inline-flex";
		dlFramesBtn.style.display = isPack ? "none" : "inline-flex";
		dlAtlasBtn.style.display = isPack ? "inline-flex" : "none";
		addAtlasBtn.style.display = isPack ? "inline-flex" : "none";
		if (isPack) renderPack();
		else renderSlice();
	};

	const syncSliceBy = () => {
		const isCell = sliceBy.value === "cell";
		gridRow.style.display = isCell ? "none" : "flex";
		cellRow.style.display = isCell ? "flex" : "none";
	};

	byId<HTMLButtonElement>("open-sheet-tool").addEventListener("click", () => {
		if (!deps.getActiveResult()) {
			deps.showError(i18n.t("tool.msg.load_first"));
			return;
		}
		modal.open();
		syncSliceBy();
		render();
	});

	mode.addEventListener("change", render);
	source.addEventListener("change", render);
	sliceBy.addEventListener("change", () => {
		syncSliceBy();
		render();
	});
	for (const el of [cols, rows, cellW, cellH, packCols, packPad]) {
		el.addEventListener("input", render);
	}

	addFramesBtn.addEventListener("click", async () => {
		if (frames.length === 0) return;
		const base = deps.getActiveName();
		for (let i = 0; i < frames.length; i++) {
			await deps.addRawAsImage(
				`${base}_${String(i).padStart(2, "0")}`,
				frames[i],
			);
		}
		deps.showInfo(i18n.t("tool.msg.added_frames", { count: frames.length }));
		modal.close();
	});

	dlFramesBtn.addEventListener("click", async () => {
		if (frames.length === 0) return;
		const zip = new JSZip();
		const base = deps.getActiveName();
		for (let i = 0; i < frames.length; i++) {
			const blob = await rawToBlob(frames[i]);
			if (blob) zip.file(`${base}_${String(i).padStart(2, "0")}.png`, blob);
		}
		const content = await zip.generateAsync({ type: "blob" });
		downloadBlob(content, `${base}_frames.zip`);
	});

	const buildAtlas = () => {
		const all = deps.getAllImages();
		return packAtlas(all, {
			columns: Math.max(0, Number(packCols.value) || 0) || undefined,
			padding: Math.max(0, Number(packPad.value) || 0),
		});
	};

	dlAtlasBtn.addEventListener("click", async () => {
		const all = deps.getAllImages();
		if (all.length === 0) return;
		const res = buildAtlas();
		const zip = new JSZip();
		const blob = await rawToBlob(res.atlas);
		if (!blob) {
			deps.showError(i18n.t("tool.msg.atlas_export_failed"));
			return;
		}
		zip.file("atlas.png", blob);
		const fmt = byId<HTMLSelectElement>("atlas-format").value;
		if (fmt === "aseprite") {
			zip.file("atlas.json", atlasToAsepriteJSON(res, "atlas.png"));
		} else if (fmt === "godot") {
			zip.file("atlas.tres", atlasToGodotSpriteFrames(res, "res://atlas.png"));
		} else if (fmt === "csv") {
			zip.file("atlas.csv", atlasToCSV(res));
		} else {
			zip.file("atlas.json", atlasToJSON(res, "atlas.png"));
		}
		const content = await zip.generateAsync({ type: "blob" });
		downloadBlob(content, "spritesheet_atlas.zip");
	});

	addAtlasBtn.addEventListener("click", async () => {
		const all = deps.getAllImages();
		if (all.length === 0) return;
		const res = buildAtlas();
		await deps.addRawAsImage("atlas", res.atlas);
		deps.showInfo(i18n.t("tool.msg.added_atlas"));
		modal.close();
	});
};

// ---------------------------------------------------------------------------
// Palette tools + recolor
// ---------------------------------------------------------------------------
const initPaletteTool = (deps: ToolsDeps): void => {
	const modal = setupModal("palette-tool-modal");
	const swatches = byId<HTMLElement>("ptool-swatches");
	const count = byId<HTMLElement>("ptool-count");
	const recolorList = byId<HTMLElement>("ptool-recolor-list");
	const preview = byId<HTMLCanvasElement>("ptool-preview");
	const previewWrap = byId<HTMLElement>("ptool-preview-wrap");
	const importFile = byId<HTMLInputElement>("ptool-import-file");
	const addBtn = byId<HTMLButtonElement>("ptool-add");
	const dlBtn = byId<HTMLButtonElement>("ptool-download");

	let palette: RGB[] = [];
	let mapping = new Map<string, RGB>();
	let result: RawImage | null = null;

	const setResult = (raw: RawImage | null) => {
		result = raw;
		if (raw) {
			showPreview(preview, raw);
			previewWrap.style.display = "flex";
			addBtn.disabled = false;
			dlBtn.disabled = false;
		} else {
			previewWrap.style.display = "none";
			addBtn.disabled = true;
			dlBtn.disabled = true;
		}
	};

	const renderSwatches = () => {
		swatches.innerHTML = "";
		palette.forEach((c) => {
			const hex = rgbToHex(c).toUpperCase();
			const sw = document.createElement("div");
			sw.className = "color-swatch";
			sw.style.backgroundColor = hex;
			sw.dataset.tooltip = hex;
			sw.addEventListener("click", () => {
				navigator.clipboard?.writeText(hex);
			});
			swatches.appendChild(sw);
		});
		count.textContent = i18n.t("tool.info.colors", { count: palette.length });
	};

	const renderRecolorList = () => {
		recolorList.innerHTML = "";
		mapping = new Map();
		palette.forEach((c) => {
			const key = `${c.r},${c.g},${c.b}`;
			const row = document.createElement("div");
			row.className = "recolor-row";

			const from = document.createElement("span");
			from.className = "color-swatch small";
			from.style.backgroundColor = rgbToHex(c);
			row.appendChild(from);

			const arrow = document.createElement("span");
			arrow.className = "recolor-arrow";
			arrow.textContent = "->";
			row.appendChild(arrow);

			const picker = document.createElement("input");
			picker.type = "color";
			picker.value = rgbToHex(c);
			picker.addEventListener("input", () => {
				mapping.set(key, hexToRgb(picker.value));
			});
			row.appendChild(picker);

			recolorList.appendChild(row);
		});
	};

	const extract = () => {
		const src = deps.getActiveResult();
		if (!src) {
			deps.showError(i18n.t("tool.msg.load_first"));
			return;
		}
		palette = extractPalette(src, 256);
		renderSwatches();
		renderRecolorList();
		setResult(null);
	};

	byId<HTMLButtonElement>("open-palette-tool").addEventListener("click", () => {
		if (!deps.getActiveResult()) {
			deps.showError(i18n.t("tool.msg.load_first"));
			return;
		}
		modal.open();
		extract();
	});

	byId<HTMLButtonElement>("ptool-extract").addEventListener("click", extract);

	// Exports (of the currently extracted palette)
	const guardPalette = (): boolean => {
		if (palette.length === 0) {
			deps.showError(i18n.t("tool.msg.extract_first"));
			return false;
		}
		return true;
	};
	byId<HTMLButtonElement>("ptool-export-hex").addEventListener("click", () => {
		if (guardPalette()) downloadText(generateHEX(palette), "palette.hex");
	});
	byId<HTMLButtonElement>("ptool-export-pal").addEventListener("click", () => {
		if (guardPalette()) downloadText(generateJASCPAL(palette), "palette.pal");
	});
	byId<HTMLButtonElement>("ptool-export-gpl").addEventListener("click", () => {
		if (guardPalette())
			downloadText(generateGPL(palette, "PixelRefiner"), "palette.gpl");
	});
	byId<HTMLButtonElement>("ptool-export-png").addEventListener(
		"click",
		async () => {
			if (!guardPalette()) return;
			const blob = await generatePaletteImage(palette);
			if (blob) downloadBlob(blob, "palette.png");
		},
	);

	// Recolor
	byId<HTMLButtonElement>("ptool-apply-recolor").addEventListener(
		"click",
		() => {
			const src = deps.getActiveResult();
			if (!src) return;
			if (mapping.size === 0) {
				deps.showError(i18n.t("tool.msg.change_color_first"));
				return;
			}
			const recolored = recolorImageNearest(src, palette, mapping);
			setResult(recolored);
			deps.showInfo(i18n.t("tool.msg.recolor_applied"));
		},
	);
	byId<HTMLButtonElement>("ptool-reset-recolor").addEventListener(
		"click",
		() => {
			renderRecolorList();
			setResult(null);
		},
	);

	// Map current image to an imported palette
	byId<HTMLButtonElement>("ptool-import-btn").addEventListener("click", () => {
		importFile.click();
	});
	importFile.addEventListener("change", async () => {
		const file = importFile.files?.[0];
		if (!file) return;
		const src = deps.getActiveResult();
		if (!src) return;
		try {
			const text = await file.text();
			const imported = parseAnyPalette(text);
			if (imported.length === 0) {
				deps.showError(i18n.t("tool.msg.no_colors_in_file"));
				return;
			}
			palette = sortPalette(imported);
			renderSwatches();
			renderRecolorList();
			setResult(mapImageToPalette(src, imported));
			deps.showInfo(i18n.t("tool.msg.mapped", { count: imported.length }));
		} catch (err) {
			deps.showError(
				`${i18n.t("tool.msg.palette_read_failed")}: ${(err as Error).message}`,
			);
		}
		importFile.value = "";
	});

	addBtn.addEventListener("click", async () => {
		if (!result) return;
		await deps.addRawAsImage(`${deps.getActiveName()}_recolor`, result);
		deps.showInfo(i18n.t("tool.msg.added_recolor"));
		modal.close();
	});
	dlBtn.addEventListener("click", async () => {
		if (!result) return;
		const blob = await rawToBlob(result);
		if (blob) {
			downloadBlob(blob, `${deps.getActiveName()}_recolor.png`);
		} else {
			deps.showError(i18n.t("tool.msg.export_failed"));
		}
	});
};

export const initTools = (deps: ToolsDeps): void => {
	const safe = (fn: (d: ToolsDeps) => void, label: string) => {
		try {
			fn(deps);
		} catch (err) {
			console.error(`Failed to init ${label} tool:`, err);
		}
	};
	safe(initPhotoTool, "photo");
	safe(initSheetTool, "sprite-sheet");
	safe(initPaletteTool, "palette");
};
