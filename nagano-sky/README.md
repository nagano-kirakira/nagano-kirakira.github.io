# nagano-sky PNG button title fix

## ベース
`nagano-sky-export-print-buttons-fix.zip`

## 修正内容
- 印刷ボタンはいったん非表示にしました。
- PNG保存ボタンを、タイトルと星図の間ではなく、タイトルパネル右下に移動しました。
- PNG保存機能、html2canvas読み込み、共通キャプチャ処理は維持しています。
- PNG化時・印刷時は `.skyActionBar` を非表示にする既存方針を維持しています。

## 変更ファイル
- `index.html`
- `style.css`

`app.js` のPNG保存処理・印刷処理本体は変更していません。
