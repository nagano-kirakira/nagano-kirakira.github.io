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
