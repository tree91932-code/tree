(() => {
  "use strict";

  const M = window.MANIFEST;
  const D = window.SITE_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC_MAP[c]);
  const phoneThumbnail = path => matchMedia("(max-width:900px)").matches && ["assets/campus/outfit/02-real-s.webp","assets/campus/outfit/03-real-s.webp","assets/campus/outfit/04-real-s.webp","assets/campus/outfit/05-ai-s.webp","assets/campus/pixel/01-real-s.webp","assets/campus/pixel/02-real-s.webp","assets/campus/pixel/11-real-s.webp","assets/campus/snow/00-real-s.webp","assets/campus/snow/02-ai-s.webp","assets/campus/snow/03-real-s.webp","assets/campus/snow/05-real-s.webp","assets/campus/snow/06-real-s.webp","assets/campus/snow/x01-s.webp","assets/sijia/doc-00-s.webp","assets/youyou/party-05-s.webp","assets/youyou/party-06-s.webp"].includes(path) ? path.replace(/\.webp$/, "-mobile.webp") : path;
  const PREVIEW_IMAGES = {"assets/video/e_lanju/poster.webp":"assets/video/e_lanju/poster-preview.webp","assets/video/e_nestle/poster.webp":"assets/video/e_nestle/poster-preview.webp","assets/video/e_reno/poster-phone.webp":"assets/video/e_reno/poster-phone-preview.webp","assets/video/news40/poster.webp":"assets/video/news40/poster-preview.webp","assets/video/oppo2/poster.webp":"assets/video/oppo2/poster-preview.webp","assets/video/oppo6/poster.webp":"assets/video/oppo6/poster-preview.webp","assets/video/pixel/poster.webp":"assets/video/pixel/poster-preview.webp","assets/video/sj1/poster.webp":"assets/video/sj1/poster-preview.webp","assets/video/sj2/poster.webp":"assets/video/sj2/poster-preview.webp","assets/video/sj3/poster.webp":"assets/video/sj3/poster-preview.webp","assets/video/wl1/poster.webp":"assets/video/wl1/poster-preview.webp","assets/video/wl28/poster.webp":"assets/video/wl28/poster-preview.webp","assets/video/wl3/poster.webp":"assets/video/wl3/poster-preview.webp","assets/video/wl4/poster.webp":"assets/video/wl4/poster-preview.webp","assets/video/wl5/poster.webp":"assets/video/wl5/poster-preview.webp","assets/video/wl6/poster.webp":"assets/video/wl6/poster-preview.webp","assets/video/wl7/poster.webp":"assets/video/wl7/poster-preview.webp","assets/video/wlsummer/poster.webp":"assets/video/wlsummer/poster-preview.webp","assets/video/w_fish/poster.webp":"assets/video/w_fish/poster-preview.webp","assets/video/w_jz/poster.webp":"assets/video/w_jz/poster-preview.webp","assets/video/w_lei/poster.webp":"assets/video/w_lei/poster-preview.webp","assets/video/w_street/poster.webp":"assets/video/w_street/poster-preview.webp","assets/video/w_xc/poster.webp":"assets/video/w_xc/poster-preview.webp","assets/video/yy4/poster.webp":"assets/video/yy4/poster-preview.webp"};
  const previewThumbnail = path => PREVIEW_IMAGES[path] || phoneThumbnail(path);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let activeDialog = null;
  let dialogFocus = null;
  function syncBackground() {
    const locked = !!activeDialog || body.classList.contains("is-intro");
    $(".layout").inert = locked;
    $(".topbar").inert = locked;
    if ($(".mobile-nav")) $(".mobile-nav").inert = locked;
    $("#idx").inert = locked || (matchMedia("(max-width: 900px)").matches && !body.classList.contains("is-menu"));
  }
  function enterDialog(el) {
    dialogFocus = document.activeElement;
    activeDialog = el;
    body.classList.add("is-locked");
    syncBackground();
    (el.querySelector("button[data-close]") || el).focus({ preventScroll: true });
  }
  function leaveDialog(el) {
    if (activeDialog !== el) return;
    activeDialog = null;
    body.classList.remove("is-locked");
    syncBackground();
    if (dialogFocus?.isConnected) dialogFocus.focus({ preventScroll: true });
  }
  function setMenu(on) {
    body.classList.toggle("is-menu", on);
    $("#menuBtn").setAttribute("aria-expanded", String(on));
    $("#menuBtn").setAttribute("aria-label", on ? "关闭目录" : "打开目录");
    syncBackground();
  }

  const pad = (n) => String(n).padStart(2, "0");
  const fmtDur = (sec) => {
    const s = Math.round(sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
  };

  const imgs = (key) =>
    key.split("+").flatMap((k) => {
      const [group, name] = k.split(".");
      return M.images[group][name];
    });

  const vinfo = (id) => { const v = { id, ...M.videos[id], ...D.VIDEO_INFO[id] }; v.poster = matchMedia("(max-width:900px)").matches ? v.poster.replace(/\.webp$/, "-mobile.webp") : previewThumbnail(v.poster); return v; };
  const isVertical = (v) => v.h > v.w;

  /* video playlists, keyed by name → [video ids] */
  const LISTS = {};
  const LIST_LABEL = {};
  const register = (name, ids, label) => {
    LISTS[name] = ids;
    LIST_LABEL[name] = label;
    return name;
  };

  /* ---------------------------------------------------------
     Components
     --------------------------------------------------------- */
  function scrubLayer(v) {
    return `<span class="vcard__scrub" style="--frames:${v.frames}" data-sprite="${v.sprite}" data-frames="${v.frames}"></span>`;
  }

  function videoCard(id, list, idx) {
    const v = vinfo(id);
    return `
      <button class="vcard" data-orientation="${isVertical(v) ? "portrait" : "landscape"}" style="--ar:${(v.w / v.h).toFixed(4)}" data-vid="${id}" data-list="${list}" data-idx="${idx}" aria-label="播放：${esc(v.title)}">
        <span class="vcard__screen">
          <picture class="video-poster"><img src="${v.poster}" alt="" loading="lazy" decoding="async" /></picture>
          ${scrubLayer(v)}
          <span class="vcard__ori">${isVertical(v) ? "竖屏" : "横屏"}</span>
          ${v.award ? `<span class="vcard__award">★ ${esc(v.award)}</span>` : ""}
          <span class="vcard__play"></span>
          <span class="vcard__dur">${fmtDur(v.dur)}</span>
          <span class="vcard__bar"><i></i></span>
        </span>
        <span class="vcard__meta">
          <span class="vcard__type">${esc(v.type)}</span>
          <span class="vcard__title">${esc(v.title)}</span>
        </span>
      </button>`;
  }

  function reel(headHtml, ids, list, label) {
    register(list, ids, label);
    return `
      <div class="reel" data-reel>
        <div class="reel__head">${headHtml}
          <div class="reel__nav"><button data-dir="-1" aria-label="向左滚动">←</button><button data-dir="1" aria-label="向右滚动">→</button></div>
        </div>
        <div class="reel__strip"><div class="reel__track">${ids.map((id, i) => videoCard(id, list, i)).join("")}</div></div>
      </div>`;
  }

  function featureCard(id, list, label) {
    register(list, [id], label);
    const v = vinfo(id);
    return `
      <button class="feature" data-vid="${id}" data-list="${list}" data-idx="0" aria-label="播放：${esc(v.title)}">
        <span class="feature__screen">
          <picture class="video-poster"><img src="${v.poster}" alt="" loading="lazy" decoding="async" /></picture>
          ${scrubLayer(v)}
          <span class="play-dot"></span>
          <span class="vcard__dur">${fmtDur(v.dur)}</span>
          <span class="vcard__bar"><i></i></span>
        </span>
        <span class="feature__info">
          <small>${esc(v.type)} · ${fmtDur(v.dur)}</small>
          <span class="feature__title">${esc(v.title)}</span>
          <span class="feature__note">${esc(v.note)}</span>
          <span class="btn btn--red feature__btn">▶ 进入放映厅</span>
        </span>
      </button>`;
  }

  function moduleHead(title, sub) {
    return `<div class="module__head"><h4>${esc(title)}</h4>${sub ? `<span>${esc(sub)}</span>` : ""}</div>`;
  }

  /* ---------------------------------------------------------
     About · film strip
     --------------------------------------------------------- */
  function renderFilmstrip() {
    const c = M.images.campus;
    const picks = [
      c.snow.pairs[0].ai, c.outfit.pairs[0].ai, c.pixel.pairs[0].ai, c.snow.pairs[5].ai,
      c.outfit.pairs[3].ai, c.pixel.pairs[8].ai, c.snow.extras[0], c.outfit.pairs[9].ai, c.pixel.pairs[11].ai,
    ];
    const html = picks.map((p) => `<img src="${p.s}" alt="" loading="lazy" decoding="async" />`).join("");
    $("#filmstrip").innerHTML = `<div class="filmstrip__reel">${html}${html}</div>`;
  }

  /* ---------------------------------------------------------
     Projects
     --------------------------------------------------------- */
  function metricHtml(m, i) {
    const numeric = /^[\d.'"+]+$/.test(m.value);
    return `<div class="metric" style="--i:${i}"><b class="${numeric ? "" : "is-text"}">${esc(m.value)}${m.unit ? `<small>${esc(m.unit)}</small>` : ""}</b><span>${esc(m.label)}</span></div>`;
  }

  function campusModule() {
    const sets = D.CAMPUS_SETS;
    return `
      <div class="module campus" id="campus">
        ${moduleHead("实拍 vs AI · 前后对比", "拖动中间的滑块，看校园如何被 AI 重新想象")}
        <div class="campus__sets" role="tablist">
          ${sets.map((s, i) => `<button class="campus__set${i ? "" : " is-active"}" data-set="${s.key}">${esc(s.name)}<i>${s.en}</i></button>`).join("")}
        </div>
        <p class="campus__desc"><span id="campusDesc"></span><a id="campusLink" target="_blank" rel="noopener"></a></p>
        <div class="campus__grid">
          <div class="ba" id="ba" role="slider" tabindex="0" aria-label="实拍与 AI 图片对比" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
            <img class="ba__real" id="baReal" alt="实拍原图" />
            <div class="ba__ai"><img id="baAi" alt="AI 生成图" /></div>
            <span class="ba__handle"></span>
            <span class="ba__label ba__label--l">实拍 ORIGINAL</span>
            <span class="ba__label ba__label--r">AI 生成</span>
          </div>
          <div class="ba__thumbs" id="baThumbs"></div>
        </div>
        <div id="campusMore"></div>
      </div>`;
  }

  function charactersModule(p) {
    return `
      <div class="module">
        ${moduleHead("角色设定 · 思嘉和她的朋友们", "悬停 / 点击卡片翻面查看人设")}
        <div class="chars stagger">
          ${p.characters
            .map((c, i) => {
              const im = imgs(c.key)[0];
              return `
              <button class="char" style="--i:${i}" aria-label="${esc(c.name)}：${esc(c.desc)}">
                <span class="char__in">
                  <span class="char__face char__front">
                    <img src="${previewThumbnail(im.s)}" alt="" loading="lazy" decoding="async" />
                    <span class="char__label"><b>${esc(c.name)}</b><i>${esc(c.en)}</i></span>
                  </span>
                  <span class="char__face char__back">
                    <span class="char__n">${esc(c.name)}<small>${esc(c.en)}</small></span>
                    <span class="char__d">${esc(c.desc)}</span>
                  </span>
                </span>
              </button>`;
            })
            .join("")}
        </div>
      </div>`;
  }

  function galleryModule(groups, title) {
    return `
      <div class="module">
        ${moduleHead(title, "点击查看大图")}
        <div class="polas stagger">
          ${groups
            .map((g, i) => {
              const list = imgs(g.key);
              return `
              <button class="pola" style="--i:${i}" data-gal="${g.key}" data-title="${esc(g.title)}">
                <span class="pola__img"><img src="${previewThumbnail(list[0].s)}" alt="" loading="lazy" decoding="async" /><span class="pola__count">${list.length} P</span></span>
                <span class="pola__cap">${esc(g.title)}</span>
              </button>`;
            })
            .join("")}
        </div>
      </div>`;
  }

  function boardModule(p) {
    return `
      <div class="module">
        ${moduleHead("交付清单", "全部节点已完成")}
        <ul class="checklist">
          ${p.board.map((b, i) => `<li style="--i:${i}"><span>${esc(b.k)}</span><b>${esc(b.v)}</b>${b.d ? `<small>${esc(b.d)}</small>` : ""}</li>`).join("")}
        </ul>
      </div>`;
  }

  function renderCase(p) {
    const label = `CASE ${p.no} · ${p.tab}`;
    const mods = [];
    if (p.feature) mods.push(`<div class="module">${moduleHead("成片", "横屏 · 院庆研讨会现场播放")}${featureCard(p.feature, `case-${p.id}-feature`, label)}</div>`);
    if (p.campus) mods.push(campusModule());
    if (p.characters) mods.push(charactersModule(p));
    (p.reels || []).forEach((r, i) => {
      mods.push(`<div class="module">${reel(moduleHead(r.title, `${r.sub} · ${r.videos.length} 部`), r.videos, `case-${p.id}-${i}`, label)}</div>`);
    });
    if (p.gallery) mods.push(galleryModule(p.gallery, "视觉物料"));
    if (p.board) mods.push(boardModule(p));

    return `
      <article class="case" id="case-${p.id}" data-case="${p.id}" role="tabpanel" aria-labelledby="tab-${p.id}">
        <div class="case__sheet" style="--accent:${p.color}">
          <div class="case__top">
            <div>
              <div class="case__meta"><span class="case__no">CASE ${p.no}</span><span>${esc(p.date)}</span><span class="case__role">${esc(p.role)}</span></div>
              <h3 class="case__title">${esc(p.title)}</h3>
              <p class="case__client">${esc(p.client)}</p>
              <p class="case__sum">${esc(p.summary)}</p>
              <ul class="case__tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
            </div>
            <div class="case__metrics stagger">${p.metrics.map(metricHtml).join("")}</div>
          </div>
          ${mods.join("")}
        </div>
      </article>`;
  }

  function renderProjects() {
    $("#caseTabs").innerHTML = D.PROJECTS.map(
      (p) => `<button class="case-tab" id="tab-${p.id}" role="tab" aria-controls="case-${p.id}" data-case="${p.id}"><b>${p.no}</b><span>${esc(p.tab)}</span></button>`
    ).join("");
    $("#caseBody").innerHTML = D.PROJECTS.map(renderCase).join("");
    $("#idxSub").innerHTML = D.PROJECTS.map((p) => `<button data-case="${p.id}" data-no="${p.no}">${esc(p.tab)}</button>`).join("");
  }

  let currentCase = null;
  function selectCase(id, scroll) {
    if (id === currentCase && !scroll) return;
    currentCase = id;
    if (matchMedia("(max-width:900px)").matches) $$(`.case[data-case="${id}"] img`).slice(0, 4).forEach(im => { im.loading = "eager"; });
    $$(".case-tab").forEach((t) => {
      const on = t.dataset.case === id;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
    });
    $$("#idxSub button").forEach((b) => b.classList.toggle("is-current", b.dataset.case === id));
    $$(".case").forEach((c) => {
      c.classList.toggle("is-active", c.dataset.case === id);
      c.hidden = c.dataset.case !== id;
    });
    $$("#caseBody video").forEach((v) => {
      if (!v.closest(".case.is-active")) v.pause();
    });
    if (id === "campus") campus.show(campus.key || "snow");
    initReels($(`.case[data-case="${id}"]`));
    if (scroll) $("#projects").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }

  /* ---------------------------------------------------------
     Campus before / after
     --------------------------------------------------------- */
  const campus = {
    key: null,
    pairIdx: 0,
    hinted: false,
    show(key) {
      const set = D.CAMPUS_SETS.find((s) => s.key === key);
      const data = M.images.campus[key];
      this.key = key;
      $$(".campus__set").forEach((b) => b.classList.toggle("is-active", b.dataset.set === key));
      $("#campusDesc").textContent = set.desc;
      const link = $("#campusLink");
      link.hidden = !set.link;
      if (set.link) {
        link.href = set.link;
        link.textContent = `${set.linkText} ↗`;
      }
      $("#baThumbs").innerHTML = data.pairs
        .map((p, i) => `<button data-pair="${i}" aria-label="第 ${i + 1} 组"><img src="${previewThumbnail(p.ai.s)}" alt="" loading="lazy" decoding="async" /></button>`)
        .join("");
      this.pair(0);
      this.renderMore(key, set, data);
    },
    pair(i) {
      const p = M.images.campus[this.key].pairs[i];
      this.pairIdx = i;
      const ba = $("#ba");
      ba.style.aspectRatio = `${p.ai.w} / ${p.ai.h}`;
      $("#baReal").src = p.real.l;
      $("#baAi").src = p.ai.l;
      $$("#baThumbs button").forEach((b, k) => b.classList.toggle("is-active", k === i));
      const active = $(`#baThumbs button[data-pair="${i}"]`);
      if (active) active.scrollIntoView({ block: "nearest", inline: "nearest" });
    },
    renderMore(key, set, data) {
      const more = $("#campusMore");
      $$("video", more).forEach((v) => v.pause());
      if (set.video) {
        const v = vinfo(set.video);
        const lb = vinfo("longbao");
        register("campus-pixel", ["pixel", "longbao"], "CASE 03 · 像素黑大");
        more.innerHTML = `
          <div class="campus__pixel">
            <div class="pixel-tv">
              <video src="${v.src}" poster="${v.poster}" muted loop playsinline autoplay preload="metadata"></video>
              <button class="pixel-tv__btn" data-vid="pixel" data-list="campus-pixel" data-idx="0">▶ 有声观看成片 · ${fmtDur(v.dur)}</button>
            </div>
            <div class="gameboy">
              <div class="gameboy__screen"><video src="${lb.src}" poster="${lb.poster}" muted loop playsinline autoplay preload="metadata"></video></div>
              <p><b>LONG BAO</b><br />像素吉祥物 · 龙宝<br />行走动画 5s LOOP</p>
            </div>
          </div>`;
      } else if (data.extras.length) {
        register(`campus-extra-${key}`, [], "");
        more.innerHTML = `
          <div class="module campus__extra">
            ${moduleHead("更多 AI 冰雪校园", `${data.extras.length} 张`)}
            <div class="polas stagger is-in">
              ${data.extras
                .map((e, i) => `<button class="pola" style="--i:${i}" data-campus-extra="${i}"><span class="pola__img"><img src="${e.s}" alt="" loading="lazy" decoding="async" /></span></button>`)
                .join("")}
            </div>
          </div>`;
      } else {
        more.innerHTML = "";
      }
    },
    hint() {
      if (this.hinted || reduced) return;
      this.hinted = true;
      const ba = $("#ba");
      const frames = [50, 18, 82, 50];
      const t0 = performance.now();
      const dur = 2200;
      const step = (t) => {
        const k = clamp((t - t0) / dur, 0, 1);
        const seg = Math.min(frames.length - 2, Math.floor(k * (frames.length - 1)));
        const local = k * (frames.length - 1) - seg;
        const e = 0.5 - Math.cos(local * Math.PI) / 2;
        ba.style.setProperty("--pos", `${frames[seg] + (frames[seg + 1] - frames[seg]) * e}%`);
        ba.setAttribute("aria-valuenow", String(Math.round(frames[seg] + (frames[seg + 1] - frames[seg]) * e)));
        if (k < 1) campus.hintFrame = requestAnimationFrame(step);
      };
      this.hintFrame = requestAnimationFrame(step);
    },
  };

  function initBeforeAfter() {
    const ba = $("#ba");
    if (!ba) return;
    let dragging = false;
    const setValue = (value) => {
      const pos = clamp(value, 0, 100);
      ba.style.setProperty("--pos", `${pos}%`);
      ba.setAttribute("aria-valuenow", String(Math.round(pos)));
    };
    const setPos = (e) => {
      const r = ba.getBoundingClientRect();
      setValue(((e.clientX - r.left) / r.width) * 100);
    };
    ba.addEventListener("keydown", (e) => {
      const raw = parseFloat(ba.style.getPropertyValue("--pos"));
      const value = Number.isFinite(raw) ? raw : 50;
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      cancelAnimationFrame(campus.hintFrame);
      campus.hinted = true;
      setValue(e.key === "Home" ? 0 : e.key === "End" ? 100 : value + (e.key === "ArrowLeft" ? -5 : 5));
    });
    ba.addEventListener("pointerdown", (e) => {
      cancelAnimationFrame(campus.hintFrame);
      campus.hinted = true;
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      setPos(e);
    });
    ba.addEventListener("pointermove", (e) => dragging && setPos(e));
    ba.addEventListener("pointerup", () => (dragging = false));
    ba.addEventListener("pointercancel", () => (dragging = false));

    $("#campus").addEventListener("click", (e) => {
      const setBtn = e.target.closest("[data-set]");
      if (setBtn) campus.show(setBtn.dataset.set);
      const pairBtn = e.target.closest("[data-pair]");
      if (pairBtn) campus.pair(+pairBtn.dataset.pair);
      const extra = e.target.closest("[data-campus-extra]");
      if (extra) openLightbox(M.images.campus[campus.key].extras, +extra.dataset.campusExtra, "AI 看黑大 · 冰雪世界");
    });

    new IntersectionObserver(
      (entries, obs) => {
        if (entries.some((en) => en.isIntersecting)) {
          campus.hint();
          obs.disconnect();
        }
      },
      { threshold: 0.6 }
    ).observe(ba);
  }

  /* ---------------------------------------------------------
     Works
     --------------------------------------------------------- */
  function renderWorks() {
    $("#idxWorksSub").innerHTML = D.WORK_ROWS.map((r, i) => `<a href="#row-${esc(r.id)}" data-no="${pad(i + 1)}">${esc(r.title)}</a>`).join("");
    const v = vinfo("w_lei");
    register("works-now", ["w_lei"], "本期主映");
    $("#nowShowing").innerHTML = `
      <button class="now" data-vid="w_lei" data-list="works-now" data-idx="0" aria-label="播放：${esc(v.title)}">
        <span class="now__screen">
          <img src="${v.poster}" alt="" loading="lazy" decoding="async" />
          ${scrubLayer(v)}
          <span class="play-dot"></span>
          <span class="vcard__dur">${fmtDur(v.dur)}</span>
          <span class="vcard__bar"><i></i></span>
        </span>
        <span class="now__info">
          <span class="now__kicker">NOW SHOWING · 本期主映</span>
          <span class="now__title">${esc(v.title)}</span>
          <span class="now__award">★ 2026 全国大学生计算机设计大赛 · 国家级三等奖</span>
          <span class="now__note">${esc(v.note)}</span>
          <span class="now__actions"><span class="btn btn--red">▶ 立即放映</span><span class="now__details">${esc(v.type)} · ${fmtDur(v.dur)}</span></span>
        </span>
      </button>`;

    $("#workRows").innerHTML = D.WORK_ROWS.map((r) => {
      const list = register(`works-${r.id}`, r.videos, `我的作品 · ${r.title}`);
      const renderCards = ids => ids.map(id => videoCard(id, list, r.videos.indexOf(id))).join("");
      const groups = `<div class="work-grid${r.id === "drama" ? "" : " work-grid--mixed"}">${renderCards(r.videos)}</div>`;
      return `
      <div class="work-row" id="row-${r.id}" data-reveal>
        <div class="work-row__title"><h3>${esc(r.title)}</h3><em>${esc(r.en)}</em><b>${r.videos.length} 部</b><span>${esc(r.sub)}</span></div>
        ${groups}
      </div>`;
    }).join("");
    document.querySelectorAll('.work-grid--mixed').forEach(grid => {
      let frame;
      const layout = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          grid.querySelectorAll('.vcard').forEach(card => {
            if (matchMedia('(max-width: 900px)').matches) {
              card.style.removeProperty('grid-row-end');
              return;
            }
            card.style.gridRowEnd = 'span ' + Math.ceil((card.getBoundingClientRect().height + 12) / 20);
          });
        });
      };
      const observer = new ResizeObserver(layout);
      matchMedia('(max-width: 900px)').addEventListener('change', layout);
      grid.querySelectorAll('.vcard').forEach(card => observer.observe(card));
      layout();
      document.fonts.ready.then(layout);
    });
  }

  /* ---------------------------------------------------------
     Design
     --------------------------------------------------------- */
  function renderDesign() {
    const [magic, ...rest] = D.DESIGN;
    const slides = imgs(magic.key);
    const pins = rest
      .map((g, i) => {
        const list = imgs(g.key);
        const [first, ...others] = list;
        return `
        <button class="pin-card" style="--i:${i}" data-gal="${g.key}" data-title="${esc(g.title)}">
          <span class="tape"></span>
          <span class="pin-card__imgs">
            <img class="pin-card__main" src="${previewThumbnail(first.s)}" alt="" loading="lazy" decoding="async" width="${first.w}" height="${first.h}" />
            ${others.length ? `<span class="pin-card__row" style="--n:${Math.min(3, others.length)}">${others.slice(0, 3).map((o) => `<img src="${previewThumbnail(o.s)}" alt="" loading="lazy" decoding="async" />`).join("")}</span>` : ""}
          </span>
          ${list.length > 1 ? `<span class="pin-card__more">${list.length} P</span>` : ""}
          <span class="pin-card__tag">${esc(g.tag)}</span>
          <span class="pin-card__title">${esc(g.title)}</span>
          <span class="pin-card__sub">${esc(g.sub)}</span>
          <span class="pin-card__note">${esc(g.note)}</span>
          ${g.link ? `<span class="pin-card__link" data-href="${g.link}">查看直播相册 ↗</span>` : ""}
        </button>`;
      })
      .join("");

    $("#designBoard").innerHTML = `
      <div class="projector" data-reveal>
        <div class="projector__screen" id="projScreen" role="button" tabindex="0" aria-label="查看大图">
          ${slides.map((s, i) => `<img src="${previewThumbnail(s.s)}" alt="《你的魔法书包》第 ${i + 1} 页" ${i ? 'loading="lazy"' : ""} decoding="async" class="${i ? "" : "is-on"}" />`).join("")}
          <span class="projector__progress" id="projProgress"></span>
        </div>
        <div class="projector__info">
          <small>FEATURED · ${esc(magic.tag)}</small>
          <h3>${esc(magic.title)}</h3>
          <h4>${esc(magic.sub)}</h4>
          <p>${esc(magic.note)}</p>
          <div class="projector__ctrl">
            <button id="projPrev" aria-label="上一页">←</button>
            <span id="projCount">01 / ${pad(slides.length)}</span>
            <button id="projNext" aria-label="下一页">→</button>
          </div>
          <div class="projector__dots" id="projDots">${slides.map((_, i) => `<button data-slide="${i}" aria-label="第 ${i + 1} 页" class="${i ? "" : "is-on"}"></button>`).join("")}</div>
        </div>
      </div>
      <div class="pins">${pins}</div>`;

    initProjector(slides, magic.title);
  }

  function initProjector(slides, title) {
    const screen = $("#projScreen");
    const imgsEl = $$("img", screen);
    const dots = $$("#projDots button");
    const prog = $("#projProgress");
    const DELAY = 3800;
    let idx = 0;
    let timer = null;
    let visible = false;
    let hover = false;

    let requestedSlide = 0;
    const go = async (i) => {
      const requested = ++requestedSlide;
      const nextIndex = (i + slides.length) % slides.length;
      const image = imgsEl[nextIndex];
      if (matchMedia("(max-width:900px)").matches) {
        image.loading = "eager";
        try { await image.decode(); } catch {}
        if (requested !== requestedSlide) return;
        imgsEl[(nextIndex + 1) % slides.length].loading = "eager";
      }
      idx = nextIndex;
      imgsEl.forEach((im, k) => im.classList.toggle("is-on", k === idx));
      dots.forEach((d, k) => d.classList.toggle("is-on", k === idx));
      $("#projCount").textContent = `${pad(idx + 1)} / ${pad(slides.length)}`;
      restart();
    };
    const restart = () => {
      clearTimeout(timer);
      prog.style.transition = "none";
      prog.style.width = "0";
      if (!visible || hover || reduced) return;
      void prog.offsetWidth;
      prog.style.transition = `width ${DELAY}ms linear`;
      prog.style.width = "100%";
      timer = setTimeout(() => go(idx + 1), DELAY);
    };

    $("#projPrev").addEventListener("click", () => go(idx - 1));
    $("#projNext").addEventListener("click", () => go(idx + 1));
    dots.forEach((d) => d.addEventListener("click", () => go(+d.dataset.slide)));
    screen.addEventListener("click", () => openLightbox(slides, idx, title));
    screen.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      openLightbox(slides, idx, title);
    });
    screen.addEventListener("mouseenter", () => { hover = true; restart(); });
    screen.addEventListener("mouseleave", () => { hover = false; restart(); });
    new IntersectionObserver((en) => {
      visible = en[0].isIntersecting;
      restart();
    }, { threshold: 0.4 }).observe(screen);
  }

  /* ---------------------------------------------------------
     Honors
     --------------------------------------------------------- */
  function renderHonors() {
    const groups = [
      { title: "国家级", c: "#e8b04a", levels: ["national"], mark: "国" },
      { title: "省级 · 行业奖项", c: "#c9ced6", levels: ["province"], mark: "省" },
      { title: "校级荣誉 · 证书", c: "#c98a57", levels: ["school", "cert"], mark: "校" },
    ];
    const cols = groups
      .map((g) => {
        const items = D.HONORS.filter((h) => g.levels.includes(h.level));
        return `
        <div class="honors__col" id="honor-group-${g.levels[0]}" data-honor-group="${g.levels[0]}" style="--c:${g.c}">
          <h3>${g.title}</h3>
          <div class="stagger">
            ${items
              .map(
                (h, i) => `
              <article class="award" id="honor-${D.HONORS.indexOf(h) + 1}" data-honor-level="${h.level}" style="--i:${i}">
                <span class="award__medal" data-text-edit-locked>${h.level === "cert" ? "证" : g.mark}</span>
                <div>
                  <small>${esc(h.year)}</small>
                  <h4>${esc(h.prize)}</h4>
                  <p>${esc(h.title)}${h.note ? `<br /><i>${esc(h.note)}</i>` : ""}</p>
                </div>
              </article>`
              )
              .join("")}
          </div>
        </div>`;
      })
      .join("");
    const count = (lv) => D.HONORS.filter((h) => lv.includes(h.level)).length;
    $("#honors-wall").innerHTML = `
      <div class="honors__sum" data-reveal>
        <div style="--c:#e8b04a"><b data-text-edit-locked data-honor-count="national" data-count="${count(["national"])}">0</b><span>项国家级奖项</span></div>
        <div style="--c:#e6e9ee"><b data-text-edit-locked data-honor-count="province" data-count="${count(["province"])}">0</b><span>项省级 / 行业奖项</span></div>
        <div style="--c:#d99a66"><b data-text-edit-locked data-honor-count="school" data-count="${count(["school", "cert"])}">0</b><span>项校级荣誉与证书</span></div>
      </div>
      <div class="honors__cols">${cols}</div>`;
  }

  /* ---------------------------------------------------------
     Reels: arrows + drag to scroll
     --------------------------------------------------------- */
  function initReels(root = document) {
    $$("[data-reel]", root).forEach((reelEl) => {
      if (reelEl.dataset.ready) return;
      reelEl.dataset.ready = "1";
      const track = $(".reel__track", reelEl);
      const [prev, next] = $$(".reel__nav button", reelEl);
      const update = () => {
        prev.disabled = track.scrollLeft <= 4;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      };
      [prev, next].forEach((b) =>
        b.addEventListener("click", () => track.scrollBy({ left: +b.dataset.dir * track.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" }))
      );
      track.addEventListener("scroll", update, { passive: true });
      new ResizeObserver(update).observe(track);

      let down = false;
      let moved = false;
      let sx = 0;
      let sl = 0;
      track.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        down = true;
        moved = false;
        sx = e.clientX;
        sl = track.scrollLeft;
      });
      window.addEventListener("pointermove", (e) => {
        if (!down) return;
        const dx = e.clientX - sx;
        if (!moved && Math.abs(dx) > 6) {
          moved = true;
          track.classList.add("is-drag");
        }
        if (moved) track.scrollLeft = sl - dx;
      });
      window.addEventListener("pointerup", () => {
        if (!down) return;
        down = false;
        setTimeout(() => track.classList.remove("is-drag"), 0);
      });
      update();
    });
  }

  /* ---------------------------------------------------------
     Scrub preview on posters
     --------------------------------------------------------- */
  function initScrub() {
    const SCREENS = ".vcard__screen, .feature__screen, .now__screen";
    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const screen = e.target.closest && e.target.closest(SCREENS);
      if (!screen) return;
      const scrub = $(".vcard__scrub", screen);
      if (!scrub) return;
      if (!scrub.dataset.loaded) {
        scrub.dataset.loaded = "1";
        const im = new Image();
        im.onload = () => {
          scrub.style.backgroundImage = `url("${scrub.dataset.sprite}")`;
          scrub.classList.add("is-ready");
        };
        im.src = scrub.dataset.sprite;
      }
      const r = screen.getBoundingClientRect();
      const p = clamp((e.clientX - r.left) / r.width, 0, 0.999);
      const n = +scrub.dataset.frames;
      const i = Math.floor(p * n);
      scrub.style.backgroundPosition = `${(i / (n - 1)) * 100}% 0`;
      screen.style.setProperty("--p", `${p * 100}%`);
    });
  }

  /* ---------------------------------------------------------
     Cinema
     --------------------------------------------------------- */
  const cinema = {
    el: $("#cinema"),
    video: $("#cinemaVideo"),
    list: [],
    listName: "",
    idx: 0,
    lastFocus: null,
    open(listName, idx) {
      this.list = LISTS[listName];
      this.listName = listName;
      this.lastFocus = document.activeElement;
      this.el.hidden = false;
      body.classList.add("is-watching", "is-locked");
      $("#cinemaList").innerHTML = this.list
        .map((id, i) => `<button data-i="${i}" aria-label="${esc(vinfo(id).title)}"><img src="${vinfo(id).poster}" alt="" /></button>`)
        .join("");
      $("#cinemaList").hidden = this.list.length < 2;
      requestAnimationFrame(() => requestAnimationFrame(() => this.el.classList.add("is-open")));
      this.load(idx, reduced ? 0 : 800);
      enterDialog(this.el);
    },
    load(idx, delay = 0) {
      this.idx = idx;
      const v = vinfo(this.list[idx]);
      const vert = isVertical(v);
      this.el.classList.toggle("is-v", vert);
      this.el.classList.toggle("is-h", !vert);
      $("#cinemaScreen").style.setProperty("--ar", `${v.w} / ${v.h}`);
      $("#cinemaError").hidden = true;

      const video = this.video;
      video.pause();
      video.poster = v.poster;
      video.src = v.src;
      video.load();
      clearTimeout(this.playTimer);
      this.playTimer = setTimeout(() => video.play().catch(() => {}), delay);

      $("#cinemaKicker").textContent = LIST_LABEL[this.listName] || "放映厅";
      $("#cinemaTitle").textContent = v.title;
      const tags = [v.type, fmtDur(v.dur), vert ? "竖屏" : "横屏", `${v.w}×${v.h}`];
      $("#cinemaTags").innerHTML =
        (v.award ? `<span class="is-award">★ ${esc(v.award)}</span>` : "") + tags.map((t) => `<span>${esc(t)}</span>`).join("");
      $("#cinemaNote").textContent = v.note || "";
      $("#cinemaLinks").innerHTML =
        (v.link ? `<a href="${v.link}" target="_blank" rel="noopener">在线观看 ↗</a>` : "") +
        `<a href="${v.src}" download>下载视频</a>`;
      $$("#cinemaList button").forEach((b, i) => b.classList.toggle("is-current", i === idx));
      const cur = $("#cinemaList .is-current");
      if (matchMedia("(max-width:900px)").matches) {
        this.el.scrollTop = 0;
        const strip = $("#cinemaList");
        if (cur) strip.scrollLeft = Math.max(0, cur.offsetLeft - strip.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2);
      } else if (cur) cur.scrollIntoView({ block: "nearest" });
      $("#cinemaCount").textContent = `${pad(idx + 1)} / ${pad(this.list.length)}`;
      $("#cinemaPrev").disabled = idx === 0;
      $("#cinemaNext").disabled = idx === this.list.length - 1;
    },
    showError() {
      const v = vinfo(this.list[this.idx]);
      const hevc = v.codec === "hevc";
      const box = $("#cinemaError");
      box.hidden = false;
      box.innerHTML = `
        <b>${hevc ? "当前浏览器无法解码 H.265 (HEVC) 视频" : "视频暂时无法播放"}</b>
        <p>${hevc ? "这部作品是 HEVC 高清编码。请使用最新版 Microsoft Edge / Chrome（需显卡支持 HEVC 硬件解码），或用在线链接 / 本地播放器观看。" : "请确认网站文件夹与作品文件夹的相对位置没有改变，或使用在线链接观看。"}</p>
        ${v.link ? `<a class="btn btn--red" href="${v.link}" target="_blank" rel="noopener">在线观看 ↗</a>` : ""}
        <a class="btn btn--ghost" href="${v.src}" download>下载后用本地播放器观看</a>
        <code>${esc(v.file)}</code>`;
    },
    close() {
      this.el.classList.remove("is-open");
      clearTimeout(this.playTimer);
      this.video.pause();
      body.classList.remove("is-watching", "is-locked");
      setTimeout(() => {
        if (this.el.classList.contains("is-open")) return;
        this.el.hidden = true;
        this.video.removeAttribute("src");
        this.video.load();
      }, 650);
      leaveDialog(this.el);
    },
    step(d) {
      const n = this.idx + d;
      if (n >= 0 && n < this.list.length) this.load(n);
    },
    init() {
      this.video.addEventListener("error", () => this.showError());
      this.video.addEventListener("loadedmetadata", () => {
        if (this.video.videoWidth === 0) this.showError();
      });
      this.el.addEventListener("click", (e) => {
        if (e.target.closest("[data-close]")) this.close();
        const b = e.target.closest("#cinemaList button");
        if (b) this.load(+b.dataset.i);
      });
      $("#cinemaPrev").addEventListener("click", () => this.step(-1));
      $("#cinemaNext").addEventListener("click", () => this.step(1));
      this.video.addEventListener("ended", () => this.step(1));
    },
  };

  /* ---------------------------------------------------------
     Lightbox
     --------------------------------------------------------- */
  const lb = { el: $("#lightbox"), list: [], idx: 0, title: "" };
  function openLightbox(list, idx, title) {
    lb.list = list;
    lb.title = title;
    lb.el.hidden = false;
    body.classList.add("is-locked");
    $("#lbThumbs").innerHTML = list.map((it, i) => `<button data-i="${i}"><img src="${it.s}" alt="" loading="lazy" /></button>`).join("");
    $("#lbThumbs").hidden = list.length < 2;
    $("#lbPrev").hidden = $("#lbNext").hidden = list.length < 2;
    if (matchMedia("(min-width:901px)").matches) {
      const image = $("#lbImg");
      image.onload = null;
      image.removeAttribute("src");
      image.style.opacity = "0";
    } else {
      const image = $("#lbImg");
      image.onload = null;
      image.src = list[idx].s;
      image.alt = title + " · 第 " + (idx + 1) + " 张";
      image.style.opacity = "1";
    }
    showLightbox(idx);
    enterDialog(lb.el);
  }
  /* Decode before swapping and keep nearby full-size images warm. */
  const lightboxImageCache = new Map();
  let lightboxImageRequest = 0;
  function prepareLightboxImage(path, priority = 'low') {
    if (lightboxImageCache.has(path)) return lightboxImageCache.get(path).ready;
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = priority;
    const ready = new Promise((resolve, reject) => {
      image.onload = async () => {
        try { await image.decode(); } catch {}
        resolve(image);
      };
      image.onerror = () => { lightboxImageCache.delete(path); reject(new Error('Image unavailable')); };
    });
    lightboxImageCache.set(path, {image, ready});
    image.src = path;
    while (lightboxImageCache.size > (matchMedia("(max-width:900px)").matches ? 4 : 6)) lightboxImageCache.delete(lightboxImageCache.keys().next().value);
    return ready;
  }
  async function showPreparedLightbox(i) {
    const request = ++lightboxImageRequest;
    const list = lb.list;
    const index = (i + list.length) % list.length;
    lb.idx = index;
    const item = list[index];
    const img = $("#lbImg");
    lb.el.setAttribute('aria-busy', 'true');
    try {
      await prepareLightboxImage(item.l, 'high');
      if (request !== lightboxImageRequest || lb.el.hidden || lb.list !== list) return;
      img.onload = null;
      img.src = item.l;
      img.alt = lb.title + ' · 第 ' + (index + 1) + ' 张';
      img.style.opacity = '1';
      if (!reduced && img.animate) img.animate([{opacity:0.86},{opacity:1}], {duration:160,easing:'ease-out'});
      $("#lbTitle").textContent = lb.title;
      $("#lbCount").textContent = pad(index + 1) + ' / ' + pad(list.length);
      $$("#lbThumbs button").forEach((button, k) => button.classList.toggle('is-current', k === index));
      const current = $("#lbThumbs .is-current");
      if (current) current.scrollIntoView({block:'nearest',inline:'center'});
      lb.el.removeAttribute('aria-busy');
      if (list.length > 1) [index - 1, index + 1].forEach(next => {
        prepareLightboxImage(list[(next + list.length) % list.length].l).catch(() => {});
      });
    } catch {
      if (request !== lightboxImageRequest || lb.el.hidden) return;
      lb.el.removeAttribute('aria-busy');
      toast('图片暂时加载失败，请重试');
    }
  }
  function showLightbox(i) {
    return showPreparedLightbox(i);
  }
  function closeLightbox() {
    lightboxImageRequest++;
    lb.el.removeAttribute("aria-busy");
    lb.el.hidden = true;
    body.classList.remove("is-locked");
    leaveDialog(lb.el);
  }
  function initLightbox() {
    lb.el.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) closeLightbox();
      const t = e.target.closest("#lbThumbs button");
      if (t) showLightbox(+t.dataset.i);
    });
    $("#lbPrev").addEventListener("click", () => showLightbox(lb.idx - 1));
    $("#lbNext").addEventListener("click", () => showLightbox(lb.idx + 1));
  }

  /* ---------------------------------------------------------
     Ticket zoom
     --------------------------------------------------------- */
  function initTicket() {
    const zoom = $("#ticketZoom");
    const holder = $("#ticketHolder");
    $("#ticket").addEventListener("click", () => {
      holder.innerHTML = "";
      holder.appendChild($("#ticket .ticket__paper").cloneNode(true));
      zoom.hidden = false;
      body.classList.add("is-locked");
      enterDialog(zoom);
    });
    zoom.addEventListener("pointermove", (e) => {
      const rx = (e.clientY / innerHeight - 0.5) * -18;
      const ry = (e.clientX / innerWidth - 0.5) * 22;
      holder.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    zoom.addEventListener("click", (e) => {
      if (e.target.closest(".ticket__paper")) return;
      zoom.hidden = true;
      holder.style.transform = "";
      body.classList.remove("is-locked");
      leaveDialog(zoom);
    });
  }

  /* ---------------------------------------------------------
     Intro
     --------------------------------------------------------- */
  let revealStarted = false;
  function initIntro() {
    const intro = $("#intro");
    const folder = $("#folder");
    const lamp = $(".lamp--intro");
    const hint = $(".intro__hint span", intro);
    let stage = "desk";
    let stageTimer;
    const overheadImage = new Image();
    overheadImage.fetchPriority = "low";
    const phoneIntro = matchMedia("(max-width:900px)").matches;
    if (phoneIntro) overheadImage.src = "assets/intro/study-tabletop-original-phone.webp";
    const overheadReady = phoneIntro ? overheadImage.decode().catch(() => {}) : Promise.resolve();
    const setStage = (value) => {
      stage = value;
      intro.dataset.stage = value;
    };
    const finish = (instant) => {
      if (!body.classList.contains("is-intro")) return;
      clearTimeout(stageTimer);
      setStage("leaving");
      intro.classList.add("is-leaving");
      setTimeout(() => {
        body.classList.remove("is-intro");
        window.scrollTo({ top: 0, behavior: "instant" });
        syncBackground();
        if (intro.contains(document.activeElement)) $(".hero__cta a").focus({ preventScroll: true });
        startReveal();
      }, instant ? 0 : 700);
    };
    const play = () => {
      const returningToDesk = phoneIntro && intro.classList.contains("is-overhead");
      clearTimeout(stageTimer);
      setStage(returningToDesk ? "moving" : "desk");
      hint.textContent = returningToDesk ? "镜头返回书桌…" : "点击档案袋";
      folder.setAttribute("aria-label", "点击档案袋，转到正上方");
      intro.classList.remove("is-leaving");
      intro.classList.remove("is-overhead");
      intro.classList.add("is-daytime");
      intro.dispatchEvent(new Event("study-lamp-reset"));
      folder.classList.remove("is-open");
      if (returningToDesk) {
        stageTimer = setTimeout(() => {
          setStage("desk");
          hint.textContent = "点击档案袋";
        }, reduced ? 0 : 850);
      }
      lamp.classList.add("is-off");
      lamp.classList.remove("is-flicker");
      setTimeout(() => {
        lamp.classList.remove("is-off");
        lamp.classList.add("is-flicker");
      }, 600);
    };

    if (location.hash && location.hash.length > 1) {
      body.classList.remove("is-intro");
      syncBackground();
      startReveal();
    } else {
      play();
    }

    folder.addEventListener("click", async () => {
      if (stage === "preparing" || stage === "moving" || stage === "opening" || stage === "leaving") return;
      if (stage === "desk") {
        if (phoneIntro) {
          setStage("preparing");
          hint.textContent = "正在准备桌面…";
          await overheadReady;
          if (stage !== "preparing") return;
        }
        setStage("moving");
        intro.classList.add("is-overhead");
        hint.textContent = "镜头移向档案袋…";
        stageTimer = setTimeout(() => {
          setStage("overhead");
          hint.textContent = "再次点击档案袋，打开作品集";
          folder.setAttribute("aria-label", "再次点击档案袋，打开作品集");
        }, reduced ? 0 : phoneIntro ? 850 : 2800);
        return;
      }
      setStage("opening");
      folder.classList.add("is-open");
      hint.textContent = "正在打开作品集…";
      stageTimer = setTimeout(() => finish(false), reduced ? 0 : 1000);
    });
    $("#introSkip").addEventListener("click", () => finish(true));
    $("#studyBack").addEventListener("click", () => {
      if ((phoneIntro && stage === "moving") || stage === "opening" || stage === "leaving") return;
      play();
      folder.focus({ preventScroll: true });
    });
    $("#replayIntro").addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "auto" });
      setMenu(false);
      body.classList.add("is-intro");
      syncBackground();
      play();
      folder.focus({ preventScroll: true });
    });
    syncBackground();
  }

  /* ---------------------------------------------------------
     Reveal + counters
     --------------------------------------------------------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const dec = +(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || "";
    if (reduced) {
      el.textContent = target.toFixed(dec) + suffix;
      return;
    }
    const t0 = performance.now();
    const dur = 1600;
    const tick = (t) => {
      const k = clamp((t - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = (target * e).toFixed(dec) + suffix;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function onReveal(el) {
    $$("[data-count]", el).forEach(animateCount);
    if (el.matches("[data-count]")) animateCount(el);
    $$("#transcript li", el).forEach((li) => {
      li.querySelector("i").style.setProperty("--w", `${((+li.dataset.score - 80) / 20) * 100}%`);
    });
  }

  function startReveal() {
    if (revealStarted) return;
    revealStarted = true;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          io.unobserve(en.target);
          onReveal(en.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    $$("[data-reveal], .stagger, .checklist").forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------
     Scroll spy + timecode
     --------------------------------------------------------- */
  function initScrollSpy() {
    const links = $$("#idxNav > a");
    const marker = $(".idx__marker");
    const sections = $$(".sec");
    let current = "";
    let ticking = false;

    const moveMarker = (link) => {
      if (!link) {
        marker.style.opacity = "0";
        return;
      }
      marker.style.opacity = "1";
      marker.style.transform = `translateY(${link.offsetTop}px)`;
      marker.style.height = `${link.offsetHeight}px`;
    };

    const update = () => {
      ticking = false;
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? clamp(y / max, 0, 1) : 0;
      let idx = -1;
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= innerHeight * 0.38) idx = i;
      });
      const id = idx >= 0 ? sections[idx].id : "";
      if (id !== current) {
        current = id;
        links.forEach((a) => a.classList.toggle("is-active", a.dataset.sec === id));
        moveMarker(links.find((a) => a.dataset.sec === id));
      }
      $("#filmFill").style.height = `${p * 100}%`;
    };
    addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    addEventListener("resize", () => {
      current = "";
      update();
    });
    update();
  }

  /* ---------------------------------------------------------
     Misc interactions
     --------------------------------------------------------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-on"), 1800);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast(`已复制：${text.length > 34 ? text.slice(0, 34) + "…" : text}`);
  }

  function initGlobalEvents() {
    let raf = 0;
    addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
        document.documentElement.style.setProperty("--my", `${e.clientY}px`);
      });
    }, { passive: true });

    document.addEventListener("click", (e) => {
      const linkSpan = e.target.closest("[data-href]");
      if (linkSpan) {
        e.stopPropagation();
        window.open(linkSpan.dataset.href, "_blank", "noopener");
        return;
      }
      const vid = e.target.closest("[data-vid]");
      if (vid && !vid.closest(".reel__track.is-drag")) {
        cinema.open(vid.dataset.list, +vid.dataset.idx);
        return;
      }
      const gal = e.target.closest("[data-gal]");
      if (gal) {
        openLightbox(imgs(gal.dataset.gal), 0, gal.dataset.title);
        return;
      }
      const copy = e.target.closest("[data-copy]");
      if (copy) {
        copyText(copy.dataset.copy);
        return;
      }
      const ch = e.target.closest(".char");
      if (ch) ch.classList.toggle("is-flipped");
      const tab = e.target.closest(".case-tab, #idxSub button");
      if (tab) {
        selectCase(tab.dataset.case, !!tab.closest("#idxSub"));
        setMenu(false);
      }
      const caseLink = e.target.closest("[data-case-link]");
      if (caseLink) selectCase(caseLink.dataset.caseLink, false);
      const rowLink = e.target.closest("[data-row-link]");
      if (rowLink) {
        e.preventDefault();
        $(`#row-${rowLink.dataset.rowLink}`).scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
      if (e.target.closest("#idxNav a")) setMenu(false);
      if (body.classList.contains("is-menu") && !e.target.closest("#idx, #menuBtn")) setMenu(false);
    });

    $("#menuBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      setMenu(!body.classList.contains("is-menu"));
    });

    document.addEventListener("keydown", (e) => {
      if (activeDialog && e.key === "Tab") {
        const controls = $$("button:not(:disabled), a[href], video[controls], [tabindex='0']", activeDialog)
          .filter((el) => el.getClientRects().length && !el.closest("[hidden]"));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { e.preventDefault(); activeDialog.focus(); }
        else if (e.shiftKey && (document.activeElement === first || document.activeElement === activeDialog)) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
        return;
      }
      const caseTab = e.target.closest(".case-tab");
      if (caseTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const tabs = $$(".case-tab");
        const idx = tabs.indexOf(caseTab);
        const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (idx + (e.key === "ArrowLeft" ? -1 : 1) + tabs.length) % tabs.length;
        selectCase(tabs[next].dataset.case, false);
        tabs[next].focus({ preventScroll: true });
        return;
      }
      if (!cinema.el.hidden) {
        if (e.key === "Escape") cinema.close();
        if (document.activeElement !== cinema.video) {
          if (e.key === "ArrowLeft") cinema.step(-1);
          if (e.key === "ArrowRight") cinema.step(1);
        }
        return;
      }
      if (!lb.el.hidden) {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") showLightbox(lb.idx - 1);
        if (e.key === "ArrowRight") showLightbox(lb.idx + 1);
        return;
      }
      if (!$("#ticketZoom").hidden && e.key === "Escape") $("#ticketZoom").click();
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  renderFilmstrip();
  renderProjects();
  renderWorks();
  renderDesign();
  renderHonors();

  $$(".stagger").forEach((list) => [...list.children].forEach((c, i) => c.style.setProperty("--i", i)));

  initGlobalEvents();
  initScrub();
  initReels();
  cinema.init();
  initLightbox();
  initTicket();
  initBeforeAfter();
  selectCase(D.PROJECTS[0].id, false);
  initScrollSpy();
  initIntro();
  addEventListener("resize", syncBackground);
})();

/* Load nearby previews and anticipate the destination without fetching every gallery. */
(() => {
 const visible = image => image.getClientRects().length > 0;
 const warm = (panel, anticipate = false) => {
  if (!panel) return;
  const candidates = [...panel.querySelectorAll('img[loading="lazy"]')].filter(image => anticipate || visible(image));
  candidates.slice(0, 6).forEach(image => { image.fetchPriority = 'auto'; image.loading = 'eager'; });
 };
 const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  entry.target.loading = 'eager';
  observer.unobserve(entry.target);
 }), {rootMargin:'400px 0px', threshold:0});
 document.querySelectorAll('img[loading="lazy"]').forEach(image => observer.observe(image));
 const destination = control => {
  const id = control.getAttribute('aria-controls') || control.dataset.page || control.getAttribute('href')?.replace(/^#/, '');
  return id ? document.getElementById(id) : null;
 };
 document.addEventListener('pointerover', event => {
  const control = event.target.closest('.case-tab, .mobile-nav button, a[href^="#"]');
  if (control) warm(destination(control), true);
 }, {passive:true});
 document.addEventListener('focusin', event => {
  const control = event.target.closest('.case-tab, .mobile-nav button, a[href^="#"]');
  if (control) warm(destination(control), true);
 });
 const changes = new MutationObserver(entries => {
  const panels = new Set(entries.map(entry => entry.target.closest('.sec, .hero')));
  requestAnimationFrame(() => panels.forEach(panel => warm(panel)));
 });
 document.querySelectorAll('main.content > .sec, .case, .work-row, .pins, .projector').forEach(panel => changes.observe(panel,{subtree:true,attributes:true,attributeFilter:['class','hidden']}));
})();
