/*
 * Portfolio: orbit layout, card tilt, panels and hash routing.
 * Content comes from projects.js (window.SITE, window.PROJECTS).
 * No build step, no dependencies.
 */
(() => {
  "use strict";

  /* ------------------------------------------------------------------------
     Tunables
     ------------------------------------------------------------------------ */
  const ORBIT_SPEED = 0.012; // radians per second along the orbit. 0 = no drift.
  const BOB_AMP = 6; // px, vertical bobbing amplitude
  const TILT_MAX = 12; // degrees, maximum hover tilt
  const CARD_W = 150;
  const CARD_H = 190;
  const ORB_D = 164; // must match --orb in styles.css
  const PANEL_INTRO_W = 640;
  const PANEL_REPORT_W = 940;

  const PALETTE = ["#FF7A59", "#2DD4BF", "#A78BFA", "#60A5FA", "#FBBF24", "#F472B6", "#A3E635"];
  const STATUSES = ["running", "planned", "idea", "done"];

  const mqMobile = window.matchMedia("(max-width: 759px)");
  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isMobile = () => mqMobile.matches;
  const reduced = () => mqReduce.matches;

  /* ------------------------------------------------------------------------
     Data
     ------------------------------------------------------------------------ */
  const SITE = Object.assign({ name: "", email: "", github: "", linkedin: "" }, window.SITE || {});

  const slug = (s) =>
    String(s)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-_]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project";

  const isColor = (c) => typeof c === "string" && c.trim() !== "" && CSS.supports("color", c);

  function normalize(raw, i, seen) {
    let id = slug(raw.id || raw.name || "project-" + (i + 1));
    if (id === "contact") id = "contact-project";
    let unique = id;
    for (let n = 2; seen.has(unique); n++) unique = id + "-" + n;
    seen.add(unique);
    const status = typeof raw.status === "string" ? raw.status.toLowerCase() : "";
    return Object.assign({}, raw, {
      id: unique,
      name: raw.name || unique,
      glyph: raw.glyph || String(raw.name || "?").charAt(0).toUpperCase(),
      color: isColor(raw.color) ? raw.color : PALETTE[i % PALETTE.length],
      accent2: isColor(raw.accent2) ? raw.accent2 : null,
      kind: raw.kind || "",
      status,
      statusClass: STATUSES.includes(status) ? "st-" + status : status ? "st-unknown" : "",
      problem: raw.problem || "",
      conclusion: raw.conclusion || "",
      kpis: Array.isArray(raw.kpis) ? raw.kpis.filter((k) => k && k.value != null).slice(0, 3) : [],
      stack: Array.isArray(raw.stack) ? raw.stack.filter(Boolean) : [],
      report: Array.isArray(raw.report) && raw.report.length ? raw.report : null,
    });
  }

  let source = Array.isArray(window.PROJECTS) ? window.PROJECTS.filter((p) => p && typeof p === "object") : [];

  // Dev-only: ?demo=16 duplicates the examples to test a crowded layout.
  const demo = parseInt(new URLSearchParams(location.search).get("demo"), 10);
  if (demo > source.length && source.length) {
    const base = source;
    source = [];
    for (let i = 0; i < Math.min(demo, 40); i++) {
      const p = base[i % base.length];
      const copy = i < base.length ? p : Object.assign({}, p, {
        id: (p.id || p.name) + "-" + (Math.floor(i / base.length) + 1),
        name: p.name + " " + (Math.floor(i / base.length) + 1),
        color: PALETTE[i % PALETTE.length],
      });
      source.push(copy);
    }
  }

  const seen = new Set();
  const PROJECTS = source.map((p, i) => normalize(p, i, seen));
  const byId = new Map(PROJECTS.map((p) => [p.id, p]));
  const uniqueColors = [...new Set(PROJECTS.map((p) => p.color.toUpperCase()))];
  const ringColors = uniqueColors.length ? uniqueColors : PALETTE.slice(0, 4);
  const CONTACT_ACCENT = isColor(SITE.accent) ? SITE.accent : "#A78BFA";

  /* ------------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);

  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const safeUrl = (u) => {
    const s = String(u || "").trim();
    return /^(https?:|mailto:|\.{0,2}\/|#)/i.test(s) || /^[\w\-./]+$/.test(s) ? s : "";
  };

  // Minimal inline formatting for text in projects.js: **bold**, `code`, [text](url).
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
        const url = safeUrl(u.replace(/&amp;/g, "&"));
        return url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${t}</a>` : t;
      });
  }

  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const ICONS = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7l8 6 8-6"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  };

  /* ------------------------------------------------------------------------
     DOM setup
     ------------------------------------------------------------------------ */
  const root = document.documentElement;
  const body = document.body;
  const stage = $("#stage");
  const cardsEl = $("#cards");
  const orbEl = $("#orb");
  const panel = $("#panel");
  const panelInner = $("#panel-inner");
  const footer = $("#footer");

  const baseTitle = SITE.name ? `${SITE.name} · ML portfolio` : "ML portfolio";
  document.title = baseTitle;
  $("#site-title").textContent = baseTitle;
  footer.textContent = SITE.name ? `${SITE.name}'s portfolio` : "Portfolio";
  root.style.setProperty("--ring", [...ringColors, ringColors[0]].join(", "));
  document.querySelectorAll(".glow").forEach((g, i) => g.style.setProperty("--c", ringColors[i % ringColors.length]));

  // Items: everything that moves on the stage (the orb + one per card).
  const items = [];
  const rand = (() => {
    let s = 7; // deterministic so layouts look the same on reload
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  })();

  function makeItem(el, kind, w, h, project) {
    return {
      el,
      kind,
      project,
      id: project ? project.id : "contact",
      inner: el.querySelector(".card-inner"),
      w,
      h,
      x: innerWidth / 2,
      y: innerHeight / 2,
      s: 0.3,
      tx: innerWidth / 2,
      ty: innerHeight / 2,
      ts: 1,
      bobPhase: rand() * Math.PI * 2,
      bobSpeed: 0.55 + rand() * 0.5,
      bobPhaseX: rand() * Math.PI * 2,
      bobDamp: 1,
      lag: 0,
      hover: false,
      ring: 0,
      baseAngle: 0,
      tilt: { x: 0, y: 0, tx: 0, ty: 0, l: 0, tl: 0, mx: 50, my: 0, shine: 0, live: false },
    };
  }

  const orbItem = makeItem(orbEl, "orb", ORB_D, ORB_D, null);
  orbItem.bobDamp = 0.5;
  items.push(orbItem);

  const cardItems = PROJECTS.map((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.dataset.id = p.id;
    btn.style.setProperty("--c", p.color);
    btn.setAttribute("aria-label", [p.name, p.kind, p.status && "status: " + p.status].filter(Boolean).join(", "));
    btn.innerHTML = `
      <span class="card-inner">
        <span class="card-shine" aria-hidden="true"></span>
        <span class="card-glyph" aria-hidden="true">${esc(p.glyph)}</span>
        <span class="card-name">${esc(p.name)}</span>
        ${p.kind ? `<span class="card-kind">${esc(p.kind)}</span>` : ""}
        ${p.status ? `<span class="card-status ${p.statusClass}"><span class="dot"></span>${esc(p.status)}</span>` : ""}
      </span>`;
    cardsEl.appendChild(btn);
    const it = makeItem(btn, "card", CARD_W, CARD_H, p);
    it.inner.style.setProperty("--shadow", `color-mix(in srgb, ${p.color} 40%, transparent)`);
    btn.addEventListener("click", () => go(p.id));
    bindTilt(it);
    items.push(it);
    return it;
  });

  orbEl.addEventListener("click", () => go("contact"));
  orbEl.addEventListener("pointerenter", () => (orbItem.hover = true));
  orbEl.addEventListener("pointerleave", () => (orbItem.hover = false));

  /* ------------------------------------------------------------------------
     Hover tilt: the side under the cursor sinks, eased with lerp in the loop
     ------------------------------------------------------------------------ */
  function bindTilt(it) {
    const el = it.el;
    const t = it.tilt;
    el.addEventListener("pointerenter", (e) => {
      it.hover = true;
      if (e.pointerType === "touch") return;
      el.classList.add("is-hot");
    });
    el.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch" || reduced() || isMobile()) return;
      // The button's own rect is not affected by the inner tilt, so no feedback jitter.
      const r = el.getBoundingClientRect();
      const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      const ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      t.ty = nx * TILT_MAX; // rotateY > 0 pushes the right edge away
      t.tx = -ny * TILT_MAX; // rotateX < 0 pushes the bottom edge away
      t.tl = 1;
      t.mx = (nx + 1) * 50;
      t.my = (ny + 1) * 50;
      t.live = true;
    });
    el.addEventListener("pointerleave", () => {
      it.hover = false;
      t.tx = t.ty = t.tl = 0;
    });
  }

  function applyTilt(it, dt) {
    const t = it.tilt;
    if (!t.live) return;
    const k = 1 - Math.exp(-dt * 9);
    t.x = lerp(t.x, t.tx, k);
    t.y = lerp(t.y, t.ty, k);
    t.l = lerp(t.l, t.tl, k);
    t.shine = lerp(t.shine, it.hover ? 1 : 0, k);
    const st = it.inner.style;
    const settled = !it.hover && Math.abs(t.x) < 0.02 && Math.abs(t.y) < 0.02 && t.l < 0.005;
    if (settled) {
      t.live = false;
      t.x = t.y = t.l = t.shine = 0;
      st.transform = "";
      st.boxShadow = "";
      st.removeProperty("--shine");
      it.el.classList.remove("is-hot");
      return;
    }
    st.transform = `perspective(700px) rotateX(${t.x.toFixed(2)}deg) rotateY(${t.y.toFixed(2)}deg) scale(${(1 + 0.05 * t.l).toFixed(4)})`;
    st.setProperty("--mx", t.mx.toFixed(1) + "%");
    st.setProperty("--my", t.my.toFixed(1) + "%");
    st.setProperty("--shine", t.shine.toFixed(3));
    // Shadow moves opposite to the tilt and grows with the lift.
    const sx = (-t.y / TILT_MAX) * 12;
    const sy = 14 + (t.x / TILT_MAX) * 12 + t.l * 10;
    const blur = 34 + t.l * 20;
    st.boxShadow = `${sx.toFixed(1)}px ${sy.toFixed(1)}px ${blur.toFixed(0)}px -14px var(--shadow), 0 2px 6px rgba(0,0,0,0.4)`;
  }

  function resetTilts() {
    cardItems.forEach((it) => {
      const t = it.tilt;
      t.x = t.y = t.tx = t.ty = t.l = t.tl = t.shine = 0;
      t.live = false;
      it.inner.style.transform = "";
      it.inner.style.boxShadow = "";
      it.inner.style.removeProperty("--shine");
    });
  }

  /* ------------------------------------------------------------------------
     Orbit layout solver
     Tries one ring, then two rings, at decreasing card scales, and picks the
     largest scale where no card touches another card, the orb, the footer or
     the viewport edge at any point of the orbit.
     ------------------------------------------------------------------------ */
  let orbit = null;
  let orbitPhase = 0;

  function solveOrbit(W, H, n) {
    const margin = 16;
    const gap = 8;
    const orbR = ORB_D / 2 + 18;
    const fr = footer.getBoundingClientRect();
    const foot = { x0: fr.left - 8, y0: fr.top - 6, x1: W, y1: H };
    const PH = 90;
    const TAU = Math.PI * 2;

    const configs = [{ split: [n], kx: [1], ky: [1], off: [0] }];
    if (n >= 5) {
      const lo = Math.max(2, Math.round(n * 0.28));
      const hi = Math.max(lo, Math.floor(n * 0.45));
      for (let nin = lo; nin <= hi; nin++)
        for (const ky of [0.55, 0.62, 0.7, 0.78])
          for (const kx of [0.42, 0.52, 0.62])
            for (const off of [0.5, 0])
              configs.push({ split: [n - nin, nin], kx: [1, kx], ky: [1, ky], off: [0, off] });
    }

    const pos = new Float64Array(n * 2);

    function fits(rings, w, h) {
      const cx = W / 2;
      const cy = H / 2;
      for (let p = 0; p < PH; p++) {
        const phi = (p / PH) * TAU;
        let idx = 0;
        for (const r of rings) {
          for (let j = 0; j < r.count; j++) {
            const a = -Math.PI / 2 + r.off + (j * TAU) / r.count + phi;
            const x = cx + r.rx * Math.cos(a);
            const y = cy + r.ry * Math.sin(a);
            // orb clearance (rect vs circle)
            const dx = Math.max(Math.abs(x - cx) - w / 2, 0);
            const dy = Math.max(Math.abs(y - cy) - h / 2, 0);
            if (dx * dx + dy * dy < orbR * orbR) return false;
            // footer
            if (x + w / 2 > foot.x0 && y + h / 2 > foot.y0) return false;
            // other cards
            for (let q = 0; q < idx; q++) {
              if (Math.abs(x - pos[q * 2]) < w + gap && Math.abs(y - pos[q * 2 + 1]) < h + gap) return false;
            }
            pos[idx * 2] = x;
            pos[idx * 2 + 1] = y;
            idx++;
          }
        }
      }
      return true;
    }

    let best = null;
    outer: for (let s = 1; s >= 0.44; s -= 0.02) {
      const w = CARD_W * s + BOB_AMP;
      const h = CARD_H * s + BOB_AMP * 2;
      const rxO = W / 2 - margin - w / 2;
      const ryO = H / 2 - margin - h / 2;
      if (rxO <= 0 || ryO <= 0) continue;
      for (const c of configs) {
        const rings = c.split.map((count, i) => ({
          count,
          rx: rxO * c.kx[i],
          ry: ryO * c.ky[i],
          off: (c.off[i] * TAU) / count,
        }));
        if (fits(rings, w, h)) {
          best = { scale: s, rings };
          break outer;
        }
      }
    }
    if (!best) {
      // Nothing fits (tiny window): fall back to the smallest two-ring layout.
      const s = 0.44;
      const w = CARD_W * s, h = CARD_H * s;
      const rxO = Math.max(40, W / 2 - margin - w / 2);
      const ryO = Math.max(40, H / 2 - margin - h / 2);
      const nin = n >= 5 ? Math.floor(n * 0.4) : 0;
      best = {
        scale: s,
        rings: [
          { count: n - nin, rx: rxO, ry: ryO, off: 0 },
          ...(nin ? [{ count: nin, rx: rxO * 0.55, ry: ryO * 0.62, off: Math.PI / nin }] : []),
        ],
      };
    }

    // Assign cards to slots: outer ring first, in data order.
    let i = 0;
    best.rings.forEach((r, ri) => {
      for (let j = 0; j < r.count; j++, i++) {
        const it = cardItems[i];
        it.ring = ri;
        it.baseAngle = -Math.PI / 2 + r.off + (j * Math.PI * 2) / r.count;
      }
    });
    return best;
  }

  /* ------------------------------------------------------------------------
     Gathered layout (a panel is open): small items in columns at the edges
     ------------------------------------------------------------------------ */
  let gather = null;

  function solveGather(W, H, list) {
    const k = list.length;
    const m = 22;
    const gap = 22;
    const top = 26;
    const bottom = 44; // keeps clear of the footer
    let res = null;
    for (const g of [0.6, 0.54, 0.48, 0.42, 0.36]) {
      const cw = CARD_W * g;
      const ch = CARD_H * g;
      const perCol = Math.max(1, Math.floor((H - top - bottom + gap) / (ch + gap)));
      const perSide = Math.ceil(k / 2);
      const cols = Math.max(1, Math.ceil(perSide / perCol));
      const sideW = m + cols * cw + (cols - 1) * gap + 18;
      res = { g, cw, ch, perCol, cols, sideW, avail: W - 2 * sideW };
      if (res.avail >= 600) break;
    }
    const { g, cw, ch, cols } = res;
    const slots = new Map();
    const sides = [[], []];
    list.forEach((it, i) => sides[i % 2].push(it));
    sides.forEach((arr, side) => {
      if (!arr.length) return;
      const per = Math.ceil(arr.length / cols);
      for (let c = 0; c < cols; c++) {
        const colItems = arr.slice(c * per, (c + 1) * per);
        if (!colItems.length) continue;
        const span = H - top - bottom;
        const step = Math.min(span / colItems.length, ch + gap * 3.2);
        const startY = top + (span - step * colItems.length) / 2 + step / 2 + (c % 2 ? step * 0.25 : 0);
        colItems.forEach((it, r) => {
          const xBase = m + cw / 2 + c * (cw + gap);
          const jitter = Math.sin((r + 1) * 12.9898 + c * 4.1 + side * 7.7) * 4;
          const x = side === 0 ? xBase + jitter : W - xBase + jitter;
          const y = Math.min(H - bottom - ch / 2, startY + r * step);
          slots.set(it, { x, y });
        });
      }
    });
    return { g, slots, sideW: res.sideW, avail: res.avail };
  }

  /* ------------------------------------------------------------------------
     State + routing
     ------------------------------------------------------------------------ */
  let state = { view: "home", id: null };
  let lastOpener = null;
  let closeTimer = 0;

  function parseHash() {
    let h = location.hash.replace(/^#\/?/, "");
    try {
      h = decodeURIComponent(h);
    } catch (e) {
      /* keep raw */
    }
    if (!h) return { view: "home", id: null };
    if (h === "contact") return { view: "contact", id: "contact" };
    const [id, sub] = h.split("/");
    const p = byId.get(id);
    if (!p) return { view: "home", id: null };
    if (sub === "report" && p.report) return { view: "report", id };
    return { view: "intro", id };
  }

  function go(hash) {
    const target = hash ? "#" + hash : "";
    if (location.hash === target || (!hash && !location.hash)) {
      route();
      return;
    }
    try {
      history.pushState(null, "", hash ? target : location.pathname + location.search);
    } catch (e) {
      location.hash = hash; // hashchange will call route()
      return;
    }
    route();
  }

  function goBackLevel() {
    if (state.view === "report") go(state.id);
    else if (state.view !== "home") go("");
  }

  window.addEventListener("popstate", route);
  window.addEventListener("hashchange", route);

  function route() {
    const next = parseHash();
    if (next.view === state.view && next.id === state.id) return;
    const prev = state;
    state = next;

    if (prev.view === "home" && next.view !== "home") {
      const a = document.activeElement;
      lastOpener = a && a !== body ? a : null;
    }

    // Active item: the one represented by the panel.
    items.forEach((it) => it.el.classList.toggle("is-active", next.view !== "home" && it.id === next.id));

    if (next.view === "home") {
      closePanel();
      document.title = baseTitle;
      const back = prev.id && (prev.id === "contact" ? orbEl : cardsEl.querySelector(`[data-id="${CSS.escape(prev.id)}"]`));
      const target = lastOpener && document.contains(lastOpener) ? lastOpener : back;
      if (target) target.focus({ preventScroll: true });
      lastOpener = null;
    } else {
      openPanel(next, prev);
    }
    layoutChanged();
  }

  /* ------------------------------------------------------------------------
     Panel rendering
     ------------------------------------------------------------------------ */
  function setAccent(color, accent2) {
    root.style.setProperty("--accent", color);
    root.style.setProperty("--accent-2", accent2 || "var(--text)");
  }

  function statusHtml(p) {
    return p.status ? `<span class="status ${p.statusClass}"><span class="dot"></span>${esc(p.status)}</span>` : "";
  }

  function kpisHtml(list) {
    if (!list || !list.length) return "";
    return `<div class="kpis" style="--n:${list.length}">${list
      .map(
        (k) => `<div class="kpi"${k.color && isColor(k.color) ? ` style="--accent-2:${esc(k.color)}"` : ""}>
          <span class="kpi-value">${esc(k.value)}</span>
          ${k.label ? `<span class="kpi-label">${esc(k.label)}</span>` : ""}
        </div>`
      )
      .join("")}</div>`;
  }

  function introHtml(p) {
    return `
      <div class="panel-scroll"><div class="intro">
        <div class="p-head">
          <div class="glyph-tile" aria-hidden="true">${esc(p.glyph)}</div>
          <div class="p-head-text">
            <h2 class="p-title" tabindex="-1">${esc(p.name)}</h2>
            <div class="p-meta">${p.kind ? `<span>${esc(p.kind)}</span>` : ""}${statusHtml(p)}</div>
          </div>
          <button class="icon-btn" type="button" data-act="close" aria-label="Close">${ICONS.close}</button>
        </div>
        ${p.problem ? `<p class="problem">${inline(p.problem)}</p>` : ""}
        ${kpisHtml(p.kpis)}
        ${p.conclusion ? `<div class="conclusion"><span class="label">Conclusion</span><p>${inline(p.conclusion)}</p></div>` : ""}
        ${p.stack.length ? `<ul class="tags" aria-label="Tech stack">${p.stack.map((s) => `<li class="tag">${esc(s)}</li>`).join("")}</ul>` : ""}
        ${p.report ? `<div class="actions"><button class="btn-primary" type="button" data-act="report">Read full report ${ICONS.arrow}</button></div>` : ""}
      </div></div>`;
  }

  function tokenSampleHtml(b) {
    let html = "";
    if (Array.isArray(b.segments)) {
      html = b.segments
        .map((s) =>
          s.token ? `<span class="tok">${esc(s.text)}</span>` : s.retracted ? `<del>${esc(s.text)}</del>` : esc(s.text)
        )
        .join("");
    } else {
      const src = String(b.text || "");
      const re = /~~([\s\S]+?)~~|(⟨[^⟩]*⟩)/g;
      let last = 0;
      let m;
      while ((m = re.exec(src))) {
        html += esc(src.slice(last, m.index));
        html += m[1] != null ? `<del>${esc(m[1])}</del>` : `<span class="tok">${esc(m[2])}</span>`;
        last = re.lastIndex;
      }
      html += esc(src.slice(last));
    }
    return `<div class="token-sample">${b.label ? `<span class="label">${esc(b.label)}</span>` : ""}<div>${html}</div></div>`;
  }

  function blockHtml(b) {
    if (!b || typeof b !== "object") return "";
    switch (b.type) {
      case "heading":
        return `<h3>${esc(b.text)}</h3>`;
      case "text":
        return String(b.text || "")
          .split(/\n{2,}/)
          .map((para) => `<p>${inline(para)}</p>`)
          .join("");
      case "list": {
        const tag = b.ordered ? "ol" : "ul";
        return `<${tag}>${(b.items || []).map((i) => `<li>${inline(i)}</li>`).join("")}</${tag}>`;
      }
      case "kpis":
        return kpisHtml((b.items || []).filter((k) => k && k.value != null));
      case "table": {
        const cols = b.columns || [];
        const rows = b.rows || [];
        return `<div class="table-wrap"><table>
          ${cols.length ? `<thead><tr>${cols.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>` : ""}
          <tbody>${rows
            .map((r, i) => `<tr${i === b.highlight ? ' class="hl"' : ""}>${(r || []).map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
            .join("")}</tbody></table></div>`;
      }
      case "image": {
        const src = safeUrl(b.src);
        const media = src
          ? `<img src="${esc(src)}" alt="${esc(b.alt || "")}" loading="lazy" />`
          : `<div class="figure-ph" role="img" aria-label="${esc(b.alt || "Image placeholder")}"><div>${ICONS.image}image placeholder</div></div>`;
        return `<figure class="figure">${media}${b.caption ? `<figcaption>${inline(b.caption)}</figcaption>` : ""}</figure>`;
      }
      case "tokenSample":
        return tokenSampleHtml(b);
      case "code":
        return `<div class="code">${b.lang ? `<span class="label">${esc(b.lang)}</span>` : ""}<pre><code>${esc(b.code || b.text || "")}</code></pre></div>`;
      case "callout":
        return `<div class="callout">${b.label ? `<span class="label">${esc(b.label)}</span>` : ""}<p>${inline(b.text)}</p></div>`;
      default:
        console.warn("Unknown report block type:", b.type);
        return "";
    }
  }

  function reportHtml(p) {
    return `
      <div class="r-head">
        <button class="icon-btn" type="button" data-act="back" aria-label="Back to intro">${ICONS.back}</button>
        <div class="glyph-tile sm" aria-hidden="true">${esc(p.glyph)}</div>
        <div class="p-head-text">
          <h2 class="p-title sm" tabindex="-1">${esc(p.name)}</h2>
          <div class="p-meta">${p.kind ? `<span>${esc(p.kind)}</span>` : ""}${statusHtml(p)}</div>
        </div>
        <button class="icon-btn" type="button" data-act="close" aria-label="Close">${ICONS.close}</button>
      </div>
      <div class="panel-scroll" tabindex="0" aria-label="Report"><article class="report">${p.report.map(blockHtml).join("")}</article></div>`;
  }

  function contactHtml() {
    const rows = [];
    if (SITE.email) {
      rows.push(`<li class="contact-row">${ICONS.mail}
        <span class="c-text"><span class="c-label">Email</span>
          <a class="c-value" href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></span>
        <button class="copy-btn" type="button" data-act="copy">${ICONS.copy}<span>Copy</span></button></li>`);
    }
    const link = (url, label, icon) => {
      const u = safeUrl(url);
      if (!u) return;
      const shown = u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      rows.push(`<li><a class="contact-row" href="${esc(u)}" target="_blank" rel="noopener">${icon}
        <span class="c-text"><span class="c-label">${label}</span><span class="c-value">${esc(shown)}</span></span></a></li>`);
    };
    link(SITE.github, "GitHub", ICONS.github);
    link(SITE.linkedin, "LinkedIn", ICONS.linkedin);
    return `
      <div class="panel-scroll"><div class="intro">
        <div class="p-head">
          <div class="contact-tile" aria-hidden="true">${ICONS.chat}</div>
          <div class="p-head-text">
            <h2 class="p-title" tabindex="-1">Contact me</h2>
            <div class="p-meta"><span>${esc(SITE.name || "Get in touch")}</span></div>
          </div>
          <button class="icon-btn" type="button" data-act="close" aria-label="Close">${ICONS.close}</button>
        </div>
        <p class="problem">Questions about a project, or want to work together? Reach out.</p>
        <ul class="contact-list">${rows.join("")}</ul>
      </div></div>`;
  }

  function openPanel(next, prev) {
    clearTimeout(closeTimer);
    const p = next.view === "contact" ? null : byId.get(next.id);
    if (p) setAccent(p.color, p.accent2);
    else setAccent(CONTACT_ACCENT, null);

    panelInner.innerHTML = next.view === "contact" ? contactHtml() : next.view === "report" ? reportHtml(p) : introHtml(p);
    panel.classList.toggle("is-report", next.view === "report");
    panel.setAttribute("aria-label", p ? p.name : "Contact");
    document.title = (p ? p.name : "Contact") + " · " + (SITE.name || "Portfolio");
    body.classList.add("is-open");

    const wasOpen = prev.view !== "home";
    panel.hidden = false;
    if (!wasOpen) {
      void panel.offsetWidth; // start the CSS transition from the hidden state
      panel.classList.add("is-visible");
    } else {
      panelInner.classList.remove("panel-swap");
      void panelInner.offsetWidth;
      panelInner.classList.add("panel-swap");
    }
    const title = $(".p-title", panelInner);
    if (title) title.focus({ preventScroll: true });
  }

  function closePanel() {
    body.classList.remove("is-open");
    panel.classList.remove("is-visible");
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (state.view === "home") {
        panel.hidden = true;
        panelInner.innerHTML = "";
      }
    }, reduced() ? 200 : 420);
  }

  panel.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "close") go("");
    else if (act === "back") go(state.id);
    else if (act === "report") go(state.id + "/report");
    else if (act === "copy") {
      const ok = await copyText(SITE.email);
      btn.classList.toggle("is-done", ok);
      btn.innerHTML = ok ? `${ICONS.check}<span>Copied</span>` : `${ICONS.copy}<span>Copy failed</span>`;
      setTimeout(() => {
        btn.classList.remove("is-done");
        btn.innerHTML = `${ICONS.copy}<span>Copy</span>`;
      }, 1800);
    }
  });

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback for file:// or older browsers.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      ta.remove();
      return ok;
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.view !== "home") {
      e.preventDefault();
      goBackLevel();
    }
  });

  // Clicking empty space around an open panel closes it.
  stage.addEventListener("click", (e) => {
    if (state.view !== "home" && (e.target === stage || e.target === cardsEl)) go("");
  });

  /* ------------------------------------------------------------------------
     Layout bookkeeping
     ------------------------------------------------------------------------ */
  let needLayout = true;
  function layoutChanged() {
    needLayout = true;
  }

  function computeLayout() {
    needLayout = false;
    if (isMobile()) {
      orbit = null;
      gather = null;
      panel.style.removeProperty("--panel-w");
      return;
    }
    const W = innerWidth;
    const H = innerHeight;
    orbit = solveOrbit(W, H, cardItems.length);
    if (state.view !== "home") {
      const list = items.filter((it) => it.id !== state.id);
      gather = solveGather(W, H, list);
      const want = state.view === "report" ? PANEL_REPORT_W : PANEL_INTRO_W;
      const w = Math.max(320, Math.min(want, gather.avail - 16));
      panel.style.setProperty("--panel-w", w + "px");
    } else {
      gather = null;
    }
  }

  let resizeRaf = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(layoutChanged);
  });

  mqMobile.addEventListener("change", () => {
    resetTilts();
    items.forEach((it) => (it.el.style.transform = ""));
    layoutChanged();
  });
  mqReduce.addEventListener("change", () => {
    resetTilts();
    layoutChanged();
  });

  /* ------------------------------------------------------------------------
     Animation loop
     ------------------------------------------------------------------------ */
  let lastT = performance.now();
  let time = 0;
  let first = true;

  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    time += dt;
    if (needLayout) computeLayout();

    if (!isMobile()) {
      const still = reduced();
      const W = innerWidth;
      const H = innerHeight;
      const speed = still ? 0 : ORBIT_SPEED;
      if (state.view === "home") orbitPhase += speed * dt;
      const kPos = still || first ? 1 : 1 - Math.exp(-dt * 4.5);
      const kDamp = 1 - Math.exp(-dt * 4);
      const bobAmp = still ? 0 : BOB_AMP;
      const open = state.view !== "home";

      for (const it of items) {
        // Pause drift while hovered or keyboard-focused; catch up afterwards.
        const paused = it.hover || it.el.matches(":focus-visible");
        if (it.kind === "card" && speed) {
          const maxLag = orbit ? (Math.PI * 2) / Math.max(4, orbit.rings[it.ring].count) / 3 : 0.3;
          if (paused && !open) it.lag = Math.min(maxLag, it.lag + speed * dt);
          else it.lag = Math.max(0, it.lag - speed * dt);
        }
        it.bobDamp = lerp(it.bobDamp, paused ? 0.25 : it.kind === "orb" ? 0.5 : 1, kDamp);
        const bob = bobAmp * it.bobDamp;
        const by = Math.sin(time * it.bobSpeed + it.bobPhase) * bob;
        const bx = Math.cos(time * it.bobSpeed * 0.7 + it.bobPhaseX) * bob * 0.5;

        let tx, ty, ts;
        if (open && it.id === state.id) {
          tx = W / 2;
          ty = H / 2;
          ts = it.kind === "orb" ? 1.4 : 1.6;
        } else if (open && gather && gather.slots.has(it)) {
          const sl = gather.slots.get(it);
          tx = sl.x + bx;
          ty = sl.y + by;
          // The orb shrinks to the column width so it never crowds a neighbour.
          ts = it.kind === "orb" ? (CARD_W * gather.g) / ORB_D : gather.g;
        } else if (it.kind === "orb") {
          tx = W / 2 + bx;
          ty = H / 2 + by;
          ts = 1;
        } else if (orbit) {
          const r = orbit.rings[it.ring];
          const a = it.baseAngle + orbitPhase - it.lag;
          tx = W / 2 + r.rx * Math.cos(a) + bx;
          ty = H / 2 + r.ry * Math.sin(a) + by;
          ts = orbit.scale;
        } else {
          tx = W / 2;
          ty = H / 2;
          ts = 1;
        }
        if (first && it.kind === "card" && !still) {
          // Entrance: cards fly out from the orb.
          it.x = W / 2;
          it.y = H / 2;
          it.s = 0.3;
        } else {
          it.x = kPos === 1 ? tx : lerp(it.x, tx, kPos);
          it.y = kPos === 1 ? ty : lerp(it.y, ty, kPos);
          it.s = kPos === 1 ? ts : lerp(it.s, ts, kPos);
        }
        it.el.style.transform = `translate3d(${(it.x - it.w / 2).toFixed(2)}px, ${(it.y - it.h / 2).toFixed(2)}px, 0) scale(${it.s.toFixed(4)})`;
        if (it.kind === "card") {
          if (still && it.tilt.live) resetTilts();
          applyTilt(it, dt);
        }
      }
      first = false;
    }
    requestAnimationFrame(frame);
  }

  // Initial state from the URL hash (deep links like #backspace-token/report).
  route();
  computeLayout();
  requestAnimationFrame((t) => {
    lastT = t;
    frame(t);
  });
})();
