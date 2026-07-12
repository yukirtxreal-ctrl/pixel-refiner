# Pixel Refiner（ピクセルリファイナー）

[English](./README.md) | [简体中文](./README.zh-CN.md)

![Pixel Refiner デモ](.github/assets/demo.png)

**Pixel Refiner** は、ドット絵（特に AI で作ったドット絵）をきれいに整える無料ツールです。ぼやけた輪郭を消し、本来のピクセルグリッドを見つけ、背景を透明にします。すべてブラウザの中で、自分のパソコンだけで動きます。アップロードは不要です。

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![Vite](https://img.shields.io/badge/Vite-646CFF)

> **Note:** このリポジトリの元は **[HappyOnigiri/PixelRefiner](https://github.com/HappyOnigiri/PixelRefiner)**（Happy Onigiri さん作）です。このバージョンはオリジナルに追加ツールと修正を加えたものです。

## パソコンで動かす

必要なのは [Node.js](https://nodejs.org/)（LTS 版）だけです。

**1. コードを入手する**

- Git を使う場合: `git clone https://github.com/yukirtxreal-ctrl/pixel-refiner.git`
- または、このページの緑色の **Code** ボタンから **Download ZIP** を選び、解凍します。

**2. アプリを起動する**

- **Windows:** `start-app.bat` をダブルクリック。
- **macOS:** `start-app.command` をダブルクリック（初回は右クリックして「開く」を選択）。
- **Linux / ターミナル:**

```
npm install
npm run dev
```

アプリは `http://localhost:5173` で開きます。使っている間はターミナルを開いたままにしてください。閉じるとアプリも止まります。

**うまく動かないとき:** Windows なら `fix-and-start.bat` をダブルクリック。すべて入れ直してから起動します。

**単体ビルド:** `npm run build` を実行すると `dist/` にファイルができます。静的サーバーで配信してください（例: `npx serve dist`）。`index.html` を直接開くのは NG です（画像処理が Web Worker で動くため、`file://` ではブラウザにブロックされます）。

## できること

- **アンチエイリアス除去** — ぼやけた輪郭をくっきりしたピクセルに戻します。
- **ピクセルグリッド検出** — 本来のピクセルサイズを見つけてリサイズ。モードは Auto / Hint / Force / Off (1:1) の 4 つ。標準でピクセルを正方形に保つので、絵がつぶれません。
- **背景の透明化** — 自動またはスポイトで指定。強さの調整、穴の除去、はぐれピクセルの掃除、「メインオブジェクト保護」もあります。
- **減色** — 高品質な減色（Oklab + K-means）、レトロ機パレット（NES、ゲームボーイ、PICO-8、SFC 風など）、ディザリング対応。
- **アウトライン**、**余白の自動トリミング**、**2 倍〜32 倍での書き出し**、**複数画像の一括処理**（ZIP で一括ダウンロード）、**プリセット保存**。

## 追加ツール

アプリ内の「ツール」パネルから開けます。

- **写真 → ドット絵** — 好きな写真をドット絵に変換。
- **スプライトシート** — シートをコマに分割、または複数画像を 1 枚のアトラスにパック（TexturePacker JSON / Aseprite JSON / Godot SpriteFrames / CSV）。
- **パレット / リカラー** — パレットの抽出・書き出し・色替え。PICO-8 や Sweetie 16、DawnBringer、Endesga 32 などの定番パレット内蔵。
- **アニメスタジオ** — GIF / APNG を読み込んで全コマを一括変換し、プレビューして GIF / APNG / コマ / スプライトシートで書き出し。
- **手直しエディタ** — ペン・消しゴム・塗りつぶし・スポイト・取り消しに加え、背景除去で消えすぎた部分を戻す「復元ブラシ」。
- **継ぎ目チェック** — タイルとして並べたときに継ぎ目が出ないか確認。
- **タイルヒートマップ** — レトロ機の制限を超える色数のタイルを可視化。
- **設定リンクのコピー** — 今の設定を URL にして共有。

変更点の一覧は [WHATS_NEW.md](./WHATS_NEW.md) にあります。

## 使い方

1. 画像をアプリにドラッグ＆ドロップします（複数可）。
2. **Process** を押します（**Auto** をオンにしてもOK）。
3. 必要に応じて設定を調整: グリッド検出、色、背景、アウトライン。
4. **Compare** でビフォーアフターを確認。
5. **Download** で保存。複数枚なら **Download All (ZIP)**。

## 開発

TypeScript + Vite 製。Node.js 24 以上が必要です。

```
npm install     # 依存関係のインストール
npm run dev     # 開発サーバー (http://localhost:5173)
npm run build   # 本番ビルド (dist/)
npm test        # ユニットテスト
```

## プロジェクト構成

- `src/browser/` — ユーザーインターフェース
- `src/core/` — 画像処理（グリッド検出、リサンプリング、透明化、アニメーションなど）
- `src/utils/` — パレットの入出力ヘルパー
- `src/shared/` — 共通の型と設定
- `test/` — テスト画像とフィクスチャ

## クレジットとライセンス

Happy Onigiri さんの [PixelRefiner](https://github.com/HappyOnigiri/PixelRefiner) をベースにしています。[MIT ライセンス](./LICENSE)で公開しています。
