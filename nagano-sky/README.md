# nagano-sky Ophiuchus expanded fix v7

## ベース
`nagano-sky-ophiuchus-expanded-v6-footer-bodymatch.zip`

## 修正内容
フッターの見た目が変わっていなかったため、フッター関連の古い記述を削除したうえで再定義しました。

### 実施内容
- `style.css` から以下の古い定義を削除
  - `.skyPageFooter`
  - `.skyPageFooter p`
  - `.kirakira-sky-page .skyPageFooter`
  - `.kirakira-sky-page .skyPageFooter p`
  - `skyPageFooter` を含む旧 @media ブロック
- そのうえで、必要なフッター定義だけを末尾へ再投入
- `background / border / box-shadow` に `!important` を付与して、既存CSSの影響を受けにくく調整

### 目標
- フッター背景を body と同一の見え方にする
- 上の薄い境界線を完全に消す


## fix: PNG保存・印刷ボタン追加

### ベース
- `nagano-sky(1).zip`

### 追加内容
- タイトル部と星図部の間に `PNG保存` / `印刷` ボタンを追加
- `html2canvas@1.4.1` を読み込み
- `.kirakira-sky-page` を対象に、星空ページ本体を一枚のPNGとして生成
- キャプチャ時は `.skyActionBar` を非表示にし、ボタン自体はPNG/印刷に含めない
- 印刷ボタンは同じPNG生成処理を利用し、別ウィンドウで画像化して印刷

### 維持した内容
- 星データ、星雲星団データ、星座線、カード内容は変更なし
- 直前方針の東西反転も反映
