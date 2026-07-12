# Pixel Refiner

[Japanese](./README.ja.md) | [Simplified Chinese](./README.zh-CN.md)

![Pixel Refiner Demo](.github/assets/demo.png)

**Pixel Refiner** is a free tool that cleans up pixel art — especially pixel art made with AI. It removes blurry edges, finds the real pixel grid, makes the background transparent, and more. Everything runs in your browser, on your own computer. No uploads.

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![Vite](https://img.shields.io/badge/Vite-646CFF)

## Run it on your computer

You only need [Node.js](https://nodejs.org/) (LTS version).

**1. Get the code**

- With Git: `git clone https://github.com/yukirtxreal-ctrl/pixel-refiner.git`
- Or click the green **Code** button on this page, then **Download ZIP**, and unzip it.

**2. Start the app**

- **Windows:** double-click `start-app.bat`.
- **macOS:** double-click `start-app.command` (the first time, right-click it and choose **Open**).
- **Linux / terminal:**

```
npm install
npm run dev
```

The app opens at `http://localhost:5173`. Keep the terminal window open while you use it. Close it to stop the app.

**Something broken?** On Windows, double-click `fix-and-start.bat`. It reinstalls everything and starts the app fresh.

**Build a standalone version:** `npm run build` puts the files in `dist/`. Serve that folder with any static server (for example `npx serve dist`). Do not open `index.html` straight from your file system — the image processing runs in a Web Worker, and browsers block that on `file://`.

## What it does

AI-made pixel art often has blurry edges, a crooked pixel grid, and a solid background. Pixel Refiner fixes that:

- **Removes anti-aliasing** — blurry edges become clean, sharp pixels.
- **Finds the pixel grid** — detects the true pixel size and resizes to match. Four modes: Auto, Hint, Force, Off (1:1). It keeps pixels square by default, so your image never gets squashed or stretched.
- **Removes the background** — automatic or with an eyedropper. Adjustable strength, hole cleanup, stray-pixel cleanup, and a "Keep Main Object" option.
- **Reduces colors** — smart color reduction (Oklab + K-means), retro console palettes (NES, Game Boy, PICO-8, SNES style, and more), and dithering (Floyd-Steinberg, Bayer, Ordered).
- **Adds outlines** around your sprite, in any color.
- **Trims empty space**, resizes to an exact pixel size, and **exports at 2x up to 32x**.
- **Handles many images at once** — drag in a batch, then **Download All (ZIP)**.
- **Presets** — save your favorite settings and reuse them.

## Extra tools

Open these from the **Tools** panel inside the app:

- **Photo → Pixel Art** — turn any photo or picture into pixel art.
- **Sprite Sheet** — slice a sheet into frames, or pack images into one atlas with TexturePacker JSON, Aseprite JSON, Godot SpriteFrames, or CSV data.
- **Palette / Recolor** — extract, export, and swap palettes. Built-in classics like PICO-8, Sweetie 16, DawnBringer, and Endesga 32.
- **Animation Studio** — import a GIF or APNG, clean up every frame, preview it, then export as GIF, APNG, single frames, or a sprite sheet.
- **Touch-up** — fix single pixels by hand: pencil, eraser, fill, color picker, undo/redo, and a Restore brush that brings back parts the background remover ate.
- **Seamless Check** — see if a tile repeats without visible seams.
- **Tile Heatmap** — see which tiles use more colors than a retro console would allow.
- **Copy Settings Link** — share your exact settings as a link.

The full list of changes is in [WHATS_NEW.md](./WHATS_NEW.md).

## How to use

1. Drag and drop one or more images into the app.
2. Press **Process** (or turn on **Auto**).
3. Adjust the settings if needed: grid detection, colors, background, outline.
4. Use **Compare** to see before and after.
5. Click **Download** — or **Download All (ZIP)** for many images.

## Development

Built with TypeScript and Vite. You need Node.js 24 or newer.

```
npm install     # install dependencies
npm run dev     # dev server at http://localhost:5173
npm run build   # production build into dist/
npm test        # run the unit tests
```

## Project structure

- `src/browser/` — the user interface
- `src/core/` — the image processing (grid detection, resampling, transparency, animation, and so on)
- `src/utils/` — palette import and export helpers
- `src/shared/` — shared types and settings
- `test/` — test images and fixtures

## Credits & License

Based on [PixelRefiner](https://github.com/HappyOnigiri/PixelRefiner) by Happy Onigiri. Released under the [MIT License](./LICENSE).
