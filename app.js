/* =========================================================
  감정 얼굴 이모지 생성기 (마음 키캡 만들기용)
  - API 키/서버/DB 없이 동작 (정적 배포 가능)
  - SVG "부품 조합"으로 예시 4개 생성 (생성형 AI 금지 준수)
  - 키캡 디자인 SVG -> Canvas로 PNG 저장
  - A4(2x2) 인쇄용 PNG 생성

  ✅ 교사가 수정할 수 있는 목록(상단 상수) 모아둠
========================================================= */

/* =========================
   [교사용 수정 영역 1] 감정 목록
========================= */
const EMOTIONS = [
  { id: "joy",     label: "기쁨",     icon: "😄", details: ["행복", "뿌듯", "설렘", "감사", "신남"] },
  { id: "sad",     label: "슬픔",     icon: "😢", details: ["외로움", "서운", "우울", "속상", "눈물"] },
  { id: "anger",   label: "분노",     icon: "😠", details: ["억울", "화남", "짜증", "폭발", "불만"] },
  { id: "fear",    label: "두려움",   icon: "😨", details: ["불안", "긴장", "당황", "걱정", "떨림"] },
  { id: "snappy",  label: "까칠함",   icon: "😑", details: ["지루", "불편", "시큰둥", "귀찮", "날카로움"] },
];

/* =========================
   [교사용 수정 영역 2] 질문/선택지 목록
   - Q4(얼굴 효과)는 복수 선택 가능 (multi:true)
========================= */
const QUESTIONS = [
  {
    id: "eyes",
    title: "Q1. 눈 모양은?",
    multi: false,
    options: [
      { id: "crescent", label: "초승달눈", icon: "🌙" },
      { id: "round",    label: "동그란눈", icon: "⚪" },
      { id: "squint",   label: "가늘게 찡그림", icon: "〰️" },
      { id: "watery",   label: "눈물고임", icon: "💧" },
    ],
  },
  {
    id: "brows",
    title: "Q2. 눈썹은?",
    multi: false,
    options: [
      { id: "up",    label: "위로", icon: "↗️" },
      { id: "flat",  label: "평평", icon: "➖" },
      { id: "down",  label: "아래로", icon: "↘️" },
      { id: "close", label: "모여있음", icon: "⤵️" },
    ],
  },
  {
    id: "mouth",
    title: "Q3. 입 모양은?",
    multi: false,
    options: [
      { id: "bigsmile",  label: "활짝웃음", icon: "😄" },
      { id: "smile",     label: "살짝웃음", icon: "🙂" },
      { id: "flat",      label: "일자", icon: "😐" },
      { id: "frown",     label: "울상", icon: "🙁" },
      { id: "clench",    label: "이를 악문 입", icon: "😬" },
      { id: "tremble",   label: "떨리는 입", icon: "😖" },
    ],
  },
  {
    id: "effects",
    title: "Q4. 얼굴 효과는? (여러 개 선택 가능)",
    multi: true,
    options: [
      { id: "blush", label: "볼홍조", icon: "🟠" },
      { id: "tears", label: "눈물", icon: "💧" },
      { id: "sweat", label: "땀방울", icon: "💦" },
      { id: "none",  label: "없음", icon: "🚫" },
    ],
  },
];

/* =========================
   [교사용 수정 영역 3] 전략 목록(카테고리별 5개)
========================= */
const STRATEGIES = {
  joy: [
    { title: "감사 한마디", desc: "고마운 사람에게 짧게 말해요." },
    { title: "기쁨 기록", desc: "좋았던 일을 한 줄로 적어요." },
    { title: "나눔 제안", desc: "친구에게 함께 하자고 말해요." },
    { title: "차분한 호흡", desc: "신나도 숨을 3번 고르고 시작!" },
    { title: "다음 계획", desc: "이 기분을 이어갈 계획을 세워요." },
  ],
  sad: [
    { title: "숨 고르기", desc: "코로 3초 들이마시고 4초 내쉬기." },
    { title: "물 한 모금", desc: "물을 마시며 마음을 잠깐 쉬게 해요." },
    { title: "마음 말하기", desc: "‘나는 지금 ___해서 슬퍼.’" },
    { title: "자리 잠깐 이동", desc: "창가/복도에서 30초 쉬어요." },
    { title: "도움 요청", desc: "‘선생님, 잠깐 이야기해도 돼요?’" },
  ],
  anger: [
    { title: "10초 멈춤", desc: "손을 무릎에 두고 10초 세기." },
    { title: "숨-멈춤-내쉬기", desc: "2초 멈췄다가 길게 내쉬기." },
    { title: "물 마시기", desc: "입과 마음을 동시에 쉬게 해요." },
    { title: "감정 문장", desc: "‘나는 ___ 때문에 화가 났어.’" },
    { title: "해결 한 가지", desc: "지금 할 수 있는 해결 1개만 선택." },
  ],
  fear: [
    { title: "몸 확인", desc: "어깨 힘 빼고 손가락 꼼지락." },
    { title: "안전 문장", desc: "‘지금 나는 안전해. 천천히 해도 돼.’" },
    { title: "작게 시작", desc: "가장 쉬운 1단계만 해보기." },
    { title: "함께하기", desc: "친구/선생님과 같이 해도 돼요." },
    { title: "도움 요청", desc: "‘지금 좀 무서워요. 도와주세요.’" },
  ],
  snappy: [
    { title: "자극 줄이기", desc: "소리/빛/거리 조금 조절하기." },
    { title: "몸 풀기", desc: "목·어깨를 5초씩 스트레칭." },
    { title: "짧은 휴식", desc: "30초 눈 감고 쉬기." },
    { title: "말투 천천히", desc: "말을 한 박자 늦춰 말해요." },
    { title: "필요 말하기", desc: "‘나는 지금 ___이 필요해.’" },
  ],
};

/* =========================
   [교사용 수정 영역 4] 색상 팔레트(프리셋 10개)
========================= */
const COLOR_PALETTE = [
  "#FFE08A", "#B9FBC0", "#A0E7E5", "#BDB2FF", "#FFC6FF",
  "#FFD6A5", "#CAFFBF", "#9BF6FF", "#FDFFB6", "#FFADAD",
];

/* =========================================================
   상태
========================================================= */
const state = {
  step: 1,

  emotionCategory: null, // EMOTIONS.id
  emotionDetail: null,   // string|null

  answers: {
    eyes: null,
    brows: null,
    mouth: null,
    effects: new Set(["none"]), // ✅ 기본값
    intensity: 3,
  },

  examples: [],          // [{svg, variant, meta}]
  selectedExampleIndex: null,

  keycap: {
    shape: "roundrect",  // roundrect | circle
    bgColor: COLOR_PALETTE[0],
    selectedStrategyIndex: null,
    customStrategy: "",
  },

  generatedA4: null,
};

/* =========================================================
   DOM
========================================================= */
let el = null;
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function cacheDom(){
  el = {
    progressFill: $("#progressFill"),
    helperHint: $("#helperHint"),
    stepPanels: $$("[data-step-panel]"),
    stepPills: $$(".step-pill"),

    emotionCategoryGrid: $("#emotionCategoryGrid"),
    emotionDetailGrid: $("#emotionDetailGrid"),
    toStep2: $("#toStep2"),

    questionList: $("#questionList"),
    intensitySlider: $("#intensitySlider"),
    intensityValue: $("#intensityValue"),
    miniPreview: $("#miniPreview"),
    btnMakeExamples: $("#btnMakeExamples"),
    btnBackTo1: $("#btnBackTo1"),

    exampleGrid: $("#exampleGrid"),
    toStep4: $("#toStep4"),
    btnBackTo2: $("#btnBackTo2"),

    keycapPreview: $("#keycapPreview"),
    colorPalette: $("#colorPalette"),
    colorPicker: $("#colorPicker"),
    strategyGrid: $("#strategyGrid"),
    customStrategy: $("#customStrategy"),
    toStep5: $("#toStep5"),
    btnBackTo3: $("#btnBackTo3"),

    finalKeycap: $("#finalKeycap"),
    btnSavePNG: $("#btnSavePNG"),
    btnMakeA4: $("#btnMakeA4"),
    a4Canvas: $("#a4Canvas"),
    btnSaveA4PNG: $("#btnSaveA4PNG"),
    btnBackTo4: $("#btnBackTo4"),

    btnReset: $("#btnReset"),
  };

  // 필수 DOM 검증
  const required = [
    "emotionCategoryGrid","emotionDetailGrid","toStep2",
    "questionList","miniPreview","btnMakeExamples","intensitySlider"
  ];
  for(const k of required){
    if(!el[k]) throw new Error(`필수 요소를 찾지 못했어요: #${k} (index.html의 id 확인)`);
  }
}

/* =========================================================
   디버그(치명적 오류 표시)
========================================================= */
function safeText(t){
  return String(t).replace(/[&<>"]/g, (m)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[m]));
}
function showFatalError(err){
  console.error(err);
  const msg = err?.message ? err.message : String(err);
  const box = document.createElement("div");
  box.style.cssText = `
    position:fixed; left:18px; right:18px; bottom:18px;
    background:#fff; border:2px solid rgba(255,90,95,.35);
    box-shadow:0 10px 24px rgba(0,0,0,.12);
    border-radius:16px; padding:14px; z-index:9999; color:#182235;
    font-family: ui-sans-serif, system-ui, -apple-system, 'Noto Sans KR', 'Malgun Gothic', sans-serif;
  `;
  box.innerHTML = `
    <div style="font-weight:1000; font-size:16px; margin-bottom:6px;">⚠️ 앱 실행 오류</div>
    <div style="font-weight:900; font-size:14px; color:#556277; line-height:1.35;">
      ${safeText(msg)}<br/>
      (교사용) 크롬에서 F12 → Console에서 에러를 확인하세요.
    </div>
    <button style="margin-top:10px; padding:10px 12px; border-radius:12px; border:1px solid rgba(24,34,53,.2); background:#f3f7ff; font-weight:900; cursor:pointer;">
      닫기
    </button>
  `;
  box.querySelector("button").onclick = ()=> box.remove();
  document.body.appendChild(box);
}

/* =========================================================
   Step 관리
========================================================= */
function setStep(step){
  state.step = step;

  el.stepPanels.forEach(p=>{
    const n = Number(p.getAttribute("data-step-panel"));
    p.classList.toggle("is-hidden", n !== step);
  });
  el.stepPills.forEach(p=>{
    const n = Number(p.getAttribute("data-step"));
    p.classList.toggle("is-active", n === step);
  });

  const pct = ((step-1) / 4) * 100;
  if(el.progressFill) el.progressFill.style.width = `${pct}%`;

  const hintMap = {
    1: "먼저 ‘지금 내 마음’을 골라볼까?",
    2: "눈·눈썹·입·효과를 골라 얼굴을 조립해요!",
    3: "똑같은 답이라도 조금씩 다른 4개 예시가 나와요.",
    4: "키캡 배경색과 모양을 정하고, 조절 전략을 골라요.",
    5: "PNG로 저장하거나 A4 인쇄용 시트를 만들 수 있어요.",
  };
  if(el.helperHint) el.helperHint.textContent = hintMap[step] || "";
}

/* =========================================================
   STEP 1: 감정 선택
========================================================= */
function renderEmotionCategory(){
  el.emotionCategoryGrid.innerHTML = "";
  EMOTIONS.forEach(e=>{
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.innerHTML = `
      <span class="emoji" aria-hidden="true">${e.icon}</span>
      <span>${e.label}<span class="small">큰 감정</span></span>
    `;
    btn.addEventListener("click", ()=>{
      state.emotionCategory = e.id;
      state.emotionDetail = null;
      state.keycap.selectedStrategyIndex = null;

      renderEmotionCategory();
      renderEmotionDetail();
      renderStrategies();
      validateStep1();
      validateStep4();
      validateStep5();
    });
    if(state.emotionCategory === e.id) btn.classList.add("is-selected");
    el.emotionCategoryGrid.appendChild(btn);
  });
}

function renderEmotionDetail(){
  el.emotionDetailGrid.innerHTML = "";
  const cat = EMOTIONS.find(x=>x.id===state.emotionCategory);

  if(!cat){
    const p = document.createElement("div");
    p.style.cssText = "color:rgba(24,34,53,.65); font-weight:900; padding:10px;";
    p.textContent = "왼쪽에서 감정 카테고리를 먼저 골라요 🙂";
    el.emotionDetailGrid.appendChild(p);
    return;
  }

  cat.details.forEach((d)=>{
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.innerHTML = `
      <span class="emoji" aria-hidden="true">🔎</span>
      <span>${d}<span class="small">세부 단어</span></span>
    `;
    btn.addEventListener("click", ()=>{
      state.emotionDetail = (state.emotionDetail === d) ? null : d;
      renderEmotionDetail();
    });
    if(state.emotionDetail === d) btn.classList.add("is-selected");
    el.emotionDetailGrid.appendChild(btn);
  });
}

function validateStep1(){
  el.toStep2.disabled = !state.emotionCategory;
}

/* =========================================================
   STEP 2: 질문 렌더
========================================================= */
function renderQuestions(){
  el.questionList.innerHTML = "";

  QUESTIONS.forEach(q=>{
    const wrap = document.createElement("div");
    wrap.className = "question";
    wrap.innerHTML = `<div class="question-title">${q.title}</div><div class="options" role="group"></div>`;
    const optionsEl = wrap.querySelector(".options");

    q.options.forEach(opt=>{
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opt";
      btn.innerHTML = `
        <span class="icon" aria-hidden="true">${opt.icon}</span>
        <span>${opt.label}</span>
      `;

      btn.addEventListener("click", ()=>{
        if(q.multi){
          if(opt.id === "none"){
            state.answers.effects.clear();
            state.answers.effects.add("none");
          } else {
            state.answers.effects.delete("none");
            if(state.answers.effects.has(opt.id)) state.answers.effects.delete(opt.id);
            else state.answers.effects.add(opt.id);

            if(state.answers.effects.size === 0){
              state.answers.effects.add("none");
            }
          }
        } else {
          state.answers[q.id] = opt.id;
        }

        renderQuestions();
        updateMiniPreview();
        validateStep2();
      });

      const selected = q.multi
        ? state.answers.effects.has(opt.id)
        : state.answers[q.id] === opt.id;

      if(selected) btn.classList.add("is-selected");
      optionsEl.appendChild(btn);
    });

    el.questionList.appendChild(wrap);
  });
}

function validateStep2(){
  const ok = Boolean(
    state.answers.eyes &&
    state.answers.brows &&
    state.answers.mouth &&
    state.answers.effects.size > 0
  );
  el.btnMakeExamples.disabled = !ok;
}

/* =========================================================
   SVG 부품 조합: 얼굴 이모지
========================================================= */
function variantTweaks(variant){
  const tweaks = [
    { dx: 0,  dy: 0,  eyeScale: 1.00, mouthCurve: 1.00, effectShift: 0 },
    { dx: 2,  dy: -1, eyeScale: 1.05, mouthCurve: 0.92, effectShift: 1 },
    { dx: -2, dy: 1,  eyeScale: 0.95, mouthCurve: 1.10, effectShift: 2 },
    { dx: 1,  dy: 2,  eyeScale: 1.00, mouthCurve: 0.85, effectShift: 3 },
  ];
  return tweaks[variant % 4];
}

function tearDropPath(x, y, size, color, opacity){
  const s = size;
  const d = `
    M ${x} ${y}
    C ${x+s} ${y+s*0.2}, ${x+s*0.9} ${y+s*1.1}, ${x} ${y+s*1.4}
    C ${x-s*0.9} ${y+s*1.1}, ${x-s} ${y+s*0.2}, ${x} ${y}
    Z
  `;
  return `<path d="${d}" fill="${color}" opacity="${opacity}" stroke="#1B2430" stroke-width="3" />`;
}

function buildEmojiSVG(params, variant, size=220){
  const { eyes, brows, mouth, effects, intensity } = params;
  const t = variantTweaks(variant);

  const stroke = 8;
  const cx = 128 + t.dx;
  const cy = 128 + t.dy;
  const faceR = 92;

  const k = (intensity - 1) / 4; // 0~1

  const faceFill = "#FFE7A8";
  const line = "#1B2430";

  const eyeY = cy - 22;
  const eyeX1 = cx - 36;
  const eyeX2 = cx + 36;

  const eyesSVG = (() => {
    const s = t.eyeScale;
    if(eyes === "crescent"){
      const d1 = `M ${eyeX1-18*s} ${eyeY} Q ${eyeX1} ${eyeY+14*s} ${eyeX1+18*s} ${eyeY}`;
      const d2 = `M ${eyeX2-18*s} ${eyeY} Q ${eyeX2} ${eyeY+14*s} ${eyeX2+18*s} ${eyeY}`;
      return `
        <path d="${d1}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>
        <path d="${d2}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>
      `;
    }
    if(eyes === "round"){
      const r = 12*s;
      const pupil = 5*s;
      const glance = (variant % 2 === 0) ? -2 : 2;
      return `
        <circle cx="${eyeX1}" cy="${eyeY}" r="${r}" fill="#FFFFFF" stroke="${line}" stroke-width="${stroke-2}"/>
        <circle cx="${eyeX2}" cy="${eyeY}" r="${r}" fill="#FFFFFF" stroke="${line}" stroke-width="${stroke-2}"/>
        <circle cx="${eyeX1+glance}" cy="${eyeY+1}" r="${pupil}" fill="${line}"/>
        <circle cx="${eyeX2+glance}" cy="${eyeY+1}" r="${pupil}" fill="${line}"/>
      `;
    }
    if(eyes === "squint"){
      const drop = 6 + 6*k;
      const d1 = `M ${eyeX1-18*s} ${eyeY+drop} L ${eyeX1+18*s} ${eyeY+drop-2}`;
      const d2 = `M ${eyeX2-18*s} ${eyeY+drop-2} L ${eyeX2+18*s} ${eyeY+drop}`;
      return `
        <path d="${d1}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>
        <path d="${d2}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>
      `;
    }
    // watery
    const r = 11*s;
    const shine = 3*s;
    return `
      <ellipse cx="${eyeX1}" cy="${eyeY}" rx="${r+1}" ry="${r}" fill="#FFFFFF" stroke="${line}" stroke-width="${stroke-2}"/>
      <ellipse cx="${eyeX2}" cy="${eyeY}" rx="${r+1}" ry="${r}" fill="#FFFFFF" stroke="${line}" stroke-width="${stroke-2}"/>
      <circle cx="${eyeX1+3}" cy="${eyeY-2}" r="${shine}" fill="#BFE9FF"/>
      <circle cx="${eyeX2+3}" cy="${eyeY-2}" r="${shine}" fill="#BFE9FF"/>
    `;
  })();

  const browsSVG = (() => {
    const y = cy - 52 - 10*k;
    const w = 26;
    const h = 10;
    const inner = 6 + 6*k;

    if(brows === "up"){
      const d1 = `M ${eyeX1-w} ${y+6} Q ${eyeX1} ${y-8-h*k} ${eyeX1+w} ${y}`;
      const d2 = `M ${eyeX2-w} ${y} Q ${eyeX2} ${y-8-h*k} ${eyeX2+w} ${y+6}`;
      return `<path d="${d1}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>
              <path d="${d2}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>`;
    }
    if(brows === "flat"){
      const d1 = `M ${eyeX1-w} ${y+2} L ${eyeX1+w} ${y+2}`;
      const d2 = `M ${eyeX2-w} ${y+2} L ${eyeX2+w} ${y+2}`;
      return `<path d="${d1}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>
              <path d="${d2}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>`;
    }
    if(brows === "down"){
      const d1 = `M ${eyeX1-w} ${y} Q ${eyeX1} ${y+12+h*k} ${eyeX1+w} ${y+6}`;
      const d2 = `M ${eyeX2-w} ${y+6} Q ${eyeX2} ${y+12+h*k} ${eyeX2+w} ${y}`;
      return `<path d="${d1}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>
              <path d="${d2}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>`;
    }
    // close
    const d1 = `M ${eyeX1-w+inner} ${y+2} Q ${eyeX1} ${y-6} ${eyeX1+w} ${y+4}`;
    const d2 = `M ${eyeX2-w} ${y+4} Q ${eyeX2} ${y-6} ${eyeX2+w-inner} ${y+2}`;
    return `<path d="${d1}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>
            <path d="${d2}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>`;
  })();

  const mouthSVG = (() => {
    const mx = cx;
    const my = cy + 30;
    const width = 56;
    const curveBase = 18 * t.mouthCurve;
    const curve = curveBase * (0.6 + 0.8*k);

    if(mouth === "bigsmile"){
      const d = `M ${mx-width} ${my} Q ${mx} ${my+curve+6} ${mx+width} ${my}`;
      return `<path d="${d}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>`;
    }
    if(mouth === "smile"){
      const d = `M ${mx-width*0.85} ${my} Q ${mx} ${my+curve*0.65} ${mx+width*0.85} ${my}`;
      return `<path d="${d}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>`;
    }
    if(mouth === "flat"){
      const d = `M ${mx-width*0.75} ${my+4} L ${mx+width*0.75} ${my+4}`;
      return `<path d="${d}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>`;
    }
    if(mouth === "frown"){
      const d = `M ${mx-width*0.85} ${my+10} Q ${mx} ${my-curve*0.55} ${mx+width*0.85} ${my+10}`;
      return `<path d="${d}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>`;
    }
    if(mouth === "clench"){
      const w = 66, h = 26;
      const x = mx - w/2, y = my - h/2 + 6;
      const teeth = Array.from({length:4}).map((_,i)=>{
        const tx = x + (i+1)*(w/5);
        return `<line x1="${tx}" y1="${y+4}" x2="${tx}" y2="${y+h-4}" stroke="${line}" stroke-width="4" opacity=".55"/>`;
      }).join("");
      return `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" ry="10"
              fill="#FFFFFF" stroke="${line}" stroke-width="${stroke-2}"/>
        ${teeth}
      `;
    }
    // tremble
    const amp = 6 + 6*k;
    const d = `M ${mx-width*0.8} ${my+6}
               C ${mx-width*0.45} ${my+6-amp}, ${mx-width*0.15} ${my+6+amp}, ${mx} ${my+6}
               C ${mx+width*0.15} ${my+6-amp}, ${mx+width*0.45} ${my+6+amp}, ${mx+width*0.8} ${my+6}`;
    return `<path d="${d}" fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round"/>`;
  })();

  const effectsSVG = (() => {
    const set = new Set(effects || []);
    if(set.has("none")) return "";

    const parts = [];
    if(set.has("blush")){
      const blushOpacity = 0.18 + 0.18*k;
      parts.push(`
        <circle cx="${cx-62}" cy="${cy+10}" r="18" fill="#FF6B6B" opacity="${blushOpacity}"/>
        <circle cx="${cx+62}" cy="${cy+10}" r="18" fill="#FF6B6B" opacity="${blushOpacity}"/>
      `);
    }
    if(set.has("tears")){
      const shift = t.effectShift;
      const dropSize = 12 + 10*k;
      const x = (variant % 2 === 0) ? (eyeX2+10) : (eyeX1-10);
      const y = eyeY + 18 + shift*2;
      parts.push(tearDropPath(x, y, dropSize, "#68D6FF", 0.95));
    }
    if(set.has("sweat")){
      const shift = t.effectShift;
      const dropSize = 10 + 8*k;
      const x = cx + 56 - shift*2;
      const y = cy - 60 + shift*2;
      parts.push(tearDropPath(x, y, dropSize, "#68D6FF", 0.9));
    }
    return parts.join("");
  })();

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256" role="img" aria-label="얼굴 이모지">
    <defs>
      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity="0.18"/>
      </filter>
    </defs>

    <circle cx="${cx}" cy="${cy}" r="${faceR}" fill="${faceFill}" stroke="${line}" stroke-width="${stroke}" filter="url(#softShadow)"/>
    ${effectsSVG}
    ${browsSVG}
    ${eyesSVG}
    ${mouthSVG}
  </svg>
  `.trim();
}

/* =========================================================
   STEP 2: 미리보기
========================================================= */
function updateMiniPreview(){
  const ok = Boolean(state.answers.eyes && state.answers.brows && state.answers.mouth && state.answers.effects.size>0);
  el.miniPreview.innerHTML = "";
  if(!ok){
    el.miniPreview.innerHTML = `<div style="color:rgba(24,34,53,.6); font-weight:900;">선택 중…</div>`;
    return;
  }
  const svg = buildEmojiSVG({
    eyes: state.answers.eyes,
    brows: state.answers.brows,
    mouth: state.answers.mouth,
    effects: Array.from(state.answers.effects),
    intensity: state.answers.intensity,
  }, 0, 180);
  el.miniPreview.innerHTML = svg;
}

/* =========================================================
   STEP 3: 예시 생성/선택
========================================================= */
function makeExamples(){
  const base = {
    eyes: state.answers.eyes,
    brows: state.answers.brows,
    mouth: state.answers.mouth,
    effects: Array.from(state.answers.effects),
    intensity: state.answers.intensity,
  };
  state.examples = [0,1,2,3].map(v=>{
    const svg = buildEmojiSVG(base, v, 220);
    return { svg, variant: v, meta: base };
  });
  state.selectedExampleIndex = null;
  renderExamples();
  validateStep3();
}

function renderExamples(){
  el.exampleGrid.innerHTML = "";
  state.examples.forEach((ex, idx)=>{
    const card = document.createElement("div");
    card.className = "example-card";
    card.setAttribute("role","button");
    card.setAttribute("tabindex","0");
    card.setAttribute("aria-label", `예시 ${idx+1} 선택`);
    card.innerHTML = `
      <div class="check" aria-hidden="true">✔</div>
      ${ex.svg}
      <div style="color:rgba(24,34,53,.75); font-weight:900; margin-top:4px;">예시 ${idx+1}</div>
    `;

    const pick = ()=>{
      state.selectedExampleIndex = idx;
      renderExamples();
      validateStep3();
      renderKeycapPreview();
      renderFinalKeycap();
      validateStep4();
      validateStep5();
    };

    card.addEventListener("click", pick);
    card.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        pick();
      }
    });

    if(state.selectedExampleIndex === idx) card.classList.add("is-selected");
    el.exampleGrid.appendChild(card);
  });
}

function validateStep3(){
  el.toStep4.disabled = (state.selectedExampleIndex === null);
}

/* =========================================================
   STEP 4: 키캡 SVG
========================================================= */
function getSelectedEmotionLabel(){
  const cat = EMOTIONS.find(x=>x.id===state.emotionCategory);
  if(!cat) return "";
  return state.emotionDetail ? `${cat.label}(${state.emotionDetail})` : cat.label;
}

function getStrategyText(){
  const custom = state.keycap.customStrategy.trim();
  if(custom) return custom;
  const arr = STRATEGIES[state.emotionCategory] || [];
  const idx = state.keycap.selectedStrategyIndex;
  if(idx === null || idx === undefined) return "";
  return arr[idx]?.title || "";
}

function buildKeycapSVG({ size=520, forCanvas=false } = {}){
  const ex = state.examples[state.selectedExampleIndex];
  if(!ex) return "";

  const bg = state.keycap.bgColor;
  const shape = state.keycap.shape;

  const emotion = getSelectedEmotionLabel();
  const intensity = state.answers.intensity;
  const strategy = getStrategyText();

  const w = size, h = size;
  const pad = 28;
  const emojiSize = Math.round(size * 0.46);
  const emojiX = (w - emojiSize) / 2;
  const emojiY = 62;

  const caption = `감정: ${emotion} / 강도: ${intensity} / 나의 전략: ${strategy || "—"}`;

  const base = ex.meta;
  const emojiSVG = buildEmojiSVG(base, ex.variant, emojiSize);
  const nested = emojiSVG
    .replace(`<svg`, `<svg x="${emojiX}" y="${emojiY}"`)
    .replace(`width="${emojiSize}"`, `width="${emojiSize}"`)
    .replace(`height="${emojiSize}"`, `height="${emojiSize}"`);

  const rx = shape === "circle" ? (w/2) : 56;
  const fontFamily = forCanvas
    ? `ui-sans-serif, system-ui, -apple-system, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
    : `ui-sans-serif, system-ui, -apple-system, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="키캡 디자인">
    <defs>
      <filter id="capShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity="0.18"/>
      </filter>
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="rgba(255,255,255,0.55)"/>
        <stop offset="0.35" stop-color="rgba(255,255,255,0.14)"/>
        <stop offset="1" stop-color="rgba(255,255,255,0.00)"/>
      </linearGradient>
    </defs>

    <rect x="${pad}" y="${pad}" width="${w-pad*2}" height="${h-pad*2}"
          rx="${rx}" ry="${rx}"
          fill="${bg}" stroke="rgba(24,34,53,0.18)" stroke-width="3"
          filter="url(#capShadow)"/>

    <path d="M ${pad+18} ${pad+40}
             C ${w*0.38} ${pad-10}, ${w*0.60} ${pad+10}, ${w-pad-18} ${pad+120}
             L ${w-pad-18} ${pad+18}
             L ${pad+18} ${pad+18} Z"
          fill="url(#shine)" opacity="0.55"/>

    ${nested}

    <g>
      <rect x="${pad+22}" y="${h-118}" width="${w-(pad+22)*2}" height="76" rx="18" ry="18"
            fill="rgba(0,0,0,0.20)" stroke="rgba(255,255,255,0.20)" stroke-width="2"/>
      <text x="${w/2}" y="${h-72}" text-anchor="middle"
            font-family="${fontFamily}" font-size="20" font-weight="900"
            fill="rgba(255,255,255,0.95)">
        ${safeText(caption)}
      </text>
    </g>
  </svg>
  `.trim();
}

function renderKeycapPreview(){
  el.keycapPreview.innerHTML = "";
  if(state.selectedExampleIndex === null){
    el.keycapPreview.innerHTML = `<div style="color:rgba(24,34,53,.6); font-weight:900;">예시를 먼저 선택해요.</div>`;
    return;
  }
  el.keycapPreview.innerHTML = buildKeycapSVG({ size: 520 });
}

function renderFinalKeycap(){
  el.finalKeycap.innerHTML = "";
  if(state.selectedExampleIndex === null) return;
  el.finalKeycap.innerHTML = buildKeycapSVG({ size: 520 });
}

/* =========================================================
   STEP 4: 색/모양/전략 렌더 & 검증
========================================================= */
function renderColorPalette(){
  el.colorPalette.innerHTML = "";
  COLOR_PALETTE.forEach((c)=>{
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "color-chip";
    chip.style.background = c;
    chip.title = c;

    chip.addEventListener("click", ()=>{
      state.keycap.bgColor = c;
      el.colorPicker.value = c;
      renderColorPalette();
      renderKeycapPreview();
      renderFinalKeycap();
    });

    if(state.keycap.bgColor.toLowerCase() === c.toLowerCase()){
      chip.classList.add("is-selected");
    }
    el.colorPalette.appendChild(chip);
  });
}

function renderStrategies(){
  el.strategyGrid.innerHTML = "";
  const arr = STRATEGIES[state.emotionCategory] || [];
  arr.forEach((s, idx)=>{
    const card = document.createElement("div");
    card.className = "strategy-card";
    card.setAttribute("role","button");
    card.setAttribute("tabindex","0");
    card.innerHTML = `
      <div class="title">${safeText(s.title)}</div>
      <p class="desc">${safeText(s.desc)}</p>
    `;

    const pick = ()=>{
      state.keycap.selectedStrategyIndex = idx;
      renderStrategies();
      validateStep4();
      renderKeycapPreview();
      renderFinalKeycap();
      validateStep5();
    };

    card.addEventListener("click", pick);
    card.addEventListener("keydown",(e)=>{
      if(e.key==="Enter"||e.key===" "){ e.preventDefault(); pick(); }
    });

    if(state.keycap.selectedStrategyIndex === idx) card.classList.add("is-selected");
    el.strategyGrid.appendChild(card);
  });
}

function validateStep4(){
  const hasEmoji = (state.selectedExampleIndex !== null);
  const hasStrategy = Boolean(getStrategyText().trim());
  el.toStep5.disabled = !(hasEmoji && hasStrategy && state.emotionCategory);
}

function validateStep5(){
  const ok = Boolean(state.emotionCategory && state.selectedExampleIndex !== null && getStrategyText().trim());
  el.btnSavePNG.disabled = !ok;
  el.btnMakeA4.disabled = !ok;
}

/* =========================================================
   SVG -> Canvas -> PNG
========================================================= */
function downloadDataURL(dataURL, filename){
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function loadImage(src){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=>resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function svgToPngDataURL(svgString, outW, outH, scale=2){
  const svg = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svg);

  try{
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(outW * scale);
    canvas.height = Math.round(outH * scale);
    const ctx = canvas.getContext("2d");

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, outW, outH);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* =========================================================
   A4(2x2) 생성
========================================================= */
function roundRectStroke(ctx, x, y, w, h, r){
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  ctx.stroke();
}

async function buildA4Sheet(){
  const W = 2480, H = 3508;
  const margin = 140, gap = 110;
  const cellW = Math.floor((W - margin*2 - gap) / 2);
  const cellH = Math.floor((H - margin*2 - gap) / 2);
  const capSize = Math.min(cellW, cellH) - 220;

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 58px ui-sans-serif, system-ui, -apple-system, 'Noto Sans KR', 'Malgun Gothic', sans-serif";
  ctx.fillText("마음 키캡 인쇄 시트 (2x2)", margin, 90);

  ctx.fillStyle = "#374151";
  ctx.font = "bold 34px ui-sans-serif, system-ui, -apple-system, 'Noto Sans KR', 'Malgun Gothic', sans-serif";
  ctx.fillText("같은 디자인 4개를 출력해서 오려 쓰세요.", margin, 140);

  const keycapSvg = buildKeycapSVG({ size: 640, forCanvas:true });
  const keycapPng = await svgToPngDataURL(keycapSvg, 640, 640, 3);
  const img = await loadImage(keycapPng);

  const emotion = getSelectedEmotionLabel();
  const intensity = state.answers.intensity;
  const strategy = getStrategyText() || "—";

  for(let r=0;r<2;r++){
    for(let c=0;c<2;c++){
      const x0 = margin + c*(cellW + gap);
      const y0 = margin + 180 + r*(cellH + gap);

      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 6;
      roundRectStroke(ctx, x0, y0, cellW, cellH, 40);

      const capX = x0 + Math.floor((cellW - capSize)/2);
      const capY = y0 + 34;
      ctx.drawImage(img, capX, capY, capSize, capSize);

      const tx = x0 + 40;
      let ty = capY + capSize + 70;

      ctx.fillStyle = "#111827";
      ctx.font = "bold 44px ui-sans-serif, system-ui, -apple-system, 'Noto Sans KR', 'Malgun Gothic', sans-serif";
      ctx.fillText(`감정: ${emotion}`, tx, ty);

      ty += 56;
      ctx.fillStyle = "#374151";
      ctx.font = "bold 40px ui-sans-serif, system-ui, -apple-system, 'Noto Sans KR', 'Malgun Gothic', sans-serif";
      ctx.fillText(`강도: ${intensity} / 전략: ${strategy}`, tx, ty);

      ty += 52;
      ctx.fillStyle = "#6B7280";
      ctx.font = "bold 30px ui-sans-serif, system-ui, -apple-system, 'Noto Sans KR', 'Malgun Gothic', sans-serif";
      ctx.fillText("키캡은 ‘조절을 시작하는 버튼’이에요.", tx, ty);
    }
  }

  // 화면 미리보기(저해상)
  const preview = el.a4Canvas;
  const pctx = preview.getContext("2d");
  pctx.clearRect(0,0,preview.width, preview.height);
  pctx.drawImage(canvas, 0, 0, preview.width, preview.height);

  const dataURL = canvas.toDataURL("image/png");
  state.generatedA4 = { canvasHiRes: canvas, dataURL };
  el.btnSaveA4PNG.disabled = false;
}

/* =========================================================
   이벤트
========================================================= */
function bindEvents(){
  // Step1 -> Step2
  el.toStep2.addEventListener("click", ()=>{
    setStep(2);
    renderQuestions();     // ✅ Step2에서 Q1~Q4 보여주기
    updateMiniPreview();
    validateStep2();
  });

  el.btnBackTo1.addEventListener("click", ()=> setStep(1));

  // intensity
  el.intensitySlider.addEventListener("input", ()=>{
    state.answers.intensity = Number(el.intensitySlider.value);
    el.intensityValue.textContent = String(state.answers.intensity);
    updateMiniPreview();
  });

  // 예시 만들기
  el.btnMakeExamples.addEventListener("click", ()=>{
    makeExamples();
    setStep(3);
  });

  // Step3 back/next
  el.btnBackTo2.addEventListener("click", ()=>{
    setStep(2);
    renderQuestions();
    updateMiniPreview();
    validateStep2();
  });

  el.toStep4.addEventListener("click", ()=>{
    setStep(4);
    renderKeycapPreview();
    validateStep4();
  });

  // Step4 back
  el.btnBackTo3.addEventListener("click", ()=> setStep(3));

  // 키캡 모양
  $$(".segbtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const shape = btn.getAttribute("data-shape");
      state.keycap.shape = shape;
      $$(".segbtn").forEach(b=>{
        const active = (b.getAttribute("data-shape") === shape);
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-checked", active ? "true" : "false");
      });
      renderKeycapPreview();
      renderFinalKeycap();
    });
  });

  // 컬러피커
  el.colorPicker.addEventListener("input", ()=>{
    state.keycap.bgColor = el.colorPicker.value;
    renderColorPalette();
    renderKeycapPreview();
    renderFinalKeycap();
  });

  // 커스텀 전략
  el.customStrategy.addEventListener("input", ()=>{
    state.keycap.customStrategy = el.customStrategy.value;
    validateStep4();
    renderKeycapPreview();
    renderFinalKeycap();
    validateStep5();
  });

  // Step4 -> Step5
  el.toStep5.addEventListener("click", ()=>{
    setStep(5);
    renderFinalKeycap();
    validateStep5();
  });

  // Step5 back
  el.btnBackTo4.addEventListener("click", ()=> setStep(4));

  // 키캡 PNG 저장
  el.btnSavePNG.addEventListener("click", async ()=>{
    try{
      const svg = buildKeycapSVG({ size: 900, forCanvas:true });
      const dataURL = await svgToPngDataURL(svg, 900, 900, 2.5);
      const filename = `마음키캡_${getSelectedEmotionLabel()}_강도${state.answers.intensity}.png`;
      downloadDataURL(dataURL, filename);
    } catch (e){
      alert("PNG 저장 중 문제가 생겼어요.");
      console.error(e);
    }
  });

  // A4 만들기
  el.btnMakeA4.addEventListener("click", async ()=>{
    el.btnMakeA4.disabled = true;
    const old = el.btnMakeA4.textContent;
    el.btnMakeA4.textContent = "A4 만드는 중…";
    try{
      await buildA4Sheet();
    } catch (e){
      alert("A4 생성 중 문제가 생겼어요.");
      console.error(e);
    } finally {
      validateStep5();
      el.btnMakeA4.textContent = old;
    }
  });

  // A4 저장
  el.btnSaveA4PNG.addEventListener("click", ()=>{
    if(!state.generatedA4?.dataURL) return;
    const filename = `A4_마음키캡_${getSelectedEmotionLabel()}_강도${state.answers.intensity}.png`;
    downloadDataURL(state.generatedA4.dataURL, filename);
  });

  // Reset
  el.btnReset.addEventListener("click", resetAll);
}

/* =========================================================
   리셋/초기화
========================================================= */
function resetAll(){
  state.step = 1;

  state.emotionCategory = null;
  state.emotionDetail = null;

  state.answers.eyes = null;
  state.answers.brows = null;
  state.answers.mouth = null;
  state.answers.effects = new Set(["none"]);
  state.answers.intensity = 3;

  state.examples = [];
  state.selectedExampleIndex = null;

  state.keycap.shape = "roundrect";
  state.keycap.bgColor = COLOR_PALETTE[0];
  state.keycap.selectedStrategyIndex = null;
  state.keycap.customStrategy = "";

  state.generatedA4 = null;

  setStep(1);

  el.intensitySlider.value = "3";
  el.intensityValue.textContent = "3";
  el.colorPicker.value = COLOR_PALETTE[0];
  el.customStrategy.value = "";

  // segmented reset
  $$(".segbtn").forEach(b=>{
    const active = (b.getAttribute("data-shape") === "roundrect");
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-checked", active ? "true" : "false");
  });

  // A4 preview clear
  const pctx = el.a4Canvas.getContext("2d");
  pctx.clearRect(0,0,el.a4Canvas.width, el.a4Canvas.height);
  el.btnSaveA4PNG.disabled = true;

  renderEmotionCategory();
  renderEmotionDetail();
  renderColorPalette();
  renderStrategies();

  el.questionList.innerHTML = "";
  el.miniPreview.innerHTML = "";

  validateStep1();
  validateStep2();
  validateStep3();
  validateStep4();
  validateStep5();
}

function init(){
  cacheDom();
  setStep(1);

  // 기본 렌더
  renderEmotionCategory();
  renderEmotionDetail();
  renderColorPalette();
  renderStrategies();

  // intensity 초기 표시
  el.intensitySlider.value = String(state.answers.intensity);
  el.intensityValue.textContent = String(state.answers.intensity);

  // Step2 초기(버튼 상태만)
  validateStep1();
  validateStep2();
  validateStep3();
  validateStep4();
  validateStep5();

  bindEvents();
}

/* ✅ 가장 안정적인 시작 */
window.addEventListener("DOMContentLoaded", ()=>{
  try{
    init();
  } catch(e){
    showFatalError(e);
  }
});
