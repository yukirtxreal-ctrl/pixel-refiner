# New in this update (v2 tools)

Seven more tools and quality features were added on top of the fork below.
All processing additions default to OFF, so default output still matches the
original PixelRefiner exactly.

## Animation Studio (Tools group)
Import an animated **GIF or APNG**, refine every frame with your current
settings, preview the result (play / onion skin), then export as **GIF**,
**APNG**, individual **frames (ZIP)**, or a **sprite sheet** with
TexturePacker / Aseprite / Godot / CSV metadata. Optional duplicate-frame
merging keeps files small.

## Touch-up Editor (Tools group)
Fix the last few pixels without leaving the app: pencil / eraser / fill /
color picker, an **undo/redo** stack, swatches from the image's own palette,
and a **Restore brush** that paints back the pre-transparency pixels where
background removal took too much.

## Seamless Check + Tile Heatmap (Tools group)
- **Seamless Check**: 3x3 wrap preview with mismatching edge rows/columns
  highlighted - for tileset work.
- **Tile Heatmap**: shows which NxN tiles exceed a color budget.

## Tile Color Limit (Color Reduction settings)
Enforce retro-hardware-style per-tile color budgets (e.g. max 4 colors per
8x8 tile). Extra colors are remapped to each tile's closest surviving colors.
(`src/core/tileConstraint.ts`)

## Clean Stray Pixels (Background settings, off by default)
A conservative post-pass that removes isolated single pixels and recolors
lone speckles. (`cleanStrayPixels` in `src/core/processor.ts`,
`src/core/cleanup.ts`)

## Palette Library, Ramps & Merge (Palette / Recolor tool)
Eleven classic palettes built in (PICO-8, Sweetie 16, DawnBringer 16/32,
Endesga 32, SLSO8, ...) - apply to the image or set as the Fixed palette.
"Organize Ramps" groups the image's palette into hue ramps; "Merge Similar"
collapses near-duplicate colors. (`src/core/paletteLibrary.ts`,
`src/core/paletteRamps.ts`)

## Defaults tuned for AI-generated art
- **Lock Aspect Ratio** defaults ON (prevents wide/tall subjects from being
  squashed when the detected grid cells are not square).
- **Background Tolerance** starts at 20 instead of 64 (64 tends to leak
  through dark outlines and eat parts of the subject).

## Shareable settings links + offline support
**Copy Settings Link** encodes your current settings into a URL you can
bookmark or send to someone. The app also installs as a **PWA** and works
offline (production builds).

## Where the new code lives
- `src/core/animation.ts`, `src/core/animcodec.ts` - frames + GIF/APNG codecs
- `src/core/cleanup.ts`, `src/core/tileConstraint.ts` - cleanup + tile budget
- `src/core/paletteLibrary.ts`, `src/core/paletteRamps.ts` - palettes
- `src/core/tileable.ts`, `src/core/exporters.ts` - seams + atlas formats
- `src/browser/extras.ts` - all the new UI wiring
- New dependencies: `gifenc`, `gifuct-js`, `upng-js`, `pako`

Everything is unit tested - run `npm test` (23 files, 169 tests).

# Added features

Three new tools were added to Pixel Refiner. They live in a **Tools** group in
the settings panel (buttons: **Photo -> Pixel Art**, **Sprite Sheet**,
**Palette / Recolor**). This fork also improves a few existing behaviors -
see "Fixes and improvements" below; everything else is unchanged from the
original.

## 1. Photo -> Pixel Art
Turn any normal image/photo into pixel art. Area-average downscale to a target
size, then optional color reduction (K-means) with optional dithering
(Floyd-Steinberg / Bayer / Ordered). Preview, download the PNG, or send it into
the image list for further refining.

## 2. Sprite Sheet (slicer + packer)
- **Slice** a sheet into individual frames by columns x rows or by fixed cell
  size. Add the frames to the image list or download them as a ZIP.
- **Pack** every image in the list into a single atlas PNG on a uniform grid
  (configurable columns + transparent padding) and download the atlas plus a
  TexturePacker-style `atlas.json`.

## 3. Palette / Recolor
- Extract the palette from the current image.
- Export it as `.hex`, `.pal` (JASC), `.gpl` (GIMP), or `.png`.
- **Recolor**: pick a new color for any swatch and apply a palette swap
  (great for character variants).
- **Map to palette file**: import a `.gpl` / `.hex` / `.pal` file and remap the
  image to the nearest colors in that palette.

# Fixes and improvements

- **Keep Main Object** (Background settings, off by default): background
  removal keeps only the largest connected shape and clears stray remnants,
  so it no longer eats into the main object. (`keepLargestObject` in
  `src/core/processor.ts` / `src/browser/app.ts`)
- **Lock Aspect Ratio** (Trimming settings, on by default): forces square
  pixels so the subject is never stretched or squashed.
  (`lockAspectRatio` / `_lockGridToSquarePixels` in `src/core/processor.ts`)
- **Clearer export feedback**: PNG / atlas exports show a message if the
  browser cannot encode the file instead of failing silently.
- **Preset fix**: the "Keep Aspect Ratio" toggle is saved and restored with
  presets (it was skipped in the original).
- **Outline in every grid mode**: the outline setting now also applies in
  "Force (Pixel only)" and "Off (1:1)" grid modes (it was silently ignored
  outside Auto/Hint).
- **Post-process transparency in 1:1 mode**: "Post-process Transparency" now
  works when grid detection is off.
- The three tools and the fork's settings are fully translated (EN / JA /
  ZH), like the rest of the app.

# Where the code lives
- `src/core/pixelate.ts` - photo -> pixel-art (downscale + quantize)
- `src/core/spritesheet.ts` - slice + pack + atlas JSON
- `src/core/recolor.ts` - palette swap + map-to-palette
- `src/utils/palette.ts` - added `.hex` / `.pal` import & export helpers
- `src/browser/tools.ts` - the UI wiring for the three tool modals
- `index.html`, `src/browser/app.ts`, `src/browser/style.css` - UI hooks

Each core module has unit tests (`*.test.ts`); run `pnpm test` for the full
suite (15 test files, 130+ tests).

# Running it
Development server:

    npm install
    npm run dev

Or serve the prebuilt app in `dist/` with any static server (open it via a
server, not `file://`, because the processing runs in a Web Worker):

    npx serve dist
