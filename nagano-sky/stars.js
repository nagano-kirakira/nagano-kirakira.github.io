/*
  stars.js
  長野市20時の星空ページ用データ v5
*/

const SKY_STARS = [
  { id:"betelgeuse", name:"ベテルギウス", ra:5.9195, dec:7.4071, mag:0.5 },
  { id:"rigel", name:"リゲル", ra:5.2423, dec:-8.2016, mag:0.1 },
  { id:"bellatrix", name:"ベラトリックス", ra:5.4189, dec:6.3497, mag:1.6 },
  { id:"saiph", name:"サイフ", ra:5.7959, dec:-9.6696, mag:2.1 },
  { id:"alnitak", name:"アルニタク", ra:5.6793, dec:-1.9426, mag:1.8 },
  { id:"alnilam", name:"アルニラム", ra:5.6036, dec:-1.2019, mag:1.7 },
  { id:"mintaka", name:"ミンタカ", ra:5.5334, dec:-0.2991, mag:2.2 },
  { id:"meissa", name:"メイサ", ra:5.5856, dec:9.9342, mag:3.4 },
  { id:"iotaOri", name:"ι Ori", ra:5.5906, dec:-5.9099, mag:2.8 },

  { id:"sirius", name:"シリウス", ra:6.7525, dec:-16.7161, mag:-1.46 },
  { id:"mirzam", name:"ミルザム", ra:6.3783, dec:-17.9559, mag:2.0 },
  { id:"adhara", name:"アダーラ", ra:6.9771, dec:-28.9721, mag:1.5 },
  { id:"wezen", name:"ウェズン", ra:7.1399, dec:-26.3932, mag:1.8 },
  { id:"aludra", name:"アルドラ", ra:7.4016, dec:-29.3031, mag:2.5 },
  { id:"furud", name:"フルド", ra:6.3386, dec:-30.0634, mag:3.0 },
  { id:"procyon", name:"プロキオン", ra:7.6550, dec:5.2250, mag:0.4 },
  { id:"gomeisa", name:"ゴメイサ", ra:7.4525, dec:8.2893, mag:2.9 },

  { id:"aldebaran", name:"アルデバラン", ra:4.5987, dec:16.5093, mag:0.9 },
  { id:"elnath", name:"エルナト", ra:5.4382, dec:28.6075, mag:1.7 },
  { id:"zetaTau", name:"ζ Tau", ra:5.6274, dec:21.1426, mag:3.0 },
  { id:"thetaTau", name:"θ Tau", ra:4.4777, dec:15.8709, mag:3.4 },
  { id:"capella", name:"カペラ", ra:5.2782, dec:45.9980, mag:0.1 },
  { id:"menkalinan", name:"メンカリナン", ra:5.9921, dec:44.9474, mag:1.9 },
  { id:"mahassim", name:"マハシム", ra:5.9953, dec:37.2126, mag:2.7 },
  { id:"hassaleh", name:"ハッサレ", ra:4.9499, dec:33.1661, mag:2.7 },
  { id:"castor", name:"カストル", ra:7.5767, dec:31.8883, mag:1.6 },
  { id:"pollux", name:"ポルックス", ra:7.7553, dec:28.0262, mag:1.1 },
  { id:"alhena", name:"アルヘナ", ra:6.6285, dec:16.3993, mag:1.9 },
  { id:"wasat", name:"ワサト", ra:7.3354, dec:21.9823, mag:3.5 },
  { id:"mekbuda", name:"メクブダ", ra:7.0685, dec:20.5703, mag:3.8 },

  { id:"regulus", name:"レグルス", ra:10.1395, dec:11.9672, mag:1.4 },
  { id:"denebola", name:"デネボラ", ra:11.8177, dec:14.5721, mag:2.1 },
  { id:"algieba", name:"アルギエバ", ra:10.3329, dec:19.8415, mag:2.0 },
  { id:"zosma", name:"ゾズマ", ra:11.2351, dec:20.5237, mag:2.6 },
  { id:"chertan", name:"シェルタン", ra:11.2373, dec:15.4298, mag:3.3 },
  { id:"spica", name:"スピカ", ra:13.4199, dec:-11.1614, mag:1.0 },
  { id:"porrima", name:"ポリマ", ra:12.6943, dec:-1.4494, mag:2.7 },
  { id:"vindemiatrix", name:"ヴィンデミアトリックス", ra:13.0363, dec:10.9591, mag:2.8 },
  { id:"arcturus", name:"アークトゥルス", ra:14.2610, dec:19.1824, mag:-0.05 },
  { id:"izars", name:"イザール", ra:14.7498, dec:27.0742, mag:2.4 },
  { id:"muphrid", name:"ムフリッド", ra:13.9114, dec:18.3977, mag:2.7 },

  { id:"vega", name:"ベガ", ra:18.6156, dec:38.7837, mag:0.0 },
  { id:"altair", name:"アルタイル", ra:19.8464, dec:8.8683, mag:0.8 },
  { id:"deneb", name:"デネブ", ra:20.6905, dec:45.2803, mag:1.3 },
  { id:"sadr", name:"サドル", ra:20.3705, dec:40.2567, mag:2.2 },
  { id:"gienahCyg", name:"ギェナー", ra:20.7702, dec:33.9703, mag:2.5 },
  { id:"albireo", name:"アルビレオ", ra:19.5120, dec:27.9597, mag:3.1 },
  { id:"tarazed", name:"タラゼド", ra:19.7709, dec:10.6133, mag:2.7 },
  { id:"alshain", name:"アルシャイン", ra:19.9219, dec:6.4068, mag:3.7 },
  { id:"sulafat", name:"スラファト", ra:18.9824, dec:32.6896, mag:3.3 },
  { id:"sheliak", name:"シェリアク", ra:18.8347, dec:33.3627, mag:3.5 },

  { id:"alpheratz", name:"アルフェラッツ", ra:0.1398, dec:29.0904, mag:2.1 },
  { id:"scheat", name:"シェアト", ra:23.0629, dec:28.0828, mag:2.4 },
  { id:"markab", name:"マルカブ", ra:23.0793, dec:15.2053, mag:2.5 },
  { id:"algenib", name:"アルゲニブ", ra:0.2206, dec:15.1836, mag:2.8 },
  { id:"mirach", name:"ミラク", ra:1.1622, dec:35.6206, mag:2.1 },
  { id:"almach", name:"アルマク", ra:2.0649, dec:42.3297, mag:2.1 },
  { id:"algol", name:"アルゴル", ra:3.1361, dec:40.9556, mag:2.1 },
  { id:"mirfak", name:"ミルファク", ra:3.4054, dec:49.8612, mag:1.8 },
  { id:"deltaPer", name:"δ Per", ra:3.7154, dec:47.7876, mag:3.0 },

  { id:"polaris", name:"北極星", ra:2.5303, dec:89.2641, mag:2.0 },
  { id:"schedar", name:"シェダル", ra:0.6751, dec:56.5373, mag:2.2 },
  { id:"caph", name:"カフ", ra:0.1529, dec:59.1498, mag:2.3 },
  { id:"gammaCas", name:"ツィー", ra:0.9451, dec:60.7167, mag:2.5 },
  { id:"ruchbah", name:"ルクバー", ra:1.4303, dec:60.2353, mag:2.7 },
  { id:"segin", name:"セギン", ra:1.9066, dec:63.6701, mag:3.4 },

  { id:"dubhe", name:"ドゥーベ", ra:11.0621, dec:61.7510, mag:1.8 },
  { id:"merak", name:"メラク", ra:11.0307, dec:56.3824, mag:2.3 },
  { id:"phecda", name:"フェクダ", ra:11.8972, dec:53.6948, mag:2.4 },
  { id:"megrez", name:"メグレズ", ra:12.2571, dec:57.0326, mag:3.3 },
  { id:"alioth", name:"アリオト", ra:12.9005, dec:55.9598, mag:1.8 },
  { id:"mizar", name:"ミザール", ra:13.3988, dec:54.9254, mag:2.2 },
  { id:"alkaid", name:"アルカイド", ra:13.7923, dec:49.3133, mag:1.9 },

  { id:"fomalhaut", name:"フォーマルハウト", ra:22.9608, dec:-29.6222, mag:1.2 },
  { id:"antares", name:"アンタレス", ra:16.4901, dec:-26.4320, mag:1.0 },
  { id:"shaula", name:"シャウラ", ra:17.5601, dec:-37.1038, mag:1.6 },
  { id:"sargas", name:"サルガス", ra:17.6219, dec:-42.9978, mag:1.9 },
  { id:"rasalhague", name:"ラス・アルハゲ", ra:17.5822, dec:12.5600, mag:2.1 },
  { id:"sabik", name:"サビク", ra:17.1729, dec:-15.7249, mag:2.4 },
  { id:"eltanin", name:"エルタニン", ra:17.9434, dec:51.4889, mag:2.2 },
  { id:"rastaban", name:"ラスタバン", ra:17.5072, dec:52.3014, mag:2.8 },
  { id:"kochab", name:"コカブ", ra:14.8451, dec:74.1555, mag:2.1 },
  { id:"pherkad", name:"フェルカド", ra:15.3455, dec:71.8340, mag:3.0 },
  { id:"hamal", name:"ハマル", ra:2.1196, dec:23.4624, mag:2.0 },
  { id:"sheratan", name:"シェラタン", ra:1.9107, dec:20.8080, mag:2.6 },
  { id:"diphda", name:"ディフダ", ra:0.7265, dec:-17.9866, mag:2.0 },
  { id:"menkar", name:"メンカル", ra:3.0379, dec:4.0897, mag:2.5 },
  { id:"alphard", name:"アルファルド", ra:9.4598, dec:-8.6586, mag:2.0 },
  { id:"rasalgethi", name:"ラス・アルゲティ", ra:17.2441, dec:14.3903, mag:3.1 },
  { id:"nunki", name:"ヌンキ", ra:18.9211, dec:-26.2967, mag:2.0 },
  { id:"kausAust", name:"カウス・アウストラリス", ra:18.4029, dec:-34.3846, mag:1.8 },
  { id:"enif", name:"エニフ", ra:21.7364, dec:9.8750, mag:2.4 },
  { id:"sadalmelik", name:"サダルメリク", ra:22.0964, dec:-0.3199, mag:3.0 },
  { id:"sadalsuud", name:"サダルスウド", ra:21.5260, dec:-5.5712, mag:2.9 },

  // Additional stars for more accurate constellation lines v6
  { id:"adhafera", name:"アダフェラ", ra:10.2782, dec:23.4173, mag:3.4 },
  { id:"rasElased", name:"ラス・エラセド", ra:9.7642, dec:23.7743, mag:3.0 },
  { id:"acrab", name:"アクラブ", ra:16.0906, dec:-19.8055, mag:2.6 },
  { id:"dschubba", name:"ジュバ", ra:16.0056, dec:-22.6217, mag:2.3 },
  { id:"piSco", name:"π Sco", ra:15.9809, dec:-26.1141, mag:2.9 },
  { id:"tauSco", name:"τ Sco", ra:16.5980, dec:-28.2160, mag:2.8 },
  { id:"epsSco", name:"ε Sco", ra:16.8361, dec:-34.2933, mag:2.3 },
  { id:"lesath", name:"レサト", ra:17.5127, dec:-37.2958, mag:2.7 },
  { id:"cebalrai", name:"ケバルライ", ra:17.7245, dec:4.5673, mag:2.8 },
  { id:"yedPrior", name:"イェド・プリオル", ra:16.2391, dec:-3.6943, mag:2.7 },
  { id:"yedPosterior", name:"イェド・ポステリオル", ra:16.3054, dec:-4.6925, mag:3.2 },
  { id:"deltaCyg", name:"δ Cyg", ra:19.7496, dec:45.1308, mag:2.9 },
  { id:"etaCyg", name:"η Cyg", ra:19.9384, dec:35.0834, mag:3.9 },
];

const SKY_CONSTELLATIONS = [
  { name:"オリオン座", label:{ra:5.58, dec:-3.0}, lines:[
    ["meissa","betelgeuse"],["meissa","bellatrix"],
    ["betelgeuse","bellatrix"],["betelgeuse","alnitak"],
    ["bellatrix","mintaka"],["mintaka","alnilam"],["alnilam","alnitak"],
    ["alnitak","saiph"],["saiph","rigel"],["rigel","mintaka"],
    ["alnilam","iotaOri"]
  ]},
  { name:"おおいぬ座", label:{ra:6.8, dec:-22.5}, lines:[
    ["sirius","mirzam"],["sirius","adhara"],["adhara","wezen"],["wezen","aludra"],["sirius","furud"]
  ]},
  { name:"こいぬ座", label:{ra:7.55, dec:7.2}, lines:[["procyon","gomeisa"]] },
  { name:"おうし座", label:{ra:4.9, dec:20.5}, lines:[
    ["thetaTau","aldebaran"],["aldebaran","zetaTau"],["aldebaran","elnath"]
  ]},
  { name:"ぎょしゃ座", label:{ra:5.7, dec:42.0}, lines:[
    ["capella","menkalinan"],["menkalinan","mahassim"],["mahassim","hassaleh"],["hassaleh","capella"]
  ]},
  { name:"ふたご座", label:{ra:7.45, dec:26.0}, lines:[
    ["castor","pollux"],["castor","wasat"],["pollux","wasat"],["wasat","mekbuda"],["mekbuda","alhena"]
  ]},
  { name:"しし座", label:{ra:10.9, dec:16.5}, lines:[
    ["regulus","algieba"],["algieba","adhafera"],["adhafera","rasElased"],
    ["regulus","chertan"],["chertan","denebola"],["denebola","zosma"],["zosma","algieba"]
  ]},
  { name:"おとめ座", label:{ra:13.1, dec:-2.0}, lines:[["spica","porrima"],["porrima","vindemiatrix"]] },
  { name:"うしかい座", label:{ra:14.3, dec:23.0}, lines:[["arcturus","izars"],["arcturus","muphrid"]] },
  { name:"はくちょう座", label:{ra:20.2, dec:38.0}, lines:[
    ["deneb","sadr"],["sadr","albireo"],["sadr","gienahCyg"],["sadr","deltaCyg"],["sadr","etaCyg"]
  ]},
  { name:"こと座", label:{ra:18.8, dec:36.0}, lines:[["vega","sulafat"],["sulafat","sheliak"],["sheliak","vega"]] },
  { name:"わし座", label:{ra:19.85, dec:9.0}, lines:[["tarazed","altair"],["altair","alshain"]] },
  { name:"アンドロメダ座", label:{ra:1.25, dec:37.0}, lines:[["alpheratz","mirach"],["mirach","almach"]] },
  { name:"ペルセウス座", label:{ra:3.35, dec:45.5}, lines:[["mirfak","algol"],["mirfak","deltaPer"]] },
  { name:"カシオペヤ座", label:{ra:1.05, dec:60.5}, lines:[
    ["caph","schedar"],["schedar","gammaCas"],["gammaCas","ruchbah"],["ruchbah","segin"]
  ]},
  { name:"おおぐま座", label:{ra:12.4, dec:56.0}, lines:[
    ["dubhe","merak"],["merak","phecda"],["phecda","megrez"],["megrez","alioth"],["alioth","mizar"],["mizar","alkaid"]
  ]},
  { name:"さそり座", label:{ra:16.7, dec:-28.0}, lines:[
    ["acrab","dschubba"],["dschubba","piSco"],["piSco","antares"],
    ["antares","tauSco"],["tauSco","epsSco"],["epsSco","shaula"],["shaula","lesath"],["lesath","sargas"]
  ]},
  { name:"へびつかい座", label:{ra:17.1, dec:1.0}, lines:[
    ["rasalhague","cebalrai"],["rasalhague","yedPrior"],["yedPrior","yedPosterior"],["yedPosterior","sabik"],["sabik","cebalrai"]
  ]},
  { name:"りゅう座", label:{ra:17.7, dec:54.0}, lines:[["eltanin","rastaban"]] },
  { name:"こぐま座", label:{ra:14.6, dec:78.0}, lines:[["polaris","kochab"],["kochab","pherkad"]] },
  { name:"おひつじ座", label:{ra:2.0, dec:22.0}, lines:[["hamal","sheratan"]] }
];

const SKY_PLANET_BODIES = [
  { key:"Mercury", name:"水星", icon:"mercury" },
  { key:"Venus", name:"金星", icon:"venus" },
  { key:"Mars", name:"火星", icon:"mars" },
  { key:"Jupiter", name:"木星", icon:"jupiter" },
  { key:"Saturn", name:"土星", icon:"saturn" },
  { key:"Uranus", name:"天王星", icon:"uranus" },
  { key:"Neptune", name:"海王星", icon:"neptune" }
];

const SKY_DEEP_SKY = [
  // 春
  { name:"M44 プレセペ星団", type:"openCluster", season:"春", ra:8.6667, dec:19.6667, size:18 },
  { name:"M3 球状星団", type:"globularCluster", season:"春", ra:13.703, dec:28.377, size:12 },
  { name:"M51 子持ち銀河", type:"galaxy", season:"春", ra:13.498, dec:47.195, size:13 },
  { name:"M81 ボーデの銀河", type:"galaxy", season:"春", ra:9.926, dec:69.066, size:14 },
  { name:"M82 葉巻銀河", type:"galaxy", season:"春", ra:9.931, dec:69.679, size:12 },

  // 夏
  { name:"M13 ヘルクレス球状星団", type:"globularCluster", season:"夏", ra:16.6950, dec:36.4667, size:14 },
  { name:"M8 干潟星雲", type:"emissionNebula", season:"夏", ra:18.061, dec:-24.386, size:22 },
  { name:"M20 三裂星雲", type:"emissionNebula", season:"夏", ra:18.041, dec:-23.030, size:15 },
  { name:"M17 オメガ星雲", type:"emissionNebula", season:"夏", ra:18.346, dec:-16.176, size:16 },
  { name:"M16 わし星雲", type:"emissionNebula", season:"夏", ra:18.313, dec:-13.806, size:15 },
  { name:"M22 球状星団", type:"globularCluster", season:"夏", ra:18.607, dec:-23.904, size:16 },
  { name:"M57 リング星雲", label:"M57 リング星雲", type:"planetaryNebula", season:"夏", ra:18.894, dec:33.030, size:10 },
  { name:"M27 亜鈴状星雲", type:"planetaryNebula", season:"夏", ra:19.993, dec:22.721, size:13 },

  // 秋
  { name:"M31 アンドロメダ銀河", type:"galaxy", season:"秋", ra:0.7123, dec:41.2692, size:24 },
  { name:"二重星団", type:"doubleCluster", season:"秋", ra:2.3333, dec:57.1333, size:18 },
  { name:"M33 さんかく座銀河", type:"galaxy", season:"秋", ra:1.564, dec:30.660, size:16 },

  // 冬
  { name:"M45 プレアデス星団", type:"openClusterBlue", season:"冬", ra:3.7900, dec:24.1167, size:18 },
  { name:"M42 オリオン大星雲", type:"emissionNebula", season:"冬", ra:5.5881, dec:-5.3911, size:18 },
  { name:"M41 散開星団", type:"openCluster", season:"冬", ra:6.767, dec:-20.756, size:14 },
  { name:"M35 散開星団", type:"openCluster", season:"冬", ra:6.151, dec:24.333, size:15 }
];

const MILKY_WAY_PATH = [
  { ra: 17.6, dec: -34 }, { ra: 18.2, dec: -28 }, { ra: 18.8, dec: -20 },
  { ra: 19.3, dec: -8 }, { ra: 19.8, dec: 5 }, { ra: 20.2, dec: 18 },
  { ra: 20.7, dec: 32 }, { ra: 21.1, dec: 45 }, { ra: 22.0, dec: 56 },
  { ra: 23.3, dec: 60 }, { ra: 0.8, dec: 60 }, { ra: 2.2, dec: 56 },
  { ra: 3.4, dec: 48 }, { ra: 4.7, dec: 36 }, { ra: 5.6, dec: 22 },
  { ra: 6.4, dec: 8 }, { ra: 7.0, dec: -8 }, { ra: 7.5, dec: -20 }
];
