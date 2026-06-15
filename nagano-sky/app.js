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
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.font = "bold 18px 'Noto Sans JP', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const p of points) {
    const a = degToRad(p.az);
    ctx.fillText(p.label, m.cx + (m.radius + 24) * Math.sin(a), m.cy - (m.radius + 24) * Math.cos(a));
  }
  ctx.restore();
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

    const size = Math.max(0.45, 2.0 - (mag - 3.2) * 0.55);
    ctx.globalAlpha = 0.28 + (4.6 - mag) * 0.18;
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
  if (mag <= 3) return 2.7;
  if (mag <= 4) return 1.85;
  return 1.35;
}

function starAlpha(mag) {
  if (mag <= 1) return 1;
  if (mag <= 2) return 0.9;
  if (mag <= 3) return 0.72;
  if (mag <= 4) return 0.54;
  return 0.42;
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

function drawDeepSky(date, m) {
  const visible = [];

  for (const obj of SKY_DEEP_SKY) {
    const hor = equatorialToHorizontal(obj.ra, obj.dec, date);
    const pos = projectAltAz(hor.alt, hor.az, m);
    if (!pos) continue;

    visible.push(obj);
    drawDeepSkyObject(obj, pos);

    placeLabel({
      text: obj.label || obj.name,
      x: pos.x,
      y: pos.y,
      kind: "deep",
      font: "bold 12px 'Noto Sans JP', system-ui, sans-serif",
      color: "rgba(96,255,225,0.96)",
      priority: 2,
      align: "left",
      queueOnly: true
    });
  }

  updateDeepSkyInfo(visible);
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

function updateDeepSkyInfo(visible) {
  const el = document.getElementById("deepSkyInfo");
  const pickEl = document.getElementById("deepSkyPick");
  if (el) el.textContent = "";

  if (!pickEl) return;

  if (!visible || visible.length === 0) {
    pickEl.innerHTML = "この時刻は代表的な星雲・星団が地平線下に多い時間帯です。季節が変わると、プレアデス、M31、M13、M8などが入れ替わって表示されます。";
    return;
  }

  const explanations = buildDeepSkyExplanations(visible).slice(0, 3);
  pickEl.innerHTML = explanations.map(item =>
    `<span class="deepSkyLine"><strong>${item.name}</strong>：${item.description}</span>`
  ).join("");
}

function buildDeepSkyExplanations(visible) {
  const descriptions = {
    "M31 アンドロメダ銀河": "秋を代表する大銀河。空が暗ければ肉眼でも淡い雲のように見えます。",
    "M45 プレアデス星団": "「すばる」として有名な青白い若い星の集まりです。",
    "M42 オリオン大星雲": "オリオン座の三つ星の下にある、星が生まれている明るい星雲です。",
    "M13 ヘルクレス球状星団": "夏の代表的な球状星団。古い星がぎゅっと丸く集まっています。",
    "M8 干潟星雲": "夏の天の川沿いにある大きな散光星雲。双眼鏡でも探しやすい対象です。",
    "M57 リング星雲": "こと座にある小さな惑星状星雲。望遠鏡では煙の輪のように見えます。",
    "二重星団": "2つの散開星団が並ぶ華やかな対象。双眼鏡で星粒が密集して見えます。",
    "M44 プレセペ星団": "かに座にある散開星団。肉眼では淡い雲、双眼鏡では星の群れとして楽しめます。",
    "M33 さんかく座銀河": "さんかく座にある渦巻銀河。暗い空で淡く広がって見える対象です。",
    "M51 子持ち銀河": "りょうけん座の有名な銀河。渦巻銀河と伴銀河が並ぶ姿で知られます。",
    "M81 ボーデの銀河": "おおぐま座方向の明るい銀河。M82と近くに並んで見えます。",
    "M82 葉巻銀河": "細長い形で知られる銀河。M81の近くにあります。",
    "M22 球状星団": "いて座にある明るい球状星団。夏の南の空で楽しめます。",
    "M27 亜鈴状星雲": "こぎつね座にある惑星状星雲。亜鈴のような形で知られます。"
  };

  const priority = [
    "M31 アンドロメダ銀河", "M45 プレアデス星団", "M42 オリオン大星雲",
    "M13 ヘルクレス球状星団", "M8 干潟星雲", "M57 リング星雲",
    "二重星団", "M44 プレセペ星団", "M33 さんかく座銀河", "M51 子持ち銀河",
    "M81 ボーデの銀河", "M82 葉巻銀河", "M22 球状星団", "M27 亜鈴状星雲"
  ];

  const picked = [];
  for (const name of priority) {
    const hit = visible.find(o => o.name === name);
    if (hit) picked.push({ name: hit.name, description: descriptions[name] });
  }

  for (const obj of visible) {
    if (picked.some(p => p.name === obj.name)) continue;
    picked.push({ name: obj.name, description: typeDescription(obj.type) });
  }

  return picked;
}

function chooseFeaturedDeepSky(visible) {
  const descriptions = {
    "M31 アンドロメダ銀河": "秋の代表格。肉眼でも条件が良ければ、ぼんやり淡い雲のように見える大銀河です。",
    "M45 プレアデス星団": "冬の代表格。「すばる」として有名な、青白い若い星たちの集まりです。",
    "M42 オリオン大星雲": "冬の代表格。オリオン座の三つ星の下にあり、星が生まれている明るい星雲です。",
    "M13 ヘルクレス球状星団": "夏の代表格。古い星がぎゅっと球状に集まった、北天屈指の球状星団です。",
    "M8 干潟星雲": "夏の天の川沿いにある大きな散光星雲。双眼鏡でも探しやすい華やかな領域です。",
    "M57 リング星雲": "こと座にある小さな惑星状星雲。望遠鏡では煙の輪のような姿で知られます。",
    "二重星団": "秋から冬に楽しい、2つ並んだ散開星団。双眼鏡で見ると星粒が密集して見えます。",
    "M44 プレセペ星団": "春のかに座にある散開星団。肉眼では淡い雲、双眼鏡では星の群れとして楽しめます。"
  };

  for (const key of Object.keys(descriptions)) {
    const hit = visible.find(o => o.name === key);
    if (hit) return { name: hit.name, description: descriptions[key] };
  }

  const first = visible[0];
  return {
    name: first.name,
    description: typeDescription(first.type)
  };
}

function typeDescription(type) {
  if (type === "galaxy") return "銀河系の外にある、星の大集団です。空の暗い場所では淡いしみのように見えます。";
  if (type === "globularCluster") return "古い星が丸く密集した星団です。望遠鏡では中心ほど濃く見えます。";
  if (type === "emissionNebula") return "ガスが光って見える星雲です。星が生まれる領域を含むことがあります。";
  if (type === "planetaryNebula") return "恒星の最期に放出されたガスが光って見える天体です。";
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

  const h = kind === "constellation" ? 22 : 20;
  const candidates = align === "center"
    ? [{dx:-w/2,dy:-10},{dx:-w/2,dy:16},{dx:-w/2,dy:-32},{dx:-w/2,dy:34},{dx:14,dy:-8},{dx:-w-14,dy:-8}]
    : [{dx:10,dy:-14},{dx:10,dy:14},{dx:-w-13,dy:-14},{dx:-w-13,dy:14},{dx:-w/2,dy:-32},{dx:-w/2,dy:30},{dx:18,dy:0},{dx:-w-20,dy:0}];

  let chosen = null;
  for (const c of candidates) {
    const box = { x: x + c.dx - 4, y: y + c.dy - h + 5, w: w + 9, h: h + 4, priority };
    const overlaps = labelBoxes.some(existing => rectOverlaps(box, existing));
    if (!overlaps) {
      chosen = { c, box };
      break;
    }
  }

  // 惑星と月のラベルは最優先。通常候補で置けない場合は、より遠い候補も試す。
  if (!chosen && (kind === "planet" || kind === "moon")) {
    const farCandidates = [
      {dx:22,dy:-34},{dx:22,dy:36},{dx:-w-26,dy:-34},{dx:-w-26,dy:36},
      {dx:34,dy:-4},{dx:-w-36,dy:-4},{dx:-w/2,dy:-50},{dx:-w/2,dy:52},
      {dx:48,dy:-20},{dx:-w-50,dy:20}
    ];
    for (const c of farCandidates) {
      const box = { x: x + c.dx - 4, y: y + c.dy - h + 5, w: w + 9, h: h + 4, priority };
      const overlaps = labelBoxes.some(existing => rectOverlaps(box, existing));
      if (!overlaps) {
        chosen = { c, box };
        break;
      }
    }
  }

  // 星雲・星団は位置を示すため、通常候補で置けない場合は少し遠い候補も試す。
  if (!chosen && kind === "deep") {
    const farCandidates = [
      {dx:18,dy:-28},{dx:18,dy:30},{dx:-w-22,dy:-28},{dx:-w-22,dy:30},
      {dx:26,dy:-2},{dx:-w-28,dy:-2},{dx:-w/2,dy:-44},{dx:-w/2,dy:44}
    ];
    for (const c of farCandidates) {
      const box = { x: x + c.dx - 4, y: y + c.dy - h + 5, w: w + 9, h: h + 4, priority };
      const overlaps = labelBoxes.some(existing => rectOverlaps(box, existing));
      if (!overlaps) {
        chosen = { c, box };
        break;
      }
    }
  }

  // 絶対に被らせないため、配置できないラベルは省略。
  if (!chosen) return false;

  labelBoxes.push(chosen.box);

  labelDrawQueue.push({
    text,
    x: x + chosen.c.dx,
    y: y + chosen.c.dy,
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

  const age = phase ? phase.age : 25.5;
  const synodic = 29.530588853;
  const illum = phase ? Math.max(0, Math.min(1, phase.fraction)) : 0.18;
  const waxing = age < synodic / 2;

  // halo
  const halo = g.createRadialGradient(x, y, 4, x, y, 45);
  halo.addColorStop(0, "rgba(255,246,215,0.24)");
  halo.addColorStop(1, "rgba(255,246,215,0)");
  g.fillStyle = halo;
  g.beginPath();
  g.arc(x, y, 45, 0, Math.PI * 2);
  g.fill();

  // clip to moon disk
  g.save();
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.clip();

  // base dark disk
  g.fillStyle = "rgba(16,20,30,0.98)";
  g.fillRect(x - r, y - r, r * 2, r * 2);

  // moon surface gradient
  const moonGrad = g.createRadialGradient(x - 9, y - 10, 2, x, y, r + 5);
  moonGrad.addColorStop(0, "rgba(255,252,226,1)");
  moonGrad.addColorStop(0.58, "rgba(232,224,190,1)");
  moonGrad.addColorStop(1, "rgba(174,165,136,1)");

  // Robust phase drawing using two-circle mask.
  if (illum > 0.985) {
    g.fillStyle = moonGrad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  } else if (illum < 0.015) {
    // new moon: keep dark disk
  } else {
    // Draw lit full disk, then cover with a dark disk shifted.
    g.fillStyle = moonGrad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "rgba(16,20,30,0.98)";

    let coverShift;
    if (illum <= 0.5) {
      // crescent: cover almost all; lit side right when waxing, left when waning.
      coverShift = r * illum * 2.05;
    } else {
      // gibbous: cover only a smaller side.
      coverShift = r * (2 - illum * 2.05);
    }

    const direction = waxing ? -1 : 1;
    g.beginPath();
    g.arc(x + direction * coverShift, y, r, 0, Math.PI * 2);
    g.fill();
  }

  // subtle shading
  const shade = g.createLinearGradient(x - r, y, x + r, y);
  shade.addColorStop(0, "rgba(0,0,0,0.18)");
  shade.addColorStop(0.5, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.20)");
  g.fillStyle = shade;
  g.fillRect(x - r, y - r, r * 2, r * 2);

  // subtle craters
  const craters = [
    [-9, -8, 3.2, 0.15],
    [8, 6, 4.0, 0.12],
    [-1, 11, 2.4, 0.13],
    [10, -10, 2.0, 0.11],
    [-13, 6, 1.7, 0.10]
  ];
  for (const [dx, dy, rr, alpha] of craters) {
    g.beginPath();
    g.arc(x + dx, y + dy, rr, 0, Math.PI * 2);
    g.fillStyle = `rgba(70,64,54,${alpha})`;
    g.fill();
  }

  g.restore();

  // rim
  g.strokeStyle = "rgba(255,255,255,0.40)";
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

function findRiseSetTimes(bodyKey, date) {
  if (typeof Astronomy === "undefined") return { rise: null, set: null, alwaysUp: false, alwaysDown: false };

  const observer = new Astronomy.Observer(LOCATION.latitude, LOCATION.longitude, LOCATION.elevation);
  const start = getLocalMidnight(date);
  const stepMs = 10 * 60 * 1000;
  const endMs = start.getTime() + 24 * 60 * 60 * 1000;

  let prevTime = start;
  let prevAlt;
  try { prevAlt = altitudeForBody(bodyKey, prevTime, observer); }
  catch (error) { return { rise: null, set: null, alwaysUp: false, alwaysDown: false }; }

  let rise = null;
  let set = null;
  let minAlt = prevAlt;
  let maxAlt = prevAlt;

  for (let t = start.getTime() + stepMs; t <= endMs; t += stepMs) {
    const curTime = new Date(t);
    let curAlt;
    try { curAlt = altitudeForBody(bodyKey, curTime, observer); }
    catch (error) { continue; }

    minAlt = Math.min(minAlt, curAlt);
    maxAlt = Math.max(maxAlt, curAlt);

    if (prevAlt <= 0 && curAlt > 0 && !rise) rise = interpolateCrossing(prevTime, prevAlt, curTime, curAlt);
    if (prevAlt >= 0 && curAlt < 0 && !set) set = interpolateCrossing(prevTime, prevAlt, curTime, curAlt);

    prevTime = curTime;
    prevAlt = curAlt;
  }

  return { rise, set, alwaysUp: minAlt > 0, alwaysDown: maxAlt < 0 };
}

function interpolateCrossing(t1, a1, t2, a2) {
  const ratio = Math.abs(a1) / (Math.abs(a1) + Math.abs(a2));
  return new Date(t1.getTime() + (t2.getTime() - t1.getTime()) * ratio);
}

function formatRiseSetText(rs) {
  if (!rs) return "昇 --:-- / 沈 --:--";
  if (rs.alwaysUp) return "一日中地平線上";
  if (rs.alwaysDown) return "一日中地平線下";
  return `昇 ${formatTimeShort(rs.rise)} / 沈 ${formatTimeShort(rs.set)}`;
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
  // 星図上の月アイコン。
  // moon-fix: 月カードと同じ考え方で、細い月が不自然な丸に見えないよう改善。
  const r = 11;
  const synodic = 29.530588853;
  const age = phase ? phase.age : 14.8;
  const illum = phase ? Math.max(0, Math.min(1, phase.fraction ?? 0.5)) : 0.5;
  const waxing = age < synodic / 2;

  ctx.save();
  ctx.translate(x, y);

  // halo
  const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.25);
  halo.addColorStop(0, "rgba(255,246,215,0.34)");
  halo.addColorStop(1, "rgba(255,246,215,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.25, 0, Math.PI * 2);
  ctx.fill();

  // Clip to moon disk
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  // dark base
  ctx.fillStyle = "rgba(13,18,28,0.98)";
  ctx.fillRect(-r, -r, r * 2, r * 2);

  // lunar surface gradient
  const moonGrad = ctx.createRadialGradient(-3.5, -4.5, 1, 0, 0, r + 3);
  moonGrad.addColorStop(0, "rgba(255,252,226,1)");
  moonGrad.addColorStop(0.58, "rgba(232,224,190,1)");
  moonGrad.addColorStop(1, "rgba(174,165,136,1)");

  if (illum > 0.985) {
    ctx.fillStyle = moonGrad;
    ctx.fillRect(-r, -r, r * 2, r * 2);
  } else if (illum < 0.015) {
    // new moon: keep dark disk
  } else {
    // Draw a full bright disk, then cover part of it with a shifted dark disk.
    // This creates a cleaner crescent / gibbous shape than the old semi-transparent ellipse.
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(13,18,28,0.98)";

    let coverShift;
    if (illum <= 0.5) {
      // Crescent: the dark disk covers most of the bright disk.
      coverShift = r * (2 * illum);
      ctx.beginPath();
      ctx.arc(waxing ? -coverShift : coverShift, 0, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Gibbous: cover only the smaller dark side.
      coverShift = r * (2 * (1 - illum));
      ctx.beginPath();
      ctx.arc(waxing ? coverShift : -coverShift, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Subtle surface texture
  ctx.fillStyle = "rgba(82,76,64,0.16)";
  [
    [-3.2, -3.6, 1.3],
    [3.8, 2.5, 1.5],
    [-1.0, 4.0, 0.9]
  ].forEach(([dx, dy, rr]) => {
    ctx.beginPath();
    ctx.arc(dx, dy, rr, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();

  // rim
  ctx.strokeStyle = "rgba(255,255,255,0.46)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
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

  // 惑星・月ラベルを最優先にするため、他のラベルより先に場所を確保します。
  drawPlanets(date, m);
  reserveMoonLabel(date, m);

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



