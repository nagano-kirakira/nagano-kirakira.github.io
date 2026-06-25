# nagano-sky PNG button PC-only fix

## ベース
`nagano-sky-png-button-title-fix.zip`

## 修正内容
- PNG保存ボタンをPC版のみ表示に変更しました。
- スマホ・タブレット幅では `.skyActionBar` を非表示にしました。
- 既存のスマホ幅でボタンを中央表示するCSSを削除しました。
- 印刷ボタンは引き続き非表示です。

## 判定
- `max-width: 1024px` 以下ではPNG保存ボタンを非表示
- PC幅ではタイトルパネル右下にPNG保存ボタンを表示

## 変更ファイル
- `style.css`
