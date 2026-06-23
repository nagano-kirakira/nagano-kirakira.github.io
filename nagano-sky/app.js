const LOCATION = {
  name: "長野県長野市",
  latitude: 36.6486,
  longitude: 138.1948,
  elevation: 370
};

const STAR_LIMIT_MAG = 4.5;
const STAR_BY_ID = Object.fromEntries(SKY_STARS.map(star => [star.id, star]));

const canvas = document.getElementById("skyCanvas");
const ctx = canvas.getContext("2d");

let labelBoxes = [];
let labelDrawQueue = [];
let visibleConstellationNames = new Set();

function resetLabels() {
  labelBoxes = [];
  labelDrawQueue = [];
  visibleConstellationNames = new Set();
}

function getTodayAt20() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
}

function formatDate(date) {
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function gmstHours(date) {
  const jd = julianDate(date);
  const d = jd - 2451545.0;
  let gmst = 18.697374558 + 24.06570982441908 * d;
  return ((gmst % 24) + 24) % 24;
}

function equatorialToHorizontal(raHours, decDeg, date) {
  const lat = degToRad(LOCATION.latitude);
  const dec = degToRad(decDeg);
  const lst = gmstHours(date) + LOCATION.longitude / 15;

  let hourAngleHours = lst - raHours;
  hourAngleHours = ((hourAngleHours + 12) % 24 + 24) % 24 - 12;

  const H = degToRad(hourAngleHours * 15);
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(H);
  const alt = Math.asin(sinAlt);

  const y = -Math.sin(H);
  const x = Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(H);
  const az = (radToDeg(Math.atan2(y, x)) + 360) % 360;

  return { alt: radToDeg(alt), az };
}

function degToRad(deg) { return deg * Math.PI / 180; }
function radToDeg(rad) { return rad * 180 / Math.PI; }

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function skyMetrics() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.44;
  return { w, h, cx, cy, radius };
}

function projectAltAz(alt, az, m) {
  if (alt < 0) return null;
  const r = (90 - alt) / 90 * m.radius;
  const a = degToRad(az);
  return { x: m.cx + r * Math.sin(a), y: m.cy - r * Math.cos(a) };
}

function drawBackground(m) {
  const grad = ctx.createRadialGradient(m.cx, m.cy, 0, m.cx, m.cy, m.radius * 1.12);
  grad.addColorStop(0, "#17345a");
  grad.addColorStop(0.55, "#08182f");
  grad.addColorStop(1, "#020610");

  ctx.fillStyle = "#020610";
  ctx.fillRect(0, 0, m.w, m.h);

  ctx.beginPath();
  ctx.arc(m.cx, m.cy, m.radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.34)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawCardinal(m);
}

function drawCardinal(m) {
  const points = [{label:"北",az:0},{label:"東",az:90},{label:"南",az:180},{label:"西",az:270}];
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "bold 18px 'Noto Sans JP', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 地平線円の外側に配置する。ただし狭い画面ではCanvas内へ押し戻して、見切れを防ぐ。
  const labelRadius = m.radius + 24;

  for (const p of points) {
    const a = degToRad(p.az);
    const rawX = m.cx + labelRadius * Math.sin(a);
    const rawY = m.cy - labelRadius * Math.cos(a);
    const safe = clampCanvasTextPosition(rawX, rawY, 24);
    ctx.fillText(p.label, safe.x, safe.y);
  }
  ctx.restore();
}

function clampCanvasTextPosition(x, y, margin = 22) {
  const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
  const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
  return {
    x: Math.max(margin, Math.min(canvasWidth - margin, x)),
    y: Math.max(margin, Math.min(canvasHeight - margin, y))
  };
}

function clampLabelPosition(x, y, textWidth, textHeight = 22, margin = 8) {
  // 通常ラベルは textAlign = "left" で描画するため、右端も考慮してX座標を補正する。
  const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
  const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
  const halfH = textHeight / 2;

  return {
    x: Math.max(margin, Math.min(canvasWidth - textWidth - margin, x)),
    y: Math.max(margin + halfH, Math.min(canvasHeight - margin - halfH, y))
  };
}

function drawGrid(m) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "12px 'Noto Sans JP', system-ui, sans-serif";

  [30, 60].forEach(alt => {
    const r = (90 - alt) / 90 * m.radius;
    ctx.beginPath();
    ctx.arc(m.cx, m.cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(`${alt}°`, m.cx + 6, m.cy - r + 14);
  });

  for (let az = 0; az < 360; az += 30) {
    const a = degToRad(az);
    ctx.beginPath();
    ctx.moveTo(m.cx, m.cy);
    ctx.lineTo(m.cx + m.radius * Math.sin(a), m.cy - m.radius * Math.cos(a));
    ctx.stroke();
  }
  ctx.restore();
}

function starScreenPosition(star, date, m) {
  const hor = equatorialToHorizontal(star.ra, star.dec, date);
  const pos = projectAltAz(hor.alt, hor.az, m);
  return pos ? { ...pos, alt: hor.alt, az: hor.az } : null;
}

function drawMilkyWay(date, m) {
  const projected = MILKY_WAY_PATH
    .map(p => {
      const hor = equatorialToHorizontal(p.ra, p.dec, date);
      return projectAltAz(hor.alt, hor.az, m);
    })
    .filter(Boolean);

  if (projected.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const layers = [
    { width: 58, alpha: 0.035, color: [160,205,255] },
    { width: 34, alpha: 0.058, color: [210,230,255] },
    { width: 18, alpha: 0.044, color: [255,255,245] }
  ];

  for (const layer of layers) {
    ctx.beginPath();
    projected.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else {
        const prev = projected[i - 1];
        const cx = (prev.x + p.x) / 2;
        const cy = (prev.y + p.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
      }
    });
    ctx.strokeStyle = `rgba(${layer.color[0]},${layer.color[1]},${layer.color[2]},${layer.alpha})`;
    ctx.lineWidth = layer.width;
    ctx.filter = "blur(10px)";
    ctx.stroke();
  }

  ctx.filter = "none";

  for (let i = 0; i < projected.length - 1; i++) {
    const a = projected[i];
    const b = projected[i + 1];
    for (let j = 0; j < 14; j++) {
      const t = pseudoRandom(i * 91 + j);
      const x = a.x + (b.x - a.x) * t + (pseudoRandom(i * 123 + j) - 0.5) * 50;
      const y = a.y + (b.y - a.y) * t + (pseudoRandom(i * 173 + j) - 0.5) * 50;
      const r = 0.7 + pseudoRandom(i * 257 + j) * 1.7;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(235,245,255,${0.035 + pseudoRandom(i * 317 + j) * 0.06})`;
      ctx.fill();
    }
  }

  ctx.restore();
}

function pseudoRandom(seed) {
  const x = Math.sin(seed * 999.97) * 43758.5453;
  return x - Math.floor(x);
}

function drawBackgroundStars(date, m) {
  ctx.save();
  for (let i = 0; i < 950; i++) {
    const ra = pseudoRandom(i + 10) * 24;
    const dec = Math.asin(pseudoRandom(i + 20) * 2 - 1) * 180 / Math.PI;
    const mag = 3.4 + pseudoRandom(i + 30) * 1.1;
    const hor = equatorialToHorizontal(ra, dec, date);
    const pos = projectAltAz(hor.alt, hor.az, m);
    if (!pos) continue;

    const size = Math.max(0.26, 1.42 - (mag - 3.2) * 0.42);
    ctx.globalAlpha = 0.18 + (4.6 - mag) * 0.12;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  ctx.restore();
}

function reserveConstellationLabels(date, m) {
  for (const c of SKY_CONSTELLATIONS) {
    const hor = equatorialToHorizontal(c.label.ra, c.label.dec, date);
    const pos = projectAltAz(hor.alt, hor.az, m);
    if (!pos) continue;

    const placed = placeLabel({
      text: c.name,
      x: pos.x,
      y: pos.y,
      kind: "constellation",
      font: "15px 'Zen Old Mincho', 'Noto Sans JP', serif",
      color: "rgba(166,205,255,0.88)",
      priority: 2,
      align: "center",
      queueOnly: true
    });

    if (placed) visibleConstellationNames.add(c.name);
  }
}

function drawConstellationLines(date, m) {
  ctx.save();
  ctx.strokeStyle = "rgba(130,190,255,0.68)";
  ctx.lineWidth = 1.1;

  for (const c of SKY_CONSTELLATIONS) {
    if (!visibleConstellationNames.has(c.name)) continue;

    for (const [a, b] of c.lines) {
      const starA = STAR_BY_ID[a];
      const starB = STAR_BY_ID[b];
      if (!starA || !starB) continue;

      const pa = starScreenPosition(starA, date, m);
      const pb = starScreenPosition(starB, date, m);
      if (!pa || !pb) continue;

      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function starSize(mag) {
  if (mag <= 1) return 4.8;
  if (mag <= 2) return 3.7;
  if (mag <= 3) return 2.55;
  if (mag <= 4) return 1.55;
  return 1.05;
}

function starAlpha(mag) {
  if (mag <= 1) return 1;
  if (mag <= 2) return 0.9;
  if (mag <= 3) return 0.68;
  if (mag <= 4) return 0.46;
  return 0.34;
}

function drawStars(date, m) {
  for (const star of SKY_STARS) {
    if (star.mag > STAR_LIMIT_MAG) continue;

    const pos = starScreenPosition(star, date, m);
    if (!pos) continue;

    const size = starSize(star.mag);
    const alpha = starAlpha(star.mag);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.fillStyle = star.mag < 0.6 ? "#fff8d6" : "#ffffff";
    ctx.shadowColor = "rgba(255,255,255,0.8)";
    ctx.shadowBlur = star.mag <= 1 ? 11 : star.mag <= 2 ? 7 : 3;
    ctx.fill();
    ctx.restore();

    if (star.mag <= 2.15) {
      placeLabel({
        text: star.name,
        x: pos.x,
        y: pos.y,
        kind: "star",
        font: "13px 'Noto Sans JP', system-ui, sans-serif",
        color: "rgba(255,255,255,0.88)",
        priority: 4,
        align: "left",
        queueOnly: true
      });
    }
  }
}


function reserveFeaturedDeepSkyLabels(date, m) {
  const visible = [];

  for (const obj of SKY_DEEP_SKY) {
    const hor = equatorialToHorizontal(obj.ra, obj.dec, date);
    const pos = projectAltAz(hor.alt, hor.az, m);
    if (!pos) continue;
    visible.push({ ...obj, _pos: pos });
  }

  const featured = pickDailyDeepSkyObjects(visible, date, 3);

  for (const obj of featured) {
    placeLabel({
      text: obj.label || obj.name,
      x: obj._pos.x,
      y: obj._pos.y,
      kind: "deep",
      font: "bold 12px 'Noto Sans JP', system-ui, sans-serif",
      color: "rgba(96,255,225,0.96)",
      priority: 0,
      align: "left",
      queueOnly: true
    });
  }
}

function drawDeepSky(date, m) {
  const visible = [];

  for (const obj of SKY_DEEP_SKY) {
    const hor = equatorialToHorizontal(obj.ra, obj.dec, date);
    const pos = projectAltAz(hor.alt, hor.az, m);
    if (!pos) continue;
    visible.push({ ...obj, _pos: pos });
  }

  const featured = pickDailyDeepSkyObjects(visible, date, 3);

  for (const obj of featured) {
    drawDeepSkyObject(obj, obj._pos);
  }

  updateDeepSkyInfo(featured, date);
}

function pickDailyDeepSkyObjects(visible, date, limit = 3) {
  if (!visible || visible.length <= limit) return visible || [];

  const seed = makeDateSeed(date);
  const scored = visible.map((item, index) => ({
    item,
    score: seededHash(`${seed}:${item.name}:${index}`)
  }));

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map(entry => entry.item);
}

function drawDeepSkyObject(obj, pos) {
  ctx.save();

  // v11: 星雲・星団は控えめな青緑リングで位置を示す。
  const size = Math.max(7, Math.min(14, (obj.size || 14) * 0.55));

  ctx.globalCompositeOperation = "source-over";

  // Very soft cyan glow
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, size + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(125,255,235,0.16)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Main thin cyan ring
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(125,255,235,0.76)";
  ctx.lineWidth = 1.25;
  ctx.stroke();

  // Tiny center hint
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 1.35, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(125,255,235,0.70)";
  ctx.fill();

  ctx.restore();
}

function deepSkyTypeColor(type) {
  if (type === "galaxy") return "rgba(180,210,255,0.98)";
  if (type === "emissionNebula") return "rgba(255,160,220,0.98)";
  if (type === "planetaryNebula") return "rgba(125,255,220,0.98)";
  if (type === "globularCluster") return "rgba(255,236,170,0.98)";
  return "rgba(210,235,255,0.98)";
}

function updateDeepSkyInfo(visible, date = getTodayAt20()) {
  const el = document.getElementById("deepSkyInfo");
  const pickEl = document.getElementById("deepSkyPick");
  if (el) el.textContent = "";

  if (!pickEl) return;

  if (!visible || visible.length === 0) {
    pickEl.innerHTML = `
      <span class="deepSkyItem">
        <span class="deepSkyName">今夜の星雲・星団</span>
        <span class="deepSkyDesc">この時刻は代表的な星雲・星団が地平線下に多い時間帯です。季節が変わると、プレアデス、M31、M13、M8などが入れ替わって表示されます。</span>
      </span>
    `;
    return;
  }

  const explanations = buildDeepSkyExplanations(visible).slice(0, 3);
  pickEl.innerHTML = explanations.map(item =>
    `<span class="deepSkyItem">
      <span class="deepSkyName">${item.name}</span>
      <span class="deepSkyDesc">${item.description}</span>
    </span>`
  ).join("");
}

function buildDeepSkyExplanations(visible) {
  const descriptions = {
    // 代表的なメシエ天体
    "M31 アンドロメダ銀河": "秋を代表する大銀河。空が暗ければ肉眼でも淡い雲のように見えます。",
    "M45 プレアデス星団": "「すばる」として有名な青白い若い星の集まりです。",
    "M42 オリオン大星雲": "オリオン座の三つ星の下にある、星が生まれている明るい星雲です。",
    "M13 ヘルクレス球状星団": "夏の代表的な球状星団。古い星がぎゅっと丸く集まっています。",
    "M8 干潟星雲": "夏の天の川沿いにある大きな散光星雲。双眼鏡でも探しやすい対象です。",
    "M57 リング星雲": "こと座にある小さな惑星状星雲。望遠鏡では煙の輪のように見えます。",
    "M27 亜鈴状星雲": "こぎつね座にある惑星状星雲。亜鈴のような形で知られます。",
    "M44 プレセペ星団": "かに座にある散開星団。肉眼では淡い雲、双眼鏡では星の群れとして楽しめます。",
    "M1 かに星雲": "おうし座にある超新星残骸。歴史に残る超新星の名残として有名です。",
    "M104 ソンブレロ銀河": "おとめ座方向の有名な銀河。暗い帯を持つ姿からソンブレロの名で知られます。",
    "M51 子持ち銀河": "りょうけん座の有名な銀河。渦巻銀河と伴銀河が並ぶ姿で知られます。",
    "M81 ボーデの銀河": "おおぐま座方向の明るい銀河。M82と近くに並んで見えます。",
    "M82 葉巻銀河": "細長い形で知られる銀河。M81の近くにあります。",
    "M33 さんかく座銀河": "さんかく座にある渦巻銀河。暗い空で淡く広がって見える対象です。",
    "M24 いて座スタークラウド": "天の川の濃い部分にある星の雲。双眼鏡で星が一面に広がります。",

    // 追加メシエ天体
    "M2 球状星団": "みずがめ座にある球状星団。秋の夜空で探せる古い星の集まりです。",
    "M3 球状星団": "りょうけん座付近にある春の球状星団。小口径望遠鏡でも存在感があります。",
    "M4 球状星団": "アンタレスの近くにある球状星団。南の低空で条件が良いと楽しめます。",
    "M5 球状星団": "へび座にある明るい球状星団。春から初夏に見やすい対象です。",
    "M6 バタフライ星団": "さそり座の低空に見える散開星団。蝶のような星並びで知られます。",
    "M7 トレミー星団": "さそり座の尾に近い大きな散開星団。南の低空で見えると美しい対象です。",
    "M10 球状星団": "へびつかい座にある球状星団。夏の球状星団めぐりに向いた対象です。",
    "M11 野鴨星団": "たて座にある密集した散開星団。星が多く、望遠鏡で見応えがあります。",
    "M12 球状星団": "へびつかい座の球状星団。M10と近い位置にあり、比較して楽しめます。",
    "M14 球状星団": "へびつかい座にある球状星団。少し淡めですが、夏の望遠鏡向け対象です。",
    "M15 球状星団": "ペガスス座にある秋の球状星団。中心部がぎゅっと濃い対象です。",
    "M16 わし星雲": "へび座にある散光星雲。星形成領域として有名な対象です。",
    "M17 オメガ星雲": "いて座方向の明るい星雲。白鳥やオメガの形に例えられる対象です。",
    "M19 球状星団": "へびつかい座南部の球状星団。南の空が開けた場所で狙いたい対象です。",
    "M20 三裂星雲": "干潟星雲の近くにある星雲。暗黒帯が星雲を分ける姿で知られます。",
    "M22 球状星団": "いて座にある明るい球状星団。夏の南の空で楽しめます。",
    "M23 散開星団": "いて座にある散開星団。双眼鏡でも星の群れとして楽しめます。",
    "M25 散開星団": "いて座にある明るめの散開星団。夏の天の川沿いで探しやすい対象です。",
    "M26 散開星団": "たて座にある小ぶりな散開星団。野鴨星団M11の近くにあります。",
    "M28 球状星団": "いて座にある球状星団。南の低めの空で楽しめる対象です。",
    "M29 散開星団": "はくちょう座にある小さな散開星団。夏の天の川の中にあります。",
    "M34 散開星団": "ペルセウス座にある大きめの散開星団。双眼鏡でも見つけやすい対象です。",
    "M35 散開星団": "ふたご座の足元にある大きな散開星団。双眼鏡でも楽しめます。",
    "M36 散開星団": "ぎょしゃ座にある散開星団。M37、M38と合わせて冬に楽しめます。",
    "M37 散開星団": "ぎょしゃ座の散開星団の中でも星数が多く、細かな星粒が美しい対象です。",
    "M38 散開星団": "ぎょしゃ座にある散開星団。冬の天の川沿いに見える星の集まりです。",
    "M39 散開星団": "はくちょう座にある大きな散開星団。双眼鏡でゆったり楽しめます。",
    "M41 散開星団": "シリウスの南にある散開星団。冬の南の空で探しやすい対象です。",
    "M46 散開星団": "とも座にある散開星団。近くに惑星状星雲を含むことで知られます。",
    "M47 散開星団": "とも座の明るめの散開星団。M46と近くに並びます。",
    "M48 散開星団": "うみへび座にある広がりのある散開星団。双眼鏡向きの対象です。",
    "M50 散開星団": "いっかくじゅう座にある散開星団。冬から春先に楽しめる対象です。",
    "M52 散開星団": "カシオペヤ座にある散開星団。秋から冬の北の空で見やすい対象です。",
    "M53 球状星団": "かみのけ座にある球状星団。春の小型望遠鏡向け対象です。",
    "M56 球状星団": "こと座とこぎつね座の間にある球状星団。夏の望遠鏡向け対象です。",
    "M63 ひまわり銀河": "りょうけん座にある銀河。ひまわり銀河の名で知られる春の対象です。",
    "M64 黒眼銀河": "かみのけ座にある銀河。暗い模様から黒眼銀河の名で知られます。",
    "M65 しし座の銀河": "しし座トリプレットの一員。M66と近くに並ぶ春の銀河です。",
    "M66 しし座の銀河": "しし座トリプレットの明るい銀河。M65と一緒に探しやすい対象です。",
    "M67 散開星団": "かに座にある古い散開星団。プレセペより小ぶりですが落ち着いた星の集まりです。",
    "M71 球状星団": "や座にある小さめの球状星団。夏の天の川沿いで探せます。",
    "M74 銀河": "うお座にある淡い渦巻銀河。空の暗さがあると挑戦したい対象です。",
    "M76 小あれい星雲": "ペルセウス座にある惑星状星雲。小さな亜鈴のような姿で知られます。",
    "M77 銀河": "くじら座にある明るめの銀河。秋から冬にかけて見やすい対象です。",
    "M78 反射星雲": "オリオン座にある反射星雲。淡い雲のように見える冬の対象です。",
    "M79 球状星団": "うさぎ座にある珍しい冬の球状星団。南の空が開けた場所で狙います。",
    "M80 球状星団": "さそり座にある球状星団。アンタレス周辺の星団めぐりで楽しめます。",
    "M92 球状星団": "ヘルクレス座にある球状星団。M13ほど有名ではありませんが見応えがあります。",
    "M93 散開星団": "とも座にある散開星団。南の空で星粒がまとまって見えます。",
    "M94 銀河": "りょうけん座にある比較的明るい銀河。中心部が目立ちやすい対象です。",
    "M97 ふくろう星雲": "おおぐま座にある惑星状星雲。ふくろうの目のような模様で知られます。",
    "M101 回転花火銀河": "おおぐま座にある大きな渦巻銀河。暗い空で淡く広がって見えます。",
    "M106 銀河": "りょうけん座にある銀河。春の銀河めぐりで楽しめる対象です。",
    "M107 球状星団": "へびつかい座にある球状星団。南寄りの夏空で狙いたい対象です。",
    "M108 銀河": "おおぐま座にある細長い銀河。ふくろう星雲M97の近くにあります。",
    "M109 銀河": "おおぐま座にある棒渦巻銀河。北斗七星の近くで探せます。",

    // 非メシエ天体
    "二重星団": "2つの散開星団が並ぶ華やかな対象。双眼鏡で星粒が密集して見えます。",
    "Mel 25 ヒアデス星団": "おうし座の顔を形作る大きな散開星団。双眼鏡で広々と楽しめます。",
    "Mel 20 αペルセウス星団": "ペルセウス座の明るい星を中心に広がる大きな星団。双眼鏡向きです。",
    "Stock 2 マッスルマン星団": "二重星団の近くにある大きな散開星団。星の並びが人の形に例えられます。",
    "NGC 457 ふくろう星団": "カシオペヤ座の人気散開星団。ふくろうやETの形に例えられます。",
    "NGC 663 カシオペヤ座散開星団": "カシオペヤ座にある星数の多い散開星団。秋の北天で楽しめます。",
    "NGC 7789 キャロラインのバラ星団": "カシオペヤ座の美しい散開星団。細かな星の集まりがバラのように見えます。",
    "NGC 752 散開星団": "アンドロメダ座付近の大きな散開星団。双眼鏡でゆったり楽しめます。",
    "NGC 869 h星団": "二重星団の片方。ペルセウス座にある華やかな散開星団です。",
    "NGC 884 χ星団": "二重星団の片方。h星団と並んで双眼鏡でも見応えがあります。",
    "NGC 1647 おうし座散開星団": "おうし座にある広がりのある散開星団。ヒアデス周辺と合わせて楽しめます。",
    "NGC 1746 おうし座散開星団": "おうし座にある大きめの散開星団。双眼鏡で探しやすい対象です。",
    "NGC 2169 37星団": "オリオン座にある小さな散開星団。星の並びが37に見えることで知られます。",
    "NGC 2264 クリスマスツリー星団": "いっかくじゅう座にある星団と星雲の領域。星の並びが木の形に例えられます。",
    "NGC 2244 バラ星雲星団": "バラ星雲の中心部にある散開星団。星雲は暗い空やフィルターで楽しめます。",
    "NGC 2362 タウ星団": "おおいぬ座にある散開星団。明るい星を中心にまとまって見えます。",
    "NGC 2392 エスキモー星雲": "ふたご座にある惑星状星雲。小型望遠鏡で丸い姿を楽しめます。",
    "NGC 2903 しし座銀河": "しし座にある比較的見やすい銀河。春の銀河観望に向いた対象です。",
    "NGC 4565 エッジオン銀河": "かみのけ座の細長い銀河。横向きの銀河として人気があります。",
    "NGC 4631 くじら銀河": "りょうけん座にある細長い銀河。くじらのような姿で知られます。",
    "NGC 2403 きりん座銀河": "きりん座にある銀河。北の空で比較的高く見える時期があります。",
    "NGC 3242 木星状星雲": "うみへび座にある惑星状星雲。小型望遠鏡で小さな円盤状に見えます。",
    "IC 4665 散開星団": "へびつかい座にある大きな散開星団。双眼鏡で楽しみやすい対象です。",
    "NGC 6633 散開星団": "へびつかい座にある散開星団。夏の双眼鏡観望に向いています。",
    "IC 4756 散開星団": "へび座にある大きな散開星団。NGC 6633とあわせて楽しめます。",
    "Collinder 399 コートハンガー": "こぎつね座にある星の並び。ハンガーのような形で双眼鏡向きです。",
    "NGC 7000 北アメリカ星雲": "はくちょう座の大きな散光星雲。暗い空やフィルターで形が分かりやすくなります。",
    "NGC 6960 網状星雲 西": "はくちょう座にある超新星残骸の一部。暗い空とフィルターで楽しみたい対象です。",
    "NGC 6992 網状星雲 東": "網状星雲の東側部分。淡いフィラメント状の構造で知られます。",
    "NGC 6826 まばたき星雲": "はくちょう座にある惑星状星雲。見る位置で明滅するように感じられます。",
    "NGC 6543 キャッツアイ星雲": "りゅう座にある惑星状星雲。小さいながら印象的な明るい中心部があります。",
    "NGC 891 エッジオン銀河": "アンドロメダ座にある横向きの銀河。暗い空で挑戦したい対象です。",
    "NGC 7331 ペガスス座銀河": "ペガスス座にある銀河。秋の銀河観望で人気の対象です。",
    "NGC 7662 青い雪玉星雲": "アンドロメダ座にある惑星状星雲。青みを帯びた小さな円盤状に見えます。",
    "NGC 253 ちょうこくしつ座銀河": "南の低空に見える大きな銀河。条件が良いと見応えがあります。",
    "NGC 7293 らせん星雲": "みずがめ座にある大きな惑星状星雲。暗い空で淡く広がって見えます。"
  };

  return visible.map(obj => ({
    name: obj.name,
    description: descriptions[obj.name] || typeDescription(obj.type)
  }));
}

function pickDailyDeepSkyExplanations(explanations, date, limit = 3) {
  if (!explanations || explanations.length <= limit) return explanations || [];

  const seed = makeDateSeed(date);
  const scored = explanations.map((item, index) => ({
    item,
    score: seededHash(`${seed}:${item.name}:${index}`)
  }));

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map(entry => entry.item);
}

function makeDateSeed(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function seededHash(text) {
  // 文字列から0以上1未満の疑似乱数を作る。
  // 同じ日付・同じ天体なら同じ値になり、翌日は並びが変わる。
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function chooseFeaturedDeepSky(visible) {
  const explanations = buildDeepSkyExplanations(visible);
  if (explanations.length > 0) return explanations[0];

  return {
    name: "今夜の星雲・星団",
    description: "この時刻は、代表的な星雲・星団が地平線下に多い時間帯です。季節が変わると表示対象も入れ替わります。"
  };
}

function typeDescription(type) {
  if (type === "galaxy") return "銀河系の外にある、星の大集団です。空の暗い場所では淡いしみのように見えます。";
  if (type === "globularCluster") return "古い星が丸く密集した星団です。望遠鏡では中心ほど濃く見えます。";
  if (type === "emissionNebula") return "ガスが光って見える星雲です。星が生まれる領域を含むことがあります。";
  if (type === "reflectionNebula") return "近くの星の光を反射して淡く見える星雲です。暗い空で楽しみたい対象です。";
  if (type === "planetaryNebula") return "恒星の最期に放出されたガスが光って見える天体です。";
  if (type === "starCloud") return "天の川の星が濃く集まって見える領域です。双眼鏡で星粒が広がります。";
  if (type === "supernovaRemnant") return "星が大爆発したあとに残されたガスの名残です。暗い空やフィルターがあると見やすくなります。";
  if (type === "asterism") return "星が印象的な形に並んで見える対象です。双眼鏡で探すと楽しい目印になります。";
  return "若い星々がゆるく集まった散開星団です。双眼鏡で楽しみやすい対象です。";
}


function rectOverlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function placeLabel({ text, x, y, kind, font, color, priority, align = "left", queueOnly = false }) {
  ctx.save();
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width);
  ctx.restore();

  const h = kind === "constellation" ? 24 : 22;
  const baseCandidates = align === "center"
    ? [{dx:-w/2,dy:-10},{dx:-w/2,dy:16},{dx:-w/2,dy:-32},{dx:-w/2,dy:34},{dx:14,dy:-8},{dx:-w-14,dy:-8}]
    : [{dx:10,dy:-14},{dx:10,dy:14},{dx:-w-13,dy:-14},{dx:-w-13,dy:14},{dx:-w/2,dy:-32},{dx:-w/2,dy:30},{dx:18,dy:0},{dx:-w-20,dy:0}];

  const candidates = [...baseCandidates];

  if (kind === "planet" || kind === "moon") {
    candidates.push(
      {dx:22,dy:-34},{dx:22,dy:36},{dx:-w-26,dy:-34},{dx:-w-26,dy:36},
      {dx:34,dy:-4},{dx:-w-36,dy:-4},{dx:-w/2,dy:-50},{dx:-w/2,dy:52},
      {dx:48,dy:-20},{dx:-w-50,dy:20}
    );
  }

  if (kind === "deep") {
    candidates.push(
      {dx:18,dy:-28},{dx:18,dy:30},{dx:-w-22,dy:-28},{dx:-w-22,dy:30},
      {dx:26,dy:-2},{dx:-w-28,dy:-2},{dx:-w/2,dy:-44},{dx:-w/2,dy:44}
    );
  }

  let chosen = null;

  for (const c of candidates) {
    const rawX = x + c.dx;
    const rawY = y + c.dy;
    const safe = clampLabelPosition(rawX, rawY, w, h, 8);

    const box = {
      x: safe.x - 5,
      y: safe.y - h / 2 - 2,
      w: w + 10,
      h: h + 4,
      priority
    };

    const overlaps = labelBoxes.some(existing => rectOverlaps(box, existing));
    if (!overlaps) {
      chosen = { x: safe.x, y: safe.y, box };
      break;
    }
  }

  // 絶対に被らせないため、配置できないラベルは省略。
  if (!chosen) return false;

  labelBoxes.push(chosen.box);

  labelDrawQueue.push({
    text,
    x: chosen.x,
    y: chosen.y,
    font,
    color,
    kind,
    w
  });

  return true;
}

function flushLabels() {
  for (const item of labelDrawQueue) {
    ctx.save();
    ctx.font = item.font;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    if (item.kind === "planet" || item.kind === "moon") {
      ctx.fillStyle = "rgba(2, 7, 18, 0.66)";
      roundRect(ctx, item.x - 5, item.y - 11, item.w + 10, 22, 8);
      ctx.fill();
    }

    if (item.kind === "deep") {
      ctx.fillStyle = "rgba(0, 42, 48, 0.46)";
      roundRect(ctx, item.x - 5, item.y - 11, item.w + 10, 22, 8);
      ctx.fill();
    }

    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  }
}

function drawMoonPhaseDisk(targetCtx, x, y, r, phase, darkColor = "rgba(13,18,28,0.98)") {
  const synodic = 29.530588853;
  const age = phase ? phase.age : 14.8;
  const illum = phase ? Math.max(0, Math.min(1, phase.fraction ?? 0.5)) : 0.5;
  const waxing = age < synodic / 2;

  targetCtx.save();
  targetCtx.translate(x, y);

  targetCtx.beginPath();
  targetCtx.arc(0, 0, r, 0, Math.PI * 2);
  targetCtx.clip();

  targetCtx.fillStyle = darkColor;
  targetCtx.fillRect(-r, -r, r * 2, r * 2);

  const moonGrad = targetCtx.createRadialGradient(-r * 0.35, -r * 0.4, 1, 0, 0, r + 3);
  moonGrad.addColorStop(0, "rgba(255,252,226,1)");
  moonGrad.addColorStop(0.58, "rgba(232,224,190,1)");
  moonGrad.addColorStop(1, "rgba(174,165,136,1)");

  if (illum > 0.985) {
    targetCtx.fillStyle = moonGrad;
    targetCtx.fillRect(-r, -r, r * 2, r * 2);
  } else if (illum >= 0.015) {
    // 明るい円を描いてから、暗い円をずらして重ねる。
    // 上弦前後（waxing）は右側が明るく、下弦前後（waning）は左側が明るくなる。
    targetCtx.fillStyle = moonGrad;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, r, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.fillStyle = darkColor;
    const coverX = (waxing ? -1 : 1) * (2 * r * illum);
    targetCtx.beginPath();
    targetCtx.arc(coverX, 0, r, 0, Math.PI * 2);
    targetCtx.fill();
  }

  targetCtx.fillStyle = "rgba(82,76,64,0.14)";
  [
    [-r * 0.25, -r * 0.30, r * 0.12],
    [ r * 0.33,  r * 0.22, r * 0.14],
    [-r * 0.08,  r * 0.36, r * 0.09]
  ].forEach(([dx, dy, rr]) => {
    targetCtx.beginPath();
    targetCtx.arc(dx, dy, rr, 0, Math.PI * 2);
    targetCtx.fill();
  });

  targetCtx.restore();
}

function drawMoonCardIcon(phase) {
  const c = document.getElementById("moonCardCanvas");
  if (!c) return;

  const dpr = window.devicePixelRatio || 1;
  const size = 96;
  c.width = size * dpr;
  c.height = size * dpr;
  c.style.width = "76px";
  c.style.height = "76px";

  const g = c.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, size, size);

  const x = size / 2;
  const y = size / 2;
  const r = 30;

  const halo = g.createRadialGradient(x, y, 4, x, y, 45);
  halo.addColorStop(0, "rgba(255,246,215,0.24)");
  halo.addColorStop(1, "rgba(255,246,215,0)");
  g.fillStyle = halo;
  g.beginPath();
  g.arc(x, y, 45, 0, Math.PI * 2);
  g.fill();

  drawMoonPhaseDisk(g, x, y, r, phase, "rgba(16,20,30,0.98)");

  const shade = g.createLinearGradient(x - r, y, x + r, y);
  shade.addColorStop(0, "rgba(0,0,0,0.18)");
  shade.addColorStop(0.5, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.20)");
  g.save();
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = shade;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();

  g.strokeStyle = "rgba(255,255,255,0.42)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.stroke();
}


function drawPlanetIcon(icon, x, y) {
  ctx.save();
  ctx.translate(x, y);

  if (icon === "mercury") {
    ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "#c9c2b8"; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.stroke();
  }

  if (icon === "venus") {
    const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 9);
    g.addColorStop(0, "#fff7cc"); g.addColorStop(1, "#d7a955");
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
  }

  if (icon === "mars") {
    ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = "#e16b45"; ctx.fill();
    ctx.fillStyle = "rgba(90,30,20,0.45)";
    ctx.beginPath(); ctx.arc(2, -1, 1.7, 0, Math.PI * 2); ctx.arc(-2, 2, 1.2, 0, Math.PI * 2); ctx.fill();
  }

  if (icon === "jupiter") {
    ctx.beginPath(); ctx.arc(0, 0, 8.2, 0, Math.PI * 2);
    ctx.fillStyle = "#d9b48a"; ctx.fill();
    ctx.strokeStyle = "rgba(105,62,38,0.55)"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(7, -2); ctx.moveTo(-7, 2); ctx.lineTo(7, 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(3, 1.5, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(140,55,35,0.65)"; ctx.fill();
  }

  if (icon === "saturn") {
    ctx.strokeStyle = "rgba(238,212,154,0.9)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 12, 4.2, -0.2, 0, Math.PI * 2); ctx.stroke();
    const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7);
    g.addColorStop(0, "#fff1bf"); g.addColorStop(1, "#b98d54");
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
  }


  if (icon === "uranus") {
    const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7);
    g.addColorStop(0, "#d7fff7"); g.addColorStop(1, "#5edbd0");
    ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "rgba(210,255,250,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.2, -0.25, 0, Math.PI * 2); ctx.stroke();
  }

  if (icon === "neptune") {
    const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7);
    g.addColorStop(0, "#b7d7ff"); g.addColorStop(1, "#315fb8");
    ctx.beginPath(); ctx.arc(0, 0, 6.7, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = "rgba(230,245,255,0.55)";
    ctx.beginPath(); ctx.arc(-2.5, -2.5, 1.4, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function formatTimeShort(date) {
  if (!date) return "--:--";
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function getLocalMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
}

function altitudeForBody(bodyKey, date, observer) {
  const equ = Astronomy.Equator(bodyKey, date, observer, true, true);
  const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");
  return hor.altitude;
}

function interpolateCrossing(t1, a1, t2, a2) {
  const ratio = Math.abs(a1) / (Math.abs(a1) + Math.abs(a2));
  return new Date(t1.getTime() + (t2.getTime() - t1.getTime()) * ratio);
}

function findRiseSetCrossingsInRange(bodyKey, start, hours) {
  const observer = new Astronomy.Observer(LOCATION.latitude, LOCATION.longitude, LOCATION.elevation);
  const stepMs = 5 * 60 * 1000;
  const endMs = start.getTime() + hours * 60 * 60 * 1000;

  let prevTime = start;
  let prevAlt;

  try {
    prevAlt = altitudeForBody(bodyKey, prevTime, observer);
  } catch (error) {
    return { rise: null, set: null, minAlt: null, maxAlt: null };
  }

  let rise = null;
  let set = null;
  let minAlt = prevAlt;
  let maxAlt = prevAlt;

  for (let t = start.getTime() + stepMs; t <= endMs; t += stepMs) {
    const curTime = new Date(t);
    let curAlt;

    try {
      curAlt = altitudeForBody(bodyKey, curTime, observer);
    } catch (error) {
      continue;
    }

    minAlt = Math.min(minAlt, curAlt);
    maxAlt = Math.max(maxAlt, curAlt);

    if (prevAlt <= 0 && curAlt > 0 && !rise) {
      rise = interpolateCrossing(prevTime, prevAlt, curTime, curAlt);
    }

    if (prevAlt >= 0 && curAlt < 0 && !set) {
      set = interpolateCrossing(prevTime, prevAlt, curTime, curAlt);
    }

    prevTime = curTime;
    prevAlt = curAlt;
  }

  return { rise, set, minAlt, maxAlt };
}

function findRiseSetTimes(bodyKey, date) {
  if (typeof Astronomy === "undefined") {
    return {
      rise: null,
      set: null,
      riseDayOffset: 0,
      setDayOffset: 0,
      alwaysUp: false,
      alwaysDown: false
    };
  }

  const start = getLocalMidnight(date);
  const prevStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const nextStart = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const prev = findRiseSetCrossingsInRange(bodyKey, prevStart, 24);
  const today = findRiseSetCrossingsInRange(bodyKey, start, 24);
  const next = findRiseSetCrossingsInRange(bodyKey, nextStart, 24);

  const minAlt = Math.min(
    prev.minAlt ?? Infinity,
    today.minAlt ?? Infinity,
    next.minAlt ?? Infinity
  );
  const maxAlt = Math.max(
    prev.maxAlt ?? -Infinity,
    today.maxAlt ?? -Infinity,
    next.maxAlt ?? -Infinity
  );

  const riseInfo = chooseRiseCrossing(prev, today, next);
  const setInfo = chooseSetCrossing(prev, today, next);

  return {
    rise: riseInfo ? riseInfo.date : null,
    set: setInfo ? setInfo.date : null,
    riseDayOffset: riseInfo ? riseInfo.dayOffset : 0,
    setDayOffset: setInfo ? setInfo.dayOffset : 0,

    // 旧プロパティも互換用に残す
    riseNextDay: riseInfo ? riseInfo.dayOffset === 1 : false,
    setNextDay: setInfo ? setInfo.dayOffset === 1 : false,
    risePreviousDay: riseInfo ? riseInfo.dayOffset === -1 : false,
    setPreviousDay: setInfo ? setInfo.dayOffset === -1 : false,

    alwaysUp: minAlt > 0,
    alwaysDown: maxAlt < 0
  };
}

function chooseRiseCrossing(prev, today, next) {
  // 基本は当日内の「昇」を優先。
  if (today.rise) {
    return { date: today.rise, dayOffset: 0 };
  }

  // 当日に「沈」だけがある場合、その天体は前日に昇ってから沈む流れなので、前日の昇を補完。
  if (today.set && prev.rise) {
    return { date: prev.rise, dayOffset: -1 };
  }

  // 当日になければ翌日の昇を補完。
  if (next.rise) {
    return { date: next.rise, dayOffset: 1 };
  }

  // 最後の保険。
  if (prev.rise) {
    return { date: prev.rise, dayOffset: -1 };
  }

  return null;
}

function chooseSetCrossing(prev, today, next) {
  // 基本は当日内の「沈」を優先。
  if (today.set) {
    return { date: today.set, dayOffset: 0 };
  }

  // 当日に「昇」だけがある場合、その天体は翌日に沈む流れなので、翌日の沈を補完。
  if (today.rise && next.set) {
    return { date: next.set, dayOffset: 1 };
  }

  // 当日になければ翌日の沈を補完。
  if (next.set) {
    return { date: next.set, dayOffset: 1 };
  }

  // 最後の保険。
  if (prev.set) {
    return { date: prev.set, dayOffset: -1 };
  }

  return null;
}

function formatTimeWithDay(date, dayOffset = 0) {
  if (!date) return "--:--";
  const prefix = dayOffset < 0 ? "昨" : dayOffset > 0 ? "翌" : "";
  return `${prefix}${formatTimeShort(date)}`;
}

function formatRiseSetText(rs) {
  if (!rs) return "昇 --:-- / 沈 --:--";
  if (rs.alwaysUp) return "一日中地平線上";
  if (rs.alwaysDown) return "一日中地平線下";
  return `昇 ${formatTimeWithDay(rs.rise, rs.riseDayOffset)} / 沈 ${formatTimeWithDay(rs.set, rs.setDayOffset)}`;
}


function reserveMoonLabel(date, m) {
  if (typeof Astronomy === "undefined") return;

  try {
    const observer = new Astronomy.Observer(LOCATION.latitude, LOCATION.longitude, LOCATION.elevation);
    const equ = Astronomy.Equator("Moon", date, observer, true, true);
    const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");
    const pos = projectAltAz(hor.altitude, hor.azimuth, m);
    if (!pos) return;

    placeLabel({
      text: "月",
      x: pos.x,
      y: pos.y,
      kind: "moon",
      font: "bold 14px 'Noto Sans JP', system-ui, sans-serif",
      color: "rgba(255,245,210,0.96)",
      priority: 0,
      align: "left",
      queueOnly: true
    });
  } catch (error) {
    console.warn("Moon label reservation failed:", error);
  }
}


function drawMoon(date, m) {
  if (typeof Astronomy === "undefined") {
    updateMoonInfo(null, null, date);
    return;
  }

  try {
    const observer = new Astronomy.Observer(LOCATION.latitude, LOCATION.longitude, LOCATION.elevation);
    const equ = Astronomy.Equator("Moon", date, observer, true, true);
    const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");
    const pos = projectAltAz(hor.altitude, hor.azimuth, m);

    const phase = getMoonPhaseInfo(date);
    updateMoonInfo(phase, hor.altitude, date);

    if (!pos) return;

    drawMoonIcon(pos.x, pos.y, phase);
  } catch (error) {
    console.warn("Moon calculation failed:", error);
    updateMoonInfo(null, null, date);
  }
}

function getMoonPhaseInfo(date) {
  // 安定性重視：既知の新月（2000-01-06 18:14 UTC）から平均朔望月で月齢を計算。
  // Astronomy.MoonPhase() の戻り値解釈に依存させないことで、新月誤表示を避ける。
  const synodic = 29.530588853;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const days = (date.getTime() - knownNewMoon) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  const phaseAngle = age / synodic * 360;
  const fraction = (1 - Math.cos(degToRad(phaseAngle))) / 2;

  return {
    phaseAngle,
    age,
    fraction: Math.max(0, Math.min(1, fraction)),
    waxing: age < synodic / 2,
    name: moonPhaseName(age)
  };
}

function moonPhaseName(age) {
  if (age < 1.5 || age > 28.0) return "新月頃";
  if (age < 6.5) return "三日月〜上弦前";
  if (age < 8.5) return "上弦頃";
  if (age < 13.5) return "満月前";
  if (age < 16.5) return "満月頃";
  if (age < 21.5) return "下弦前";
  if (age < 23.5) return "下弦頃";
  return "細い月";
}

function drawMoonIcon(x, y, phase) {
  const r = 11;

  ctx.save();

  const halo = ctx.createRadialGradient(x, y, 2, x, y, r * 2.25);
  halo.addColorStop(0, "rgba(255,246,215,0.34)");
  halo.addColorStop(1, "rgba(255,246,215,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.25, 0, Math.PI * 2);
  ctx.fill();

  drawMoonPhaseDisk(ctx, x, y, r, phase, "rgba(13,18,28,0.98)");

  ctx.strokeStyle = "rgba(255,255,255,0.46)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}


function updateMoonInfo(phase, altitude = null, date = getTodayAt20()) {
  const el = document.getElementById("moonInfo");
  if (!el) return;

  if (!phase) {
    el.textContent = "月情報を取得できませんでした。";
    drawMoonCardIcon(null);
    return;
  }

  const altitudeText = altitude !== null
    ? altitude >= 0 ? `高度 約${altitude.toFixed(0)}°` : "地平線下"
    : "高度不明";

  const riseSet = findRiseSetTimes("Moon", date);
  el.innerHTML = `${phase.name} / 月齢 約${phase.age.toFixed(1)} / ${altitudeText}<br><span class="moonRiseSet">${formatRiseSetText(riseSet)}</span>`;
  drawMoonCardIcon(phase);
}



function drawPlanets(date, m) {
  if (typeof Astronomy === "undefined") {
    drawPlanetNotice(m);
    updatePlanetInfo([], date);
    return;
  }

  const allPlanetInfo = [];

  try {
    const observer = new Astronomy.Observer(LOCATION.latitude, LOCATION.longitude, LOCATION.elevation);

    for (const body of SKY_PLANET_BODIES) {
      const equ = Astronomy.Equator(body.key, date, observer, true, true);
      const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");
      const pos = projectAltAz(hor.altitude, hor.azimuth, m);
      const riseSet = findRiseSetTimes(body.key, date);

      allPlanetInfo.push({ ...body, altitude: hor.altitude, azimuth: hor.azimuth, visible: hor.altitude >= 0, ...riseSet });

      if (!pos) continue;

      ctx.save();
      ctx.shadowColor = "rgba(255,210,120,0.8)";
      ctx.shadowBlur = 15;
      drawPlanetIcon(body.icon, pos.x, pos.y);
      ctx.restore();

      placeLabel({
        text: body.name,
        x: pos.x,
        y: pos.y,
        kind: "planet",
        font: "bold 14px 'Noto Sans JP', system-ui, sans-serif",
        color: "#ffe8a3",
        priority: 0,
        align: "left",
        queueOnly: true
      });
    }

    updatePlanetInfo(allPlanetInfo, date);
  } catch (error) {
    console.warn("Planet calculation failed:", error);
    drawPlanetNotice(m);
    updatePlanetInfo([], date);
  }
}

function getRiseSetInfo(bodyKey, observer, date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const info = { rise: null, set: null };

  if (typeof Astronomy === "undefined" || typeof Astronomy.SearchRiseSet !== "function") {
    return info;
  }

  try {
    // Astronomy Engine: direction +1 = rise, -1 = set.
    info.rise = astroTimeToDate(Astronomy.SearchRiseSet(bodyKey, observer, +1, start, 1.5));
    info.set = astroTimeToDate(Astronomy.SearchRiseSet(bodyKey, observer, -1, start, 1.5));
  } catch (error) {
    console.warn("Rise/set calculation failed:", bodyKey, error);
  }

  return info;
}

function astroTimeToDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value.date instanceof Date) return value.date;
  if (typeof value.toDate === "function") return value.toDate();
  return null;
}

function formatTimeOnly(value) {
  if (!value) return "--:--";
  return value.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function updatePlanetInfo(planets, date = getTodayAt20()) {
  const el = document.getElementById("planetInfo");
  if (!el) return;

  const source = planets && planets.length ? planets : SKY_PLANET_BODIES.map(body => ({
    ...body,
    visible: false,
    altitude: -999,
    ...findRiseSetTimes(body.key, date)
  }));

  el.innerHTML = source
    .map(p => `
      <div class="planetItem ${p.visible ? "isVisible" : "isHidden"}">
        ${planetSvg(p.icon)}
        <span class="planetText">${p.name}　${formatRiseSetText(p)}<span class="planetNow">　${p.visible ? `20時 高度約${p.altitude.toFixed(0)}°` : "20時 地平線下"}</span></span>
      </div>
    `)
    .join("");
}

function planetSvg(icon) {
  const common = 'class="planetMiniIcon" viewBox="0 0 32 32" aria-hidden="true"';
  if (icon === "mercury") {
    return `<svg ${common}><circle cx="16" cy="16" r="7" fill="#c9c2b8" stroke="rgba(255,255,255,.6)"/></svg>`;
  }
  if (icon === "venus") {
    return `<svg ${common}><defs><radialGradient id="v" cx="35%" cy="30%"><stop offset="0" stop-color="#fff7cc"/><stop offset="1" stop-color="#d7a955"/></radialGradient></defs><circle cx="16" cy="16" r="9" fill="url(#v)"/></svg>`;
  }
  if (icon === "mars") {
    return `<svg ${common}><circle cx="16" cy="16" r="8" fill="#e16b45"/><circle cx="19" cy="14" r="2" fill="rgba(90,30,20,.45)"/><circle cx="13" cy="19" r="1.6" fill="rgba(90,30,20,.38)"/></svg>`;
  }
  if (icon === "jupiter") {
    return `<svg ${common}><circle cx="16" cy="16" r="10" fill="#d9b48a"/><path d="M7 13h18M7 18h18" stroke="rgba(105,62,38,.6)" stroke-width="2"/><circle cx="20" cy="18" r="1.7" fill="rgba(140,55,35,.7)"/></svg>`;
  }
  if (icon === "saturn") {
    return `<svg ${common}><ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="#eed49a" stroke-width="2"/><circle cx="16" cy="16" r="8" fill="#c79a5b"/><circle cx="13" cy="13" r="5" fill="#fff1bf" opacity=".55"/></svg>`;
  }
  if (icon === "uranus") {
    return `<svg ${common}><circle cx="16" cy="16" r="8" fill="#5edbd0"/><ellipse cx="16" cy="16" rx="12" ry="4" fill="none" stroke="#d7fff7" stroke-width="1.6"/></svg>`;
  }
  if (icon === "neptune") {
    return `<svg ${common}><circle cx="16" cy="16" r="8" fill="#315fb8"/><circle cx="13" cy="13" r="2" fill="rgba(230,245,255,.6)"/></svg>`;
  }
  return `<svg ${common}><circle cx="16" cy="16" r="8" fill="#ffd166"/></svg>`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlanetNotice(m) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "13px 'Noto Sans JP', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("惑星計算ライブラリを読み込めませんでした（恒星・星座は表示中）", m.cx, m.cy + m.radius + 54);
  ctx.restore();
}

function drawInfo(date, m) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.74)";
  ctx.font = "13px 'Noto Sans JP', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("長野市 36.6486°N, 138.1948°E", 18, 26);
  ctx.restore();
}

function render() {
  resizeCanvas();
  resetLabels();

  const date = getTodayAt20();
  document.getElementById("targetDate").textContent = `表示日時：${formatDate(date)}`;

  const m = skyMetrics();

  drawBackground(m);
  drawMilkyWay(date, m);
  drawBackgroundStars(date, m);
  drawGrid(m);

  // 惑星・月・星雲星団ラベルを最優先にするため、他のラベルより先に場所を確保します。
  drawPlanets(date, m);
  reserveMoonLabel(date, m);
  reserveFeaturedDeepSkyLabels(date, m);

  reserveConstellationLabels(date, m);
  drawConstellationLines(date, m);

  drawStars(date, m);
  drawDeepSky(date, m);
  drawMoon(date, m);

  flushLabels();
  drawInfo(date, m);
}

window.addEventListener("resize", render);
window.addEventListener("DOMContentLoaded", render);



