export type Language = "ja" | "en" | "zh-CN";

const isLanguage = (value: string | null): value is Language =>
	value === "ja" || value === "en" || value === "zh-CN";

const detectBrowserLanguage = (): Language => {
	const lang = typeof navigator !== "undefined" ? navigator.language : "";
	if (lang.startsWith("zh")) {
		return "zh-CN";
	}
	if (lang.startsWith("ja")) {
		return "ja";
	}
	return "en";
};

const resources = {
	ja: {
		// UI Headings & Labels
		"app.title": "Pixel Refiner | AIドット絵の最適化・背景透過ツール",
		"app.description":
			'AIで生成したドット絵を、<span class="text-highlight">素材</span>や<span class="text-highlight">アイコン</span>として使えるクオリティに。<br />' +
			'<span class="text-highlight">アンチエイリアス除去</span>・<span class="text-highlight">背景透過</span>を数秒で完了します。',
		"section.input": "入力画像",
		"section.result": "処理結果",
		"section.palette": "パレット",
		"ui.process_btn": "処理を実行",
		"ui.images": "画像一覧",
		"ui.auto_process": "自動",
		"ui.download_btn": "ダウンロード",
		"ui.export_gpl": ".GPLを書き出し",
		"ui.export_png": ".PNGを書き出し",
		"ui.import_palette": "パレットを読み込み",
		"ui.show_palette": "パレットを表示",
		"ui.clear_all": "すべてクリア",
		"ui.download_all": "一括ダウンロード",
		"ui.download_all_zip": "一括ダウンロード (ZIP)",
		"ui.pixel_size": "ピクセルサイズ",
		"ui.select_size_title": "変更するサイズを選択",
		"ui.select_size_note":
			"※推定値です。選択したサイズを参考に最適なグリッドを再判定します。",
		"ui.change_to_this_size": "このサイズに変更",
		"ui.remove_image": "画像を削除",
		"ui.confirm_clear_all": "すべての画像を削除してもよろしいですか？",
		"ui.size": "サイズ",
		"ui.view_single": "単体",
		"ui.view_compare": "比較",
		"ui.compare_before_original": "元画像",
		"ui.compare_before_sanitized": "サニタイズ",
		"ui.placeholder.input":
			'画像をここにドラッグ＆ドロップ<br /><span class="drop-subtext">または クリックして選択<br />(複数可)</span>',
		"ui.placeholder.result": "処理結果がここに表示されます",
		"ui.close": "閉じる",
		"ui.download_options": "ダウンロード種別を選択",

		// Settings
		"setting.color_reduction": "減色",
		"setting.color_mode": "減色モード",
		"setting.color_count": "色数",
		"setting.dither_mode": "ディザリング",
		"setting.dither_strength": "ディザリング強度 (%)",
		"setting.advanced": "詳細設定",
		"setting.grid_detection": "グリッド検出",
		"setting.grid_mode": "グリッド検出モード",
		"setting.quant_step": "減色段階",
		"setting.sample_window": "サンプル対象範囲",
		"setting.force_width": "強制幅 (px)",
		"setting.force_height": "強制高さ (px)",
		"setting.fast_mode": "高速モード",
		"setting.make_square": "正方形にする",
		"setting.keep_aspect_ratio": "アスペクト比を維持",
		"setting.bg_removal": "背景透過",
		"setting.bg_method": "背景抽出方法",
		"setting.bg_rgb": "背景色(RGB)",
		"setting.bg_tolerance": "背景色の許容差",
		"setting.pre_remove": "事前の背景透過",
		"setting.post_remove": "事後の背景透過",
		"setting.bg_removal_scope": "背景透過の範囲",
		"setting.bg_connectivity": "連結判定",

		"setting.floating_max": "浮きノイズ上限(%)",
		"setting.trimming": "トリミング",
		"setting.auto_trim": "自動トリム",
		"setting.outline": "アウトライン",
		"setting.outline_style": "スタイル",
		"setting.outline_color": "色",
		"setting.processing": "処理",
		"setting.auto_process": "自動変換",
		"section.presets": "プリセット",
		"ui.preset_name": "プリセット名",
		"ui.save_preset": "保存",
		"ui.load_preset": "ロード",
		"ui.delete_preset": "削除",
		"ui.confirm_delete_preset": "プリセットを削除してもよろしいですか？",
		"ui.confirm_overwrite_preset":
			"同じ名前のプリセットが既に存在します。上書きしますか？",
		"ui.preset_loaded": "プリセット「{name}」を読み込みました",
		"ui.preset_saved": "プリセット「{name}」を保存しました",
		"tooltip.help.auto_process":
			"設定を変更した際に、自動で変換処理を実行します。\n\n手動でボタンを押して実行したい場合はOFFにしてください。",

		// Tooltips
		"tooltip.help.color_mode":
			"出力結果の色数を制限します。\n\nドット絵らしい色使いに整えたい場合に有効です。\n無効: 減色を行いません。\nGame Boy / PICO-8 / NES: 各ゲーム機のパレットを使用します。\n色数指定 (Auto): 指定した色数に自動で減色します。",
		"tooltip.help.color_count":
			"出力する最大の色数を指定します。\n\n設定範囲: {min}〜{max} (デフォルト: {default})",
		"tooltip.help.dither_strength":
			"減色時にディザリング（誤差拡散）を適用します。\n\n100%: 完全な誤差拡散を行います。\n0%: ディザリングを行わず、最も近い色に丸めます。\n\n少ない色数でも滑らかなグラデーションを表現できますが、ドット絵特有のザラつきが発生します。\n\n設定範囲: {min}〜{max} (デフォルト: {default})",
		"tooltip.help.grid_mode":
			"グリッド検出の動作モードを切り替えます。\n\n自動検出: グリッドを自動検出します（デフォルト）。\nピクセル指定 + 自動検出: 指定ピクセルをヒントにして、その近傍から精密探索を開始します。\n完全ピクセル指定: 指定サイズに強制変換します（自動検出なし）。\n無効: グリッド検出と縮小をスキップします（等倍ドット絵向け）。",
		"tooltip.help.quant_step":
			"グリッド検出用の減色レベルを設定します。\n\n【大】色がまとまりノイズに強くなりますが、微妙な色の違いが消える場合があります。\n【小】色の境界を細かく拾いますが、ノイズを誤検出するリスクが高まります。\n\n設定範囲: {min}〜{max} (デフォルト: {default})",
		"tooltip.help.sample_window":
			"各ドットの色を決める際の参照範囲（ピクセル数）です。\n\n【大】ノイズが除去され色が安定しますが、細部のディテールが失われやすくなります。\n【小】元画像を忠実に再現しますが、位置ズレやノイズの影響を強く受けます。\n\n設定範囲: {min}〜{max} (デフォルト: {default})",
		"tooltip.help.force_width":
			"指定ピクセル（横）です。\n\nピクセル指定 + 自動検出: この値をヒントに精密探索を開始します。\n完全ピクセル指定: この値に強制変換します。\n\n設定範囲: 1〜1024 (デフォルト: 自動)",
		"tooltip.help.force_height":
			"指定ピクセル（縦）です。\n\nピクセル指定 + 自動検出: この値をヒントに精密探索を開始します。\n完全ピクセル指定: この値に強制変換します。\n\n設定範囲: 1〜1024 (デフォルト: 自動)",
		"tooltip.help.fast_mode":
			"ONにすると、効率的なアルゴリズムで探索を高速化します。\nOFFにすると、より広範囲を精密に探索します。\n\n自動検出の結果がズレる場合や、ノイズ・細かい模様が多い画像では、OFFにすると精度が向上します。",
		"tooltip.help.bg_method":
			"背景色をどこから抽出するか選択します。\n\n透過しない: 背景透過を行いません。\n各四隅: 指定した角のピクセルを背景色とします。\nRGB指定: 指定した色を背景色とします。",
		"tooltip.help.bg_rgb":
			"背景色として扱う色を16進数(例: #ffffff)で指定します。\n四隅指定時は自動で色がセットされます。スポイトボタンで画像から色を選択することもできます。",
		"tooltip.help.bg_tolerance":
			"背景色と判定する色の類似度（誤差範囲）です。\n\n【大】圧縮ノイズなどで色が多少ブレていても背景として透過できますが、必要な色まで消える可能性があります。\n【小】厳密に背景色のみを透過しますが、ノイズが残りやすくなります。\n\n設定範囲: {min}〜{max} (デフォルト: {default})",
		"tooltip.help.pre_remove":
			"グリッド検出を行う【前】に、背景色を無視します。\n\nメリット: 余白が広い画像でも、本体部分のグリッドを正しく検出しやすくなります。\n注意: 背景と同じ色がキャラクター内にある場合、検出精度が下がる可能性があります。",
		"tooltip.help.post_remove":
			"処理完了【後】に、背景色を透明に置き換えて出力します。\n\nメリット: 背景透明のPNGとして保存できます。\n注意: グリッド検出処理自体には影響しません。",
		"tooltip.help.bg_removal_scope":
			"背景をどこまで透過するかの範囲です。\n\n選択部分のみ: 選択した角から繋がる背景だけ透過。\n外側全部: 画像の外周に繋がる背景をすべて透過。\n全領域: 外側に加え、ドーナツ穴などの内側も透過。",
		"tooltip.help.bg_connectivity":
			"「繋がっている」の判定方法です。\n\n4方向: 斜めを含めない厳しい判定。\n8方向: 斜めも繋がりとみなします。",
		"tooltip.help.floating_max":
			"背景に囲まれて浮きノイズとみなす最大面積（元画像の総ピクセル数に対する割合）です。\n0%のときは浮きノイズ除去を行いません。\n例: 1% → (幅×高さ×0.01) px\n\n設定範囲: {min}〜{max} (デフォルト: {default})",
		"tooltip.help.auto_trim":
			"出力後に内容物が存在する範囲で自動的にトリミング（余白削除）を行います。\n\n余白（背景）が大きい画像に対して、これをONにすることで正しい縦横のマス数が検出されやすくなります。",
		"tooltip.help.make_square":
			"画像全体が正方形になるように、足りない部分を透過ピクセルで埋め合わせます。\n\n元の画像は中心に配置されます。",
		"tooltip.help.keep_aspect_ratio":
			"トリミング後の出力画像が元画像のアスペクト比を維持するように、透過ピクセルでパディングします。\n\nスプライトのキャンバスサイズを揃えたい場合に便利です。",

		// Select Options
		"option.none": "無効",
		"option.mono": "モノクロ",
		"option.gb_legacy": "ゲームボーイ (初代)",
		"option.gb_pocket": "ゲームボーイ (ポケット)",
		"option.gb_light": "ゲームボーイ (ライト)",
		"option.pico8": "PICO-8",
		"option.nes": "ファミコン (NES)",
		"option.pc98": "PC-9801",
		"option.msx": "MSX1",
		"option.c64": "Commodore 64",
		"option.arne16": "Arne 16",
		"option.sfc_sprite": "SFC風 (16色/スプライト)",
		"option.sfc_bg": "SFC風 (256色/背景)",
		"option.auto": "色数指定",
		"option.fixed": "固定パレット (Imported)",
		"option.dither_none": "無効",
		"option.dither_floyd": "Floyd-Steinberg",
		"option.dither_bayer2": "Bayer 2x2",
		"option.dither_bayer4": "Bayer 4x4",
		"option.dither_bayer8": "Bayer 8x8",
		"option.dither_ordered": "Ordered",
		"option.outline_none": "なし",
		"option.outline_rounded": "Rounded (8近傍)",
		"option.outline_sharp": "Sharp (4近傍)",
		"option.grid_mode_auto": "自動検出（デフォルト）",
		"option.grid_mode_hint": "ピクセル指定 + 自動検出",
		"option.grid_mode_force": "完全ピクセル指定",
		"option.grid_mode_off": "無効",
		"option.bg_none": "透過しない",
		"option.bg_scope_selected": "選択した角から繋がる部分のみ",
		"option.bg_scope_outer": "外周に繋がる部分すべて",
		"option.bg_scope_all": "外周＋内側（穴）も含む",
		"option.bg_connectivity_4": "4方向（斜めなし）",
		"option.bg_connectivity_8": "8方向（斜め含む）",
		"option.bg_top_left": "左上（デフォルト）",
		"option.bg_bottom_left": "左下",
		"option.bg_top_right": "右上",
		"option.bg_bottom_right": "右下",
		"option.bg_rgb": "RGB指定",

		// JS Messages
		"error.no_image": "先に画像を選択してください。",
		"error.process_failed": "処理失敗",
		"error.load_failed": "読み込み失敗",
		"info.grid_updated": "グリッドサイズを {w}x{h} に更新しました",

		"error.palette_limit":
			"警告: 画像には{count}色が含まれています。パレットは256色に制限されます。",
		"error.no_processed_images": "ダウンロード可能な処理済み画像がありません。",
		"error.download_failed": "ダウンロードに失敗しました",
		"status.processing": "処理中...",
		"status.processing_batch": "一括処理中... ({current}/{total})",

		// Attributes & Titles
		"attr.title.bg_checkered": "背景: 格子模様",
		"attr.title.bg_white": "背景: 白",
		"attr.title.bg_black": "背景: 黒",
		"attr.title.bg_green": "背景: 緑",
		"attr.title.grid_toggle": "グリッドを表示する（拡大時のみ有効）",
		"attr.title.zoom_toggle": "拡大表示する",
		"attr.title.eyedropper": "スポイトで画像から色を選択",
		"attr.placeholder.auto": "自動",

		// Modal
		"modal.eyedropper.title": "背景色を選択",
		"modal.eyedropper.instruction":
			"画像内の背景にしたい色をクリックしてください",

		// Footer
		"footer.privacy": "画像はブラウザ内で安全に処理されます",

		// Fork additions: settings
		"setting.keep_largest_object": "メインオブジェクトを保持",
		"tooltip.help.keep_largest_object":
			"最大の連結領域 (被写体) だけを残し、背景の残りや浮遊ノイズを除去します。\n\nメインオブジェクトを保護しながら背景をクリーンアップします。\n\n複数のスプライトが並んだシートを処理する場合はOFFにしてください。",
		"setting.lock_aspect_ratio": "縦横比を固定 (歪みなし)",
		"tooltip.help.lock_aspect_ratio":
			"ピクセルを正方形に固定し、グリッドが画像を引き伸ばしたり潰したりしないようにします。\n\n正方形の入力は正方形のまま、被写体の比率が保たれます。",
		"section.tools": "ツール",

		// Fork additions: common tool UI
		"tool.add_to_images": "画像一覧に追加",
		"tool.download_png": "PNGをダウンロード",
		"ui.copied": "コピーしました!",
		"error.unsupported_file":
			"対応していないファイル形式です。画像ファイルを選択してください。",
		"info.import_palette_first":
			"固定/カスタムパレット: 適用するにはパレットファイルを読み込んでください。",

		// Fork additions: Photo -> Pixel Art tool
		"tool.photo.open": "写真 -> ドット絵",
		"tool.photo.instruction":
			"現在の画像 (処理結果ではなく元画像) をドット絵に変換します: 縮小してから任意で減色します。",
		"tool.photo.max_side": "目標サイズ (長辺, px)",
		"tool.photo.palette": "パレット",
		"tool.photo.palette_auto": "減色 (自動)",
		"tool.photo.palette_none": "元の色を維持",

		// Fork additions: Sprite Sheet tool
		"tool.sheet.open": "スプライトシート",
		"tool.sheet.mode": "モード",
		"tool.sheet.mode_slice": "シートをフレームに分割",
		"tool.sheet.mode_pack": "画像をアトラスにパック",
		"tool.sheet.source": "対象画像",
		"tool.sheet.source_result": "処理結果",
		"tool.sheet.source_original": "元画像",
		"tool.sheet.slice_by": "分割方法",
		"tool.sheet.by_grid": "列数 x 行数",
		"tool.sheet.by_cell": "セルサイズ (px)",
		"tool.sheet.columns": "列数",
		"tool.sheet.rows": "行数",
		"tool.sheet.cell_width": "セル幅",
		"tool.sheet.cell_height": "セル高さ",
		"tool.sheet.pack_columns": "列数 (0 = 自動)",
		"tool.sheet.padding": "余白 (px)",
		"tool.sheet.pack_note":
			"一覧のすべての画像をパックします (処理結果があればそれを使用)。",
		"tool.sheet.add_frames": "フレームを画像一覧に追加",
		"tool.sheet.download_frames": "フレームをダウンロード (ZIP)",
		"tool.sheet.add_atlas": "アトラスを画像一覧に追加",
		"tool.sheet.download_atlas": "アトラス + JSONをダウンロード",

		// Fork additions: Palette / Recolor tool
		"tool.palette.open": "パレット / リカラー",
		"tool.palette.recolor": "リカラー",
		"tool.palette.recolor_hint": "変更したい色を選んで置き換え",
		"tool.palette.extract": "画像から抽出",
		"tool.palette.apply": "リカラーを適用",
		"tool.palette.reset": "リセット",
		"tool.palette.map_file": "パレットファイルに合わせて変換...",

		// Fork additions: tool messages
		"tool.msg.load_first": "先に画像を読み込んでください。",
		"tool.msg.added_pixel": "ドット絵画像を一覧に追加しました。",
		"tool.msg.export_failed": "画像を書き出せませんでした。",
		"tool.msg.added_frames": "{count}個のフレームを一覧に追加しました。",
		"tool.msg.no_images_to_pack": "パックする画像がありません。",
		"tool.msg.atlas_export_failed": "アトラス画像を書き出せませんでした。",
		"tool.msg.added_atlas": "アトラスを一覧に追加しました。",
		"tool.msg.extract_first": "先にパレットを抽出してください。",
		"tool.msg.change_color_first": "先に色を1つ以上変更してください。",
		"tool.msg.recolor_applied":
			"リカラーを適用しました。下のボタンで追加またはダウンロードできます。",
		"tool.msg.no_colors_in_file":
			"パレットファイルに色が見つかりませんでした。",
		"tool.msg.palette_read_failed": "パレットの読み込みに失敗しました",
		"tool.msg.mapped": "画像を読み込んだ{count}色にマッピングしました。",
		"tool.msg.added_recolor": "リカラー画像を一覧に追加しました。",
		"tool.info.frames": "{count}個のフレーム (各 {w} x {h} px)",
		"tool.info.no_frames":
			"フレームなし: グリッドが画像 ({w} x {h} px) より大きいです。",
		"tool.info.atlas": "アトラス {w} x {h} px, {count}フレーム",
		"tool.info.colors": "{count}色",
		"xt.share.copy": "設定リンクをコピー",
		"xt.share.copied": "設定リンクをクリップボードにコピーしました。",
		"xt.share.loaded": "共有リンクから設定を読み込みました。",
		"xt.anim.open": "アニメスタジオ",
		"xt.anim.title": "アニメスタジオ",
		"xt.anim.import": "GIF / APNG を読み込む",
		"xt.anim.refine": "全フレームを変換",
		"xt.anim.dedupe": "重複フレームを統合",
		"xt.anim.play": "再生",
		"xt.anim.pause": "一時停止",
		"xt.anim.onion": "オニオンスキン",
		"xt.anim.export_gif": "GIF を書き出す",
		"xt.anim.export_apng": "APNG を書き出す",
		"xt.anim.export_zip": "フレーム (ZIP)",
		"xt.anim.export_sheet": "シートを書き出す",
		"xt.anim.frames_info": "{count}フレーム, {w} x {h} px",
		"xt.anim.refined_info": "{count}フレームを {w} x {h} px に変換しました。",
		"xt.anim.refining": "フレームを変換中 {current}/{total}...",
		"xt.anim.no_anim": "先にアニメGIFまたはAPNGを読み込んでください。",
		"xt.anim.decode_failed": "GIF/APNGとして読み込めませんでした。",
		"xt.anim.dedupe_info": "重複フレームを{removed}個統合しました。",
		"xt.touchup.open": "手直し",
		"xt.touchup.title": "手直しエディタ",
		"xt.touchup.pencil": "ペン",
		"xt.touchup.eraser": "消しゴム",
		"xt.touchup.fill": "塗りつぶし",
		"xt.touchup.picker": "スポイト",
		"xt.touchup.restore": "復元ブラシ",
		"xt.touchup.undo": "元に戻す",
		"xt.touchup.redo": "やり直す",
		"xt.touchup.apply": "画像に適用",
		"xt.touchup.applied": "手直しを適用しました。",
		"xt.touchup.no_image": "先に画像を処理してください。",
		"xt.touchup.restore_na": "この結果では復元元を利用できません。",
		"xt.seamless.open": "継ぎ目チェック",
		"xt.seamless.title": "シームレスタイルチェック",
		"xt.seamless.tolerance": "許容差",
		"xt.seamless.ok": "完全にタイル化できます。上下左右の端が一致しています。",
		"xt.seamless.info": "横方向の継ぎ目: {h}行が不一致。縦方向の継ぎ目: {v}列が不一致。",
		"xt.heatmap.open": "タイルヒートマップ",
		"xt.heatmap.tile_size": "タイルサイズ",
		"xt.heatmap.max": "最大色数",
		"xt.heatmap.none": "すべてのタイルが色数の上限内です。",
		"xt.heatmap.info": "{tiles}タイル中{violations}タイルが{max}色を超えています。",
		"xt.clean_stray": "はぐれピクセル除去",
		"xt.clean_stray.tip": "処理後に孤立した1ピクセルを除去し、周囲と異なる単独ピクセルを塗り直します。\n\nアンチエイリアスの残りや背景除去の残骸向けの控えめなクリーンアップです。",
		"xt.tile.title": "タイル色数制限",
		"xt.tile.tip": "各NxNタイルで使える色数をレトロ機の制限のように上限化します。\n\n超過した色はタイル内の最も近い色に置き換えられます。違反箇所はタイルヒートマップで確認できます。",
		"xt.tile.off": "オフ",
		"xt.tile.max": "タイルごとの最大色数",
		"xt.pal.library": "パレットライブラリ",
		"xt.pal.apply": "画像に適用",
		"xt.pal.set_fixed": "固定パレットに設定",
		"xt.pal.applied": "パレットを適用しました: {name}",
		"xt.pal.fixed_set": "固定パレットを設定: {name}（{count}色）",
		"xt.pal.ramps_title": "ランプと統合",
		"xt.pal.ramps": "ランプを整理",
		"xt.pal.merge": "近似色を統合",
		"xt.pal.merge_threshold": "しきい値",
		"xt.pal.merges_applied": "近似色{count}組を統合しました。",
		"xt.pal.no_merges": "統合できるほど近い色はありません。",
		"xt.pal.no_image": "先に画像を処理または選択してください。",
		"xt.pal.ramp_neutral": "無彩色",
		"xt.atlas.format": "メタデータ形式",
	},
	"zh-CN": {
		// UI Headings & Labels
		"app.title": "Pixel Refiner | AI 像素画优化与背景透明工具",
		"app.description":
			'将 AI 生成的像素画优化为可直接用于<span class="text-highlight">素材</span>和<span class="text-highlight">图标</span>的品质。<br />' +
			'数秒内完成<span class="text-highlight">抗锯齿清理</span>和<span class="text-highlight">背景透明化</span>。',
		"section.input": "输入图片",
		"section.result": "处理结果",
		"section.palette": "调色板",
		"ui.process_btn": "开始处理",
		"ui.images": "图片列表",
		"ui.auto_process": "自动",
		"ui.download_btn": "下载",
		"ui.export_gpl": "导出 .GPL",
		"ui.export_png": "导出 .PNG",
		"ui.import_palette": "导入调色板",
		"ui.show_palette": "显示调色板",
		"ui.clear_all": "全部清除",
		"ui.download_all": "全部下载",
		"ui.download_all_zip": "全部下载 (ZIP)",
		"ui.pixel_size": "像素尺寸",
		"ui.select_size_title": "选择要切换的尺寸",
		"ui.select_size_note":
			"*以下为估算值。选择后会根据该尺寸重新判定最佳网格。",
		"ui.change_to_this_size": "切换到此尺寸",
		"ui.remove_image": "移除图片",
		"ui.confirm_clear_all": "确定要清除所有图片吗？",
		"ui.size": "尺寸",
		"ui.view_single": "单图",
		"ui.view_compare": "对比",
		"ui.compare_before_original": "原图",
		"ui.compare_before_sanitized": "预处理",
		"ui.placeholder.input":
			'将图片拖放到这里<br /><span class="drop-subtext">或点击选择<br />(支持多张)</span>',
		"ui.placeholder.result": "处理结果会显示在这里",
		"ui.close": "关闭",
		"ui.download_options": "选择下载类型",

		// Settings
		"setting.color_reduction": "减色",
		"setting.color_mode": "减色模式",
		"setting.color_count": "颜色数量",
		"setting.dither_mode": "抖动",
		"setting.dither_strength": "抖动强度 (%)",
		"setting.advanced": "高级设置",
		"setting.grid_detection": "网格检测",
		"setting.grid_mode": "网格检测模式",
		"setting.quant_step": "量化步长",
		"setting.sample_window": "采样范围",
		"setting.force_width": "强制宽度 (px)",
		"setting.force_height": "强制高度 (px)",
		"setting.fast_mode": "快速模式",
		"setting.make_square": "转为正方形",
		"setting.keep_aspect_ratio": "保持宽高比",
		"setting.bg_removal": "背景透明化",
		"setting.bg_method": "背景提取方式",
		"setting.bg_rgb": "背景色 (RGB)",
		"setting.bg_tolerance": "背景色容差",
		"setting.pre_remove": "处理前透明化",
		"setting.post_remove": "处理后透明化",
		"setting.bg_removal_scope": "背景透明化范围",
		"setting.bg_connectivity": "连通判定",

		"setting.floating_max": "漂浮噪点上限 (%)",
		"setting.trimming": "裁剪",
		"setting.auto_trim": "自动裁剪",
		"setting.outline": "描边",
		"setting.outline_style": "样式",
		"setting.outline_color": "颜色",
		"setting.processing": "处理",
		"setting.auto_process": "自动转换",
		"section.presets": "预设",
		"ui.preset_name": "预设名称",
		"ui.save_preset": "保存",
		"ui.load_preset": "加载",
		"ui.delete_preset": "删除",
		"ui.confirm_delete_preset": "确定要删除此预设吗？",
		"ui.confirm_overwrite_preset": "已存在同名预设。要覆盖它吗？",
		"ui.preset_loaded": "已加载预设“{name}”",
		"ui.preset_saved": "已保存预设“{name}”",
		"tooltip.help.auto_process":
			"设置变化时自动运行转换处理。\n\n如果想手动点击处理按钮，请关闭此选项。",

		// Tooltips
		"tooltip.help.color_mode":
			"限制输出结果的颜色数量。\n\n适合将画面整理成更接近经典像素画的色彩风格。\n无：不进行减色。\nGame Boy / PICO-8 / NES：使用对应主机的调色板。\n自定义数量：自动减色到指定颜色数量。",
		"tooltip.help.color_count":
			"指定输出的最大颜色数量。\n\n范围：{min} 到 {max} (默认：{default})",
		"tooltip.help.dither_strength":
			"减色时应用抖动（误差扩散）。\n\n100%：完整误差扩散。\n0%：不使用抖动，直接取最接近的颜色。\n\n可以用较少颜色表现更平滑的渐变，但会产生像素画常见的颗粒感。\n\n范围：{min} 到 {max} (默认：{default})",
		"tooltip.help.grid_mode":
			"切换网格检测的工作方式。\n\n自动检测：自动检测网格（默认）。\n像素指定 + 自动检测：把指定像素尺寸作为提示，并在附近进行精细搜索。\n完全像素指定：强制转换为指定尺寸（不自动检测）。\n关闭：跳过网格检测和缩小（适合 1:1 像素画）。",
		"tooltip.help.quant_step":
			"设置网格检测使用的减色级别。\n\n高：颜色会被归并，更抗噪，但细微色差可能丢失。\n低：能捕捉更细的颜色边界，但更容易误判噪点。\n\n范围：{min} 到 {max} (默认：{default})",
		"tooltip.help.sample_window":
			"决定每个像素块颜色时参考的范围（像素数）。\n\n高：噪点更容易被去除，颜色更稳定，但细节更容易丢失。\n低：更忠实于原图，但更容易受错位和噪点影响。\n\n范围：{min} 到 {max} (默认：{default})",
		"tooltip.help.force_width":
			"指定像素宽度。\n\n像素指定 + 自动检测：用该值作为提示并在附近精细搜索。\n完全像素指定：强制转换为该宽度。\n\n范围：1 到 1024 (默认：自动)",
		"tooltip.help.force_height":
			"指定像素高度。\n\n像素指定 + 自动检测：用该值作为提示并在附近精细搜索。\n完全像素指定：强制转换为该高度。\n\n范围：1 到 1024 (默认：自动)",
		"tooltip.help.fast_mode":
			"开启后使用更高效的算法加快搜索。\n关闭后会进行更大范围、更精细的搜索。\n\n如果自动检测结果错位，或图片包含大量噪点和细碎纹理，关闭后可能提高准确度。",
		"tooltip.help.bg_method":
			"选择从哪里提取背景色。\n\n无：不移除背景。\n四角：使用指定角落的像素作为背景色。\nRGB：使用指定颜色作为背景色。",
		"tooltip.help.bg_rgb":
			"用十六进制格式指定要视为背景的颜色（例如 #ffffff）。\n选择四角时会自动填入颜色。也可以用吸管按钮从图片中取色。",
		"tooltip.help.bg_tolerance":
			"判断背景色相似度的误差范围。\n\n高：即使背景因压缩噪点产生轻微偏差也能移除，但可能误删需要保留的颜色。\n低：只移除更接近精确背景色的颜色，但可能残留噪点。\n\n范围：{min} 到 {max} (默认：{default})",
		"tooltip.help.pre_remove":
			"在网格检测前忽略背景色。\n\n优点：图片留白较大时，更容易正确检测主体网格。\n注意：如果角色内部也有背景同色区域，检测准确度可能下降。",
		"tooltip.help.post_remove":
			"处理完成后将背景色替换为透明。\n\n优点：可以保存为透明背景 PNG。\n注意：不会影响网格检测过程本身。",
		"tooltip.help.bg_removal_scope":
			"决定背景透明化的范围。\n\n仅选中部分：只透明化从所选角落连通的背景。\n外侧全部：透明化所有与图片边缘连通的背景。\n全区域：外侧背景加上内部孔洞也一起透明化。",
		"tooltip.help.bg_connectivity":
			"决定相邻区域是否算作连通。\n\n4 方向：更严格，不包含斜向。\n8 方向：包含斜向相邻。",
		"tooltip.help.floating_max":
			"被视为漂浮噪点并移除的最大面积，占原图总像素数的百分比。\n设为 0% 时不移除漂浮噪点。\n示例：1% -> (宽度 x 高度 x 0.01) px\n\n范围：{min} 到 {max} (默认：{default})",
		"tooltip.help.auto_trim":
			"处理后自动裁剪到包含内容的范围。\n\n对于留白（背景）较大的图片，开启后更容易检测到正确的横纵格数。",
		"tooltip.help.make_square":
			"用透明像素填充不足的边，使整张图片变为正方形。\n\n原内容会居中放置。",
		"tooltip.help.keep_aspect_ratio":
			"裁剪后的输出图片使用透明像素填充，以保持原图的宽高比。\n\n适用于需要统一精灵画布尺寸的场景。",

		// Select Options
		"option.none": "无",
		"option.mono": "黑白",
		"option.gb_legacy": "Game Boy (初代)",
		"option.gb_pocket": "Game Boy (Pocket)",
		"option.gb_light": "Game Boy (Light)",
		"option.pico8": "PICO-8",
		"option.nes": "NES",
		"option.pc98": "PC-9801",
		"option.msx": "MSX1",
		"option.c64": "Commodore 64",
		"option.arne16": "Arne 16",
		"option.sfc_sprite": "SFC 风格 (16 色/精灵)",
		"option.sfc_bg": "SFC 风格 (256 色/背景)",
		"option.auto": "自定义数量",
		"option.fixed": "固定/自定义调色板",
		"option.dither_none": "无",
		"option.dither_floyd": "Floyd-Steinberg",
		"option.dither_bayer2": "Bayer 2x2",
		"option.dither_bayer4": "Bayer 4x4",
		"option.dither_bayer8": "Bayer 8x8",
		"option.dither_ordered": "Ordered",
		"option.outline_none": "无",
		"option.outline_rounded": "圆润 (8 方向)",
		"option.outline_sharp": "锐利 (4 方向)",
		"option.grid_mode_auto": "自动检测（默认）",
		"option.grid_mode_hint": "像素指定 + 自动检测",
		"option.grid_mode_force": "完全像素指定",
		"option.grid_mode_off": "关闭",
		"option.bg_none": "无",
		"option.bg_scope_selected": "仅从所选角落连通的部分",
		"option.bg_scope_outer": "所有与外边缘连通的部分",
		"option.bg_scope_all": "外侧 + 内部孔洞",
		"option.bg_connectivity_4": "4 方向（不含斜向）",
		"option.bg_connectivity_8": "8 方向（含斜向）",
		"option.bg_top_left": "左上（默认）",
		"option.bg_bottom_left": "左下",
		"option.bg_top_right": "右上",
		"option.bg_bottom_right": "右下",
		"option.bg_rgb": "RGB 指定",

		// JS Messages
		"error.no_image": "请先选择图片。",
		"error.process_failed": "处理失败",
		"error.load_failed": "加载失败",
		"info.grid_updated": "网格尺寸已更新为 {w}x{h}",

		"error.palette_limit": "警告：图片包含{count}种颜色。调色板将限制为256色。",
		"error.no_processed_images": "没有可下载的已处理图片。",
		"error.download_failed": "下载失败",
		"status.processing": "处理中...",
		"status.processing_batch": "正在批量处理... ({current}/{total})",

		// Attributes & Titles
		"attr.title.bg_checkered": "背景：棋盘格",
		"attr.title.bg_white": "背景：白色",
		"attr.title.bg_black": "背景：黑色",
		"attr.title.bg_green": "背景：绿色",
		"attr.title.grid_toggle": "显示网格（仅缩放时有效）",
		"attr.title.zoom_toggle": "放大显示",
		"attr.title.eyedropper": "用吸管从图片中选择颜色",
		"attr.placeholder.auto": "自动",

		// Modal
		"modal.eyedropper.title": "选择背景色",
		"modal.eyedropper.instruction": "点击图片中要作为背景的颜色",

		// Footer
		"footer.privacy": "图片会在浏览器内安全处理",

		// Fork additions: settings
		"setting.keep_largest_object": "保留主体对象",
		"tooltip.help.keep_largest_object":
			"仅保留最大的连通区域（主体），并清除残留背景和游离噪点。\n\n在清理背景的同时保护主体对象。\n\n处理包含多个独立精灵的图表时请关闭此选项。",
		"setting.lock_aspect_ratio": "锁定宽高比（无变形）",
		"tooltip.help.lock_aspect_ratio":
			"强制像素为正方形，使像素网格不会拉伸或压扁图像。\n\n正方形输入保持正方形，主体比例不变。",
		"section.tools": "工具",

		// Fork additions: common tool UI
		"tool.add_to_images": "添加到图片列表",
		"tool.download_png": "下载 PNG",
		"ui.copied": "已复制！",
		"error.unsupported_file": "不支持的文件类型。请选择图片文件。",
		"info.import_palette_first":
			"固定/自定义调色板：请先导入调色板文件再应用。",

		// Fork additions: Photo -> Pixel Art tool
		"tool.photo.open": "照片 -> 像素画",
		"tool.photo.instruction":
			"将当前图片（原图，而非处理结果）转换为像素画：先缩小，然后可选减色。",
		"tool.photo.max_side": "目标尺寸（最长边, px）",
		"tool.photo.palette": "调色板",
		"tool.photo.palette_auto": "减色（自动）",
		"tool.photo.palette_none": "保留原始颜色",

		// Fork additions: Sprite Sheet tool
		"tool.sheet.open": "精灵表",
		"tool.sheet.mode": "模式",
		"tool.sheet.mode_slice": "将精灵表切分为帧",
		"tool.sheet.mode_pack": "将图片打包为图集",
		"tool.sheet.source": "源图像",
		"tool.sheet.source_result": "处理结果",
		"tool.sheet.source_original": "原图",
		"tool.sheet.slice_by": "切分方式",
		"tool.sheet.by_grid": "列数 x 行数",
		"tool.sheet.by_cell": "单元格尺寸 (px)",
		"tool.sheet.columns": "列数",
		"tool.sheet.rows": "行数",
		"tool.sheet.cell_width": "单元格宽度",
		"tool.sheet.cell_height": "单元格高度",
		"tool.sheet.pack_columns": "列数（0 = 自动）",
		"tool.sheet.padding": "间距 (px)",
		"tool.sheet.pack_note": "打包列表中的所有图片（如有处理结果则使用处理结果）。",
		"tool.sheet.add_frames": "将帧添加到图片列表",
		"tool.sheet.download_frames": "下载帧 (ZIP)",
		"tool.sheet.add_atlas": "将图集添加到图片列表",
		"tool.sheet.download_atlas": "下载图集 + JSON",

		// Fork additions: Palette / Recolor tool
		"tool.palette.open": "调色板 / 重新上色",
		"tool.palette.recolor": "重新上色",
		"tool.palette.recolor_hint": "为任意色块选择新颜色",
		"tool.palette.extract": "从图片提取",
		"tool.palette.apply": "应用重新上色",
		"tool.palette.reset": "重置",
		"tool.palette.map_file": "映射到调色板文件...",

		// Fork additions: tool messages
		"tool.msg.load_first": "请先加载图片。",
		"tool.msg.added_pixel": "已将像素画添加到列表。",
		"tool.msg.export_failed": "无法导出图片。",
		"tool.msg.added_frames": "已将 {count} 个帧添加到列表。",
		"tool.msg.no_images_to_pack": "没有可打包的图片。",
		"tool.msg.atlas_export_failed": "无法导出图集图片。",
		"tool.msg.added_atlas": "已将图集添加到列表。",
		"tool.msg.extract_first": "请先提取调色板。",
		"tool.msg.change_color_first": "请先至少修改一种颜色。",
		"tool.msg.recolor_applied": "已应用重新上色。可在下方添加或下载。",
		"tool.msg.no_colors_in_file": "调色板文件中未找到颜色。",
		"tool.msg.palette_read_failed": "读取调色板失败",
		"tool.msg.mapped": "已将图片映射到导入的 {count} 种颜色。",
		"tool.msg.added_recolor": "已将重新上色的图片添加到列表。",
		"tool.info.frames": "{count} 个帧（每个 {w} x {h} px）",
		"tool.info.no_frames": "无帧：网格大于图像（{w} x {h} px）。",
		"tool.info.atlas": "图集 {w} x {h} px，{count} 个帧",
		"tool.info.colors": "{count} 种颜色",
		"xt.share.copy": "复制设置链接",
		"xt.share.copied": "设置链接已复制到剪贴板。",
		"xt.share.loaded": "已从分享链接加载设置。",
		"xt.anim.open": "动画工作室",
		"xt.anim.title": "动画工作室",
		"xt.anim.import": "导入 GIF / APNG",
		"xt.anim.refine": "精修全部帧",
		"xt.anim.dedupe": "合并重复帧",
		"xt.anim.play": "播放",
		"xt.anim.pause": "暂停",
		"xt.anim.onion": "洋葱皮",
		"xt.anim.export_gif": "导出 GIF",
		"xt.anim.export_apng": "导出 APNG",
		"xt.anim.export_zip": "帧 (ZIP)",
		"xt.anim.export_sheet": "导出精灵表",
		"xt.anim.frames_info": "{count} 帧，{w} x {h} px",
		"xt.anim.refined_info": "已将 {count} 帧精修为 {w} x {h} px。",
		"xt.anim.refining": "正在精修第 {current}/{total} 帧...",
		"xt.anim.no_anim": "请先导入动画 GIF 或 APNG。",
		"xt.anim.decode_failed": "无法将该文件读取为 GIF/APNG。",
		"xt.anim.dedupe_info": "已合并 {removed} 个重复帧。",
		"xt.touchup.open": "修补",
		"xt.touchup.title": "修补编辑器",
		"xt.touchup.pencil": "铅笔",
		"xt.touchup.eraser": "橡皮擦",
		"xt.touchup.fill": "填充",
		"xt.touchup.picker": "取色",
		"xt.touchup.restore": "还原画笔",
		"xt.touchup.undo": "撤销",
		"xt.touchup.redo": "重做",
		"xt.touchup.apply": "应用到图片",
		"xt.touchup.applied": "修补已应用。",
		"xt.touchup.no_image": "请先处理一张图片。",
		"xt.touchup.restore_na": "此结果没有可用的还原来源。",
		"xt.seamless.open": "无缝检查",
		"xt.seamless.title": "无缝平铺检查",
		"xt.seamless.tolerance": "容差",
		"xt.seamless.ok": "完美平铺:两个方向的边缘均匹配。",
		"xt.seamless.info": "水平接缝:{h} 行不匹配。垂直接缝:{v} 列不匹配。",
		"xt.heatmap.open": "图块热图",
		"xt.heatmap.tile_size": "图块大小",
		"xt.heatmap.max": "最大颜色数",
		"xt.heatmap.none": "所有图块都在颜色预算内。",
		"xt.heatmap.info": "{tiles} 个图块中有 {violations} 个超过 {max} 色。",
		"xt.clean_stray": "清理杂散像素",
		"xt.clean_stray.tip": "处理后移除孤立的单个像素，并为周围一致的单独噪点重新上色。\n\n针对抗锯齿残留和背景移除残渣的保守清理。",
		"xt.tile.title": "图块颜色限制",
		"xt.tile.tip": "像复古硬件那样限制每个 NxN 图块可用的颜色数。\n\n超出的颜色会映射到图块内最接近的保留色。可用图块热图工具查看违规位置。",
		"xt.tile.off": "关闭",
		"xt.tile.max": "每图块最大颜色数",
		"xt.pal.library": "调色板库",
		"xt.pal.apply": "应用到图片",
		"xt.pal.set_fixed": "设为固定调色板",
		"xt.pal.applied": "已应用调色板:{name}。",
		"xt.pal.fixed_set": "已设置固定调色板:{name}({count} 色)。",
		"xt.pal.ramps_title": "色阶与合并",
		"xt.pal.ramps": "整理色阶",
		"xt.pal.merge": "合并相似色",
		"xt.pal.merge_threshold": "阈值",
		"xt.pal.merges_applied": "已合并 {count} 组相似颜色。",
		"xt.pal.no_merges": "没有足够接近可合并的颜色。",
		"xt.pal.no_image": "请先处理或选择一张图片。",
		"xt.pal.ramp_neutral": "中性色",
		"xt.atlas.format": "元数据格式",
	},
	en: {
		// UI Headings & Labels
		"app.title": "Pixel Refiner | AI Pixel Art Optimizer & Background Remover",
		"app.description":
			'Optimize AI-generated pixel art into <span class="text-highlight">high-quality assets</span> and <span class="text-highlight">icons</span>.<br />' +
			'Complete <span class="text-highlight">anti-aliasing removal</span> and <span class="text-highlight">background transparency</span> in seconds.',
		"section.input": "Input Image",
		"section.result": "Result",
		"section.palette": "Palette",
		"ui.process_btn": "Process Image",
		"ui.images": "Images",
		"ui.auto_process": "Auto",
		"ui.download_btn": "Download",
		"ui.export_gpl": "Export .GPL",
		"ui.export_png": "Export .PNG",
		"ui.import_palette": "Import Palette",
		"ui.show_palette": "Show Palette",
		"ui.clear_all": "Clear All",
		"ui.download_all": "Download All",
		"ui.download_all_zip": "Download All (ZIP)",
		"ui.pixel_size": "Pixel Size",
		"ui.select_size_title": "Select size to change",
		"ui.select_size_note":
			"*Estimated values. The grid will be re-evaluated based on your selection.",
		"ui.change_to_this_size": "Change to this size",
		"ui.remove_image": "Remove Image",
		"ui.confirm_clear_all": "Are you sure you want to clear all images?",
		"ui.size": "Size",
		"ui.view_single": "Single",
		"ui.view_compare": "Compare",
		"ui.compare_before_original": "Original",
		"ui.compare_before_sanitized": "Sanitized",
		"ui.placeholder.input":
			'Drag & drop images here<br /><span class="drop-subtext">or Click to select<br />(Multiple allowed)</span>',
		"ui.placeholder.result": "Processed result will appear here",
		"ui.close": "Close",
		"ui.download_options": "Select download options",

		// Settings
		"setting.color_reduction": "Color Reduction",
		"setting.color_mode": "Reduction Mode",
		"setting.color_count": "Color Count",
		"setting.dither_mode": "Dithering",
		"setting.dither_strength": "Dither Strength (%)",
		"setting.advanced": "Advanced Settings",
		"setting.grid_detection": "Grid Detection",
		"setting.grid_mode": "Grid Detection Mode",
		"setting.quant_step": "Quantization Step",
		"setting.sample_window": "Sample Window",
		"setting.force_width": "Force Width (px)",
		"setting.force_height": "Force Height (px)",
		"setting.fast_mode": "Fast Mode",
		"setting.make_square": "Make Square",
		"setting.keep_aspect_ratio": "Keep Aspect Ratio",
		"setting.bg_removal": "Background Removal",
		"setting.bg_method": "Extraction Method",
		"setting.bg_rgb": "Background Color (RGB)",
		"setting.bg_tolerance": "Color Tolerance",
		"setting.pre_remove": "Pre-process Transparency",
		"setting.post_remove": "Post-process Transparency",
		"setting.bg_removal_scope": "Background Removal Scope",
		"setting.bg_connectivity": "Connectivity",

		"setting.floating_max": "Max Noise Size (%)",
		"setting.trimming": "Trimming",
		"setting.auto_trim": "Auto Trim",
		"setting.outline": "Outline",
		"setting.outline_style": "Style",
		"setting.outline_color": "Color",
		"setting.processing": "Processing",
		"setting.auto_process": "Auto Process",
		"section.presets": "Presets",
		"ui.preset_name": "Preset Name",
		"ui.save_preset": "Save",
		"ui.load_preset": "Load",
		"ui.delete_preset": "Delete",
		"ui.confirm_delete_preset": "Are you sure you want to delete this preset?",
		"ui.confirm_overwrite_preset":
			"A preset with this name already exists. Do you want to overwrite it?",
		"ui.preset_loaded": 'Preset "{name}" loaded',
		"ui.preset_saved": 'Preset "{name}" saved',
		"tooltip.help.auto_process":
			"Automatically runs processing when settings are changed.\n\nTurn OFF if you prefer to manually click the Process button.",

		// Tooltips
		"tooltip.help.color_mode":
			"Limits the number of colors in the output.\n\nUseful for achieving a classic pixel art look.\nNone: No color reduction.\nGame Boy / PICO-8 / NES: Uses specific console palettes.\nCustom Count: Automatically reduces to the specified number of colors.\nFixed / Custom Palette: Maps colors to a palette file you import.",
		"tooltip.help.color_count":
			"Specifies the maximum number of colors in the output.\n\nRange: {min} to {max} (Default: {default})",
		"tooltip.help.dither_strength":
			"Applies dithering (error diffusion) during color reduction.\n\n100%: Full error diffusion.\n0%: No dithering (None).\n\nAllows for smoother gradients with fewer colors, but introduces characteristic pixel noise.\n\nRange: {min} to {max} (Default: {default})",
		"tooltip.help.grid_mode":
			"Switches the grid detection behavior.\n\nAuto: Automatically detects the grid (default).\nPixel + Auto: Uses the specified pixel size as a hint and starts fine search near it.\nPixel Only: Forces conversion to the specified size (no auto detection).\nOff: Skips grid detection and reduction (useful for 1:1 pixel art).",
		"tooltip.help.quant_step":
			"Sets the color reduction level for grid detection.\n\nHigh: Colors are grouped, making it resistant to noise, but subtle color differences may be lost.\nLow: Picks up fine color boundaries, but increases the risk of false noise detection.\n\nRange: {min} to {max} (Default: {default})",
		"tooltip.help.sample_window":
			"The reference range (in pixels) used when determining the color of each dot.\n\nHigh: Noise is removed and colors become stable, but fine details may be lost.\nLow: Faithfully reproduces the original image, but is more affected by misalignment and noise.\n\nRange: {min} to {max} (Default: {default})",
		"tooltip.help.force_width":
			"Specified pixel width.\n\nPixel + Auto: Uses this as a hint and starts fine search near it.\nPixel Only: Forces conversion to this size.\n\nRange: 1 to 1024 (Default: Auto)",
		"tooltip.help.force_height":
			"Specified pixel height.\n\nPixel + Auto: Uses this as a hint and starts fine search near it.\nPixel Only: Forces conversion to this size.\n\nRange: 1 to 1024 (Default: Auto)",
		"tooltip.help.fast_mode":
			"When ON, uses an efficient algorithm to speed up the search.\nWhen OFF, performs a more comprehensive and precise search.\n\nIf automatic detection results are misaligned or the image has a lot of noise/fine patterns, turning this OFF may improve accuracy.",
		"tooltip.help.bg_method":
			"Select where to extract the background color from.\n\nNone: No background removal.\nCorners: Uses the pixel at the specified corner as the background color.\nRGB: Uses the specified color as the background color.",
		"tooltip.help.bg_rgb":
			"Specify the color to be treated as the background in hex format (e.g., #ffffff).\nWhen a corner is specified, the color is automatically set. You can also pick a color from the image using the eyedropper button.",
		"tooltip.help.bg_tolerance":
			"The similarity (error range) for determining the background color.\n\nHigh: Can remove background even if colors are slightly distorted by compression noise, but may also remove intended colors.\nLow: Strictly removes only the exact background color, but noise may remain.\n\nRange: {min} to {max} (Default: {default})",
		"tooltip.help.pre_remove":
			"Ignores the background color BEFORE performing grid detection.\n\nBenefit: Makes it easier to correctly detect the grid for the main subject even in images with large margins.\nNote: If the background color exists within the character, detection accuracy may decrease.",
		"tooltip.help.post_remove":
			"Replaces the background color with transparency AFTER processing is complete.\n\nBenefit: Allows saving as a PNG with a transparent background.\nNote: Does not affect the grid detection process itself.",
		"tooltip.help.bg_removal_scope":
			"Range of background to make transparent.\n\nSelected only: Only background connected from the chosen corner.\nOuter all: All background connected to the image border.\nAll: Outer + inner holes (e.g. donut hole).",
		"tooltip.help.bg_connectivity":
			"Whether diagonal neighbors are considered connected.\n\n4-way: Strict (no diagonals).\n8-way: Includes diagonals.",
		"tooltip.help.floating_max":
			"The maximum area (as a percentage of the total pixels in the original image) to be considered for removal as floating noise.\nWhen set to 0%, floating noise removal is skipped.\nExample: 1% → (Width × Height × 0.01) px\n\nRange: {min} to {max} (Default: {default})",
		"tooltip.help.auto_trim":
			"Automatically trims the output to fit the range containing the content.\n\nUseful for correctly detecting the number of vertical and horizontal cells in images with large margins (background).",
		"tooltip.help.make_square":
			"Pads the image with transparent pixels to make it perfectly square.\n\nThe original content is placed in the center.",
		"tooltip.help.keep_aspect_ratio":
			"Pads the trimmed output with transparent pixels to preserve the original image's aspect ratio.\n\nUseful for maintaining sprite canvas proportions after trimming.",

		// Select Options
		"option.none": "None",
		"option.mono": "Monochrome",
		"option.gb_legacy": "Game Boy (Original)",
		"option.gb_pocket": "Game Boy (Pocket)",
		"option.gb_light": "Game Boy (Light)",
		"option.pico8": "PICO-8",
		"option.nes": "NES",
		"option.pc98": "PC-9801",
		"option.msx": "MSX1",
		"option.c64": "Commodore 64",
		"option.arne16": "Arne 16",
		"option.sfc_sprite": "SFC Style (16 colors/Sprite)",
		"option.sfc_bg": "SFC Style (256 colors/BG)",
		"option.auto": "Custom Count",
		"option.fixed": "Fixed / Custom Palette",
		"option.dither_none": "None",
		"option.dither_floyd": "Floyd-Steinberg",
		"option.dither_bayer2": "Bayer 2x2",
		"option.dither_bayer4": "Bayer 4x4",
		"option.dither_bayer8": "Bayer 8x8",
		"option.dither_ordered": "Ordered",
		"option.outline_none": "None",
		"option.outline_rounded": "Rounded (8-way)",
		"option.outline_sharp": "Sharp (4-way)",
		"option.grid_mode_auto": "Auto (Default)",
		"option.grid_mode_hint": "Pixel + Auto",
		"option.grid_mode_force": "Pixel Only",
		"option.grid_mode_off": "Off",
		"option.bg_none": "None",
		"option.bg_scope_selected": "Selected corner only",
		"option.bg_scope_outer": "Outer (border-connected)",
		"option.bg_scope_all": "Outer + inner holes",
		"option.bg_connectivity_4": "4-way (no diagonals)",
		"option.bg_connectivity_8": "8-way (with diagonals)",
		"option.bg_top_left": "Top-Left (Default)",
		"option.bg_bottom_left": "Bottom-Left",
		"option.bg_top_right": "Top-Right",
		"option.bg_bottom_right": "Bottom-Right",
		"option.bg_rgb": "RGB Specification",

		// JS Messages
		"error.no_image": "Please select an image first.",
		"error.process_failed": "Processing failed",
		"error.load_failed": "Loading failed",
		"info.grid_updated": "Grid updated to {w}x{h}",

		"error.palette_limit":
			"Warning: The image contains {count} colors. Palette will be limited to 256 colors.",
		"error.no_processed_images": "No processed images available to download.",
		"error.download_failed": "Download failed",
		"status.processing": "Processing...",
		"status.processing_batch": "Batch Processing... ({current}/{total})",

		// Attributes & Titles
		"attr.title.bg_checkered": "Background: Checkered",
		"attr.title.bg_white": "Background: White",
		"attr.title.bg_black": "Background: Black",
		"attr.title.bg_green": "Background: Green",
		"attr.title.grid_toggle": "Show Grid (Zoom only)",
		"attr.title.zoom_toggle": "Zoom Output",
		"attr.title.eyedropper": "Pick color from image",
		"attr.placeholder.auto": "Auto",

		// Modal
		"modal.eyedropper.title": "Select Background Color",
		"modal.eyedropper.instruction":
			"Click on the color in the image you want to set as background",

		// Footer
		"footer.privacy": "Images are processed safely within your browser",

		// Fork additions: settings
		"setting.keep_largest_object": "Keep Main Object",
		"tooltip.help.keep_largest_object":
			"Keeps only the largest connected shape (the main subject) and clears stray background remnants and floating bits.\n\nProtects the main object while cleaning up the background.\n\nTurn this OFF when processing sheets that contain multiple separate sprites.",
		"setting.lock_aspect_ratio": "Lock Aspect Ratio (no distortion)",
		"tooltip.help.lock_aspect_ratio":
			"Forces square pixels so the pixel grid never stretches or squashes the image.\n\nA square input stays square and the subject keeps its proportions.",
		"section.tools": "Tools",

		// Fork additions: common tool UI
		"tool.add_to_images": "Add to Images",
		"tool.download_png": "Download PNG",
		"ui.copied": "Copied!",
		"error.unsupported_file":
			"Unsupported file type. Please choose an image file.",
		"info.import_palette_first":
			"Fixed / Custom Palette: import a palette file to apply it.",

		// Fork additions: Photo -> Pixel Art tool
		"tool.photo.open": "Photo -> Pixel Art",
		"tool.photo.instruction":
			"Turns the current image (the original, not the processed result) into pixel art: downscale, then optionally reduce colors.",
		"tool.photo.max_side": "Target size (longest side, px)",
		"tool.photo.palette": "Palette",
		"tool.photo.palette_auto": "Reduce colors (auto)",
		"tool.photo.palette_none": "Keep original colors",

		// Fork additions: Sprite Sheet tool
		"tool.sheet.open": "Sprite Sheet",
		"tool.sheet.mode": "Mode",
		"tool.sheet.mode_slice": "Slice sheet into frames",
		"tool.sheet.mode_pack": "Pack images into atlas",
		"tool.sheet.source": "Source",
		"tool.sheet.source_result": "Processed result",
		"tool.sheet.source_original": "Original image",
		"tool.sheet.slice_by": "Slice by",
		"tool.sheet.by_grid": "Columns x Rows",
		"tool.sheet.by_cell": "Cell size (px)",
		"tool.sheet.columns": "Columns",
		"tool.sheet.rows": "Rows",
		"tool.sheet.cell_width": "Cell width",
		"tool.sheet.cell_height": "Cell height",
		"tool.sheet.pack_columns": "Columns (0 = auto)",
		"tool.sheet.padding": "Padding (px)",
		"tool.sheet.pack_note":
			"Packs every image in the list (uses the processed result when available).",
		"tool.sheet.add_frames": "Add frames to Images",
		"tool.sheet.download_frames": "Download frames (ZIP)",
		"tool.sheet.add_atlas": "Add atlas to Images",
		"tool.sheet.download_atlas": "Download atlas + JSON",

		// Fork additions: Palette / Recolor tool
		"tool.palette.open": "Palette / Recolor",
		"tool.palette.recolor": "Recolor",
		"tool.palette.recolor_hint": "Pick a new color for any swatch",
		"tool.palette.extract": "Extract from image",
		"tool.palette.apply": "Apply recolor",
		"tool.palette.reset": "Reset",
		"tool.palette.map_file": "Map image to palette file...",

		// Fork additions: tool messages
		"tool.msg.load_first": "Load an image first.",
		"tool.msg.added_pixel": "Added pixel-art image to the list.",
		"tool.msg.export_failed": "Could not export the image.",
		"tool.msg.added_frames": "Added {count} frames to the list.",
		"tool.msg.no_images_to_pack": "No images to pack.",
		"tool.msg.atlas_export_failed": "Could not export the atlas image.",
		"tool.msg.added_atlas": "Added packed atlas to the list.",
		"tool.msg.extract_first": "Extract a palette first.",
		"tool.msg.change_color_first": "Change at least one color first.",
		"tool.msg.recolor_applied": "Recolor applied. Add or download below.",
		"tool.msg.no_colors_in_file": "No colors found in that palette file.",
		"tool.msg.palette_read_failed": "Failed to read palette",
		"tool.msg.mapped": "Mapped image to {count} imported colors.",
		"tool.msg.added_recolor": "Added recolored image to the list.",
		"tool.info.frames": "{count} frames ({w} x {h} px each)",
		"tool.info.no_frames":
			"No frames: the grid is larger than the image ({w} x {h} px).",
		"tool.info.atlas": "Atlas {w} x {h} px, {count} frames",
		"tool.info.colors": "{count} colors",
		"xt.share.copy": "Copy Settings Link",
		"xt.share.copied": "Settings link copied to clipboard.",
		"xt.share.loaded": "Settings loaded from the shared link.",
		"xt.anim.open": "Animation Studio",
		"xt.anim.title": "Animation Studio",
		"xt.anim.import": "Import GIF / APNG",
		"xt.anim.refine": "Refine Frames",
		"xt.anim.dedupe": "Remove Duplicate Frames",
		"xt.anim.play": "Play",
		"xt.anim.pause": "Pause",
		"xt.anim.onion": "Onion Skin",
		"xt.anim.export_gif": "Export GIF",
		"xt.anim.export_apng": "Export APNG",
		"xt.anim.export_zip": "Frames (ZIP)",
		"xt.anim.export_sheet": "Export Sheet",
		"xt.anim.frames_info": "{count} frames, {w} x {h} px",
		"xt.anim.refined_info": "Refined {count} frames to {w} x {h} px.",
		"xt.anim.refining": "Refining frame {current}/{total}...",
		"xt.anim.no_anim": "Import an animated GIF or APNG first.",
		"xt.anim.decode_failed": "Could not read that file as GIF/APNG.",
		"xt.anim.dedupe_info": "{removed} duplicate frames merged.",
		"xt.touchup.open": "Touch-up",
		"xt.touchup.title": "Touch-up Editor",
		"xt.touchup.pencil": "Pencil",
		"xt.touchup.eraser": "Eraser",
		"xt.touchup.fill": "Fill",
		"xt.touchup.picker": "Pick Color",
		"xt.touchup.restore": "Restore",
		"xt.touchup.undo": "Undo",
		"xt.touchup.redo": "Redo",
		"xt.touchup.apply": "Apply to Image",
		"xt.touchup.applied": "Touch-up applied.",
		"xt.touchup.no_image": "Process an image first.",
		"xt.touchup.restore_na": "Restore source unavailable for this result.",
		"xt.seamless.open": "Seamless Check",
		"xt.seamless.title": "Seamless Tile Check",
		"xt.seamless.tolerance": "Tolerance",
		"xt.seamless.ok": "Perfectly tileable: edges match in both directions.",
		"xt.seamless.info": "Horizontal seams: {h} mismatching rows. Vertical seams: {v} mismatching columns.",
		"xt.heatmap.open": "Tile Heatmap",
		"xt.heatmap.tile_size": "Tile Size",
		"xt.heatmap.max": "Max Colors",
		"xt.heatmap.none": "All tiles are within the color budget.",
		"xt.heatmap.info": "{violations} of {tiles} tiles exceed {max} colors.",
		"xt.clean_stray": "Clean Stray Pixels",
		"xt.clean_stray.tip": "Removes isolated single pixels and recolors lone speckles after processing.\n\nA conservative cleanup for AA leftovers and background-removal residue.",
		"xt.tile.title": "Tile Color Limit",
		"xt.tile.tip": "Caps how many distinct colors each NxN tile may use, like retro hardware limits.\n\nExtra colors are remapped to the tile's closest surviving colors. Use the Tile Heatmap tool to inspect violations.",
		"xt.tile.off": "Off",
		"xt.tile.max": "Max Colors / Tile",
		"xt.pal.library": "Palette Library",
		"xt.pal.apply": "Apply to Image",
		"xt.pal.set_fixed": "Use as Fixed Palette",
		"xt.pal.applied": "Palette applied: {name}.",
		"xt.pal.fixed_set": "Fixed palette set: {name} ({count} colors).",
		"xt.pal.ramps_title": "Ramps & Merge",
		"xt.pal.ramps": "Organize Ramps",
		"xt.pal.merge": "Merge Similar",
		"xt.pal.merge_threshold": "Threshold",
		"xt.pal.merges_applied": "Merged {count} similar color pairs.",
		"xt.pal.no_merges": "No colors close enough to merge.",
		"xt.pal.no_image": "Process or select an image first.",
		"xt.pal.ramp_neutral": "Neutrals",
		"xt.atlas.format": "Metadata Format",
	},
};

type ResourceKey = keyof (typeof resources)["en"];

/** Test-only export: lets tests verify key parity across languages. */
export const _resources = resources;

export class I18nManager {
	currentLang: Language = "en";

	constructor() {
		// Handle environment where localStorage might be missing (e.g. Vitest/Node)
		let saved: string | null = null;
		try {
			if (typeof localStorage !== "undefined") {
				saved = localStorage.getItem("pixel-refiner-lang");
			}
		} catch (_e) {
			// Ignore security errors or missing localStorage
		}

		this.currentLang = isLanguage(saved) ? saved : detectBrowserLanguage();
	}

	setLanguage(lang: Language) {
		this.currentLang = lang;
		try {
			if (typeof localStorage !== "undefined") {
				localStorage.setItem("pixel-refiner-lang", lang);
			}
		} catch (_e) {
			// Ignore
		}
		this.updatePage();
	}

	// キーからテキストを取得
	t(key: ResourceKey, params?: Record<string, string | number>): string {
		const text = resources[this.currentLang][key] || key;
		if (params) {
			let interpolated = text;
			for (const [k, v] of Object.entries(params)) {
				interpolated = interpolated.replace(
					new RegExp(`\\{${k}\\}`, "g"),
					String(v),
				);
			}
			return interpolated;
		}
		return text;
	}

	// ページ全体の更新
	updatePage() {
		if (typeof document === "undefined") return;

		// 1. テキストコンテンツの更新 (innerHTML を使用してタグを維持)
		document.querySelectorAll("[data-i18n]").forEach((el) => {
			const key = el.getAttribute("data-i18n") as ResourceKey;
			if (key) {
				const text = this.t(key);
				if (el.hasAttribute("data-i18n-html")) {
					el.innerHTML = text;
				} else {
					el.textContent = text;
				}
			}
		});

		// 2. 属性の更新 (placeholder, titleなど)
		document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
			const config = el.getAttribute("data-i18n-attr");
			if (!config) return;

			for (const pair of config.split(",")) {
				const [attr, key] = pair.split(":");
				el.setAttribute(attr, this.t(key as ResourceKey));
			}
		});

		// htmlタグのlang属性更新
		document.documentElement.lang = this.currentLang;

		// 言語切り替えボタンのアクティブ状態更新
		document.querySelectorAll("[data-lang-btn]").forEach((el) => {
			const lang = el.getAttribute("data-lang-btn");
			el.classList.toggle("active", lang === this.currentLang);
		});
	}
}

export const i18n = new I18nManager();
