/* LUGOD — interactions & motion. No dependencies.
   Everything here is progressive enhancement: the pages work without it. */
(() => {
  "use strict";

  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const CFG = Object.assign({
    formEndpoint: "",
    messenger: "https://m.me/LUGODEVENTS",
    email: "lugodcateringservices@gmail.com",
    phone: "+639173282923",
    viber: "+639173282923",
    smoothScroll: true,
  }, window.LUGOD_CONFIG || {});

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  };
  const local = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } },
  };

  /* ------------------------------------------------------------------
     Palette engine — the page borrows each event's colours
  ------------------------------------------------------------------ */
  let currentPalette = "";
  function setPalette(list) {
    if (!list || !list.length) return;
    const key = list.join(",");
    if (key === currentPalette) return;
    currentPalette = key;
    const c = list.concat(list, list);
    root.style.setProperty("--p1", c[0]);
    root.style.setProperty("--p2", c[1]);
    root.style.setProperty("--p3", c[2]);
    root.style.setProperty("--p4", c[3]);
  }
  function paletteWatcher() {
    const els = $$("[data-palette]:not(.deck__card)");
    if (!els.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setPalette(e.target.dataset.palette.split(","));
      });
    }, { rootMargin: "-48% 0px -48% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------
     Curtain: opening reveal + page transitions
  ------------------------------------------------------------------ */
  const curtain = $(".curtain");
  function lift(delay) {
    window.clearTimeout(window.__lugodFailsafe);
    setTimeout(() => {
      if (curtain) curtain.classList.add("is-lifting");
      root.classList.remove("is-opening", "is-entering");
      requestAnimationFrame(() => root.classList.add("is-revealed"));
      setTimeout(() => curtain && curtain.classList.remove("is-lifting"), 1000);
    }, delay);
  }
  function curtainInit() {
    if (root.classList.contains("is-opening")) {
      lift(reduce ? 0 : 1450);
    } else if (root.classList.contains("is-entering")) {
      lift(reduce ? 0 : 120);
    } else {
      root.classList.add("is-revealed");
    }

    if (reduce || !curtain) return;
    d.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download") || a.dataset.noTransition !== undefined) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (!/^https?:$/.test(url.protocol)) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      root.classList.remove("menu-open");
      curtain.classList.remove("is-lifting");
      curtain.classList.add("is-covering");
      session.set("lugod-nav", "1");
      setTimeout(() => { location.href = url.href; }, 560);
    });
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        curtain.classList.remove("is-covering");
        root.classList.remove("is-entering", "is-opening");
        root.classList.add("is-revealed");
      }
    });
  }

  /* ------------------------------------------------------------------
     Smooth wheel scrolling (desktop mouse only; native everywhere else)
  ------------------------------------------------------------------ */
  const smooth = { active: false, to: null };
  function smoothScrollInit() {
    if (reduce || !finePointer || !CFG.smoothScroll) return;
    let target = window.scrollY;
    let current = window.scrollY;
    let raf = 0;
    let last = 0;
    const maxY = () => Math.max(0, d.documentElement.scrollHeight - window.innerHeight);

    function frame(t) {
      const dt = last ? Math.min(64, t - last) : 16.7;
      last = t;
      const k = 1 - Math.pow(1 - 0.11, dt / 16.7);
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.4) {
        current = target;
        window.scrollTo(0, current);
        raf = 0; last = 0;
        return;
      }
      window.scrollTo(0, current);
      raf = requestAnimationFrame(frame);
    }
    function blocked(el) {
      if (root.classList.contains("menu-open")) return true;
      for (let n = el; n && n !== d.body; n = n.parentElement) {
        if (n.matches && n.matches("dialog[open], textarea, select, [data-native-scroll]")) return true;
        if (n.scrollHeight > n.clientHeight + 2) {
          const oy = getComputedStyle(n).overflowY;
          if (oy === "auto" || oy === "scroll") return true;
        }
      }
      return false;
    }
    window.addEventListener("wheel", (e) => {
      if (e.ctrlKey || e.defaultPrevented) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (blocked(e.target)) return;
      e.preventDefault();
      if (!raf) { current = window.scrollY; target = current; }
      const unit = e.deltaMode === 1 ? 36 : e.deltaMode === 2 ? window.innerHeight : 1;
      target = clamp(target + e.deltaY * unit, 0, maxY());
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: false });
    window.addEventListener("scroll", () => {
      if (!raf) { current = target = window.scrollY; }
    }, { passive: true });
    smooth.active = true;
    smooth.to = (y) => {
      target = clamp(y, 0, maxY());
      if (!raf) { current = window.scrollY; raf = requestAnimationFrame(frame); }
    };
  }
  function scrollToEl(el) {
    const y = el.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(root).scrollPaddingTop, 10) || 90);
    if (smooth.active) smooth.to(y);
    else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    setTimeout(() => el.focus({ preventScroll: true }), reduce ? 0 : 500);
  }
  function anchorLinks() {
    d.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href").slice(1);
      if (!id) return;
      const el = d.getElementById(id);
      if (!el) return;
      e.preventDefault();
      root.classList.remove("menu-open");
      scrollToEl(el);
      history.replaceState(null, "", "#" + id);
    });
  }

  /* ------------------------------------------------------------------
     Header, progress bar, mobile bar
  ------------------------------------------------------------------ */
  function headerInit() {
    const header = $(".site-header");
    const bar = $(".progress");
    const mbar = $(".mobile-bar");
    const footer = $(".site-footer");
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const max = d.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : 0);
      if (header) {
        header.classList.toggle("is-solid", y > 30);
        const goingDown = y > lastY + 4;
        const goingUp = y < lastY - 4;
        if (goingDown && y > 260 && !root.classList.contains("menu-open") && !header.contains(d.activeElement)) header.classList.add("is-hidden");
        else if (goingUp || y < 120) header.classList.remove("is-hidden");
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    if (mbar && footer && "IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => mbar.classList.toggle("is-tucked", e.isIntersecting), { rootMargin: "0px 0px -40px 0px" }).observe(footer);
      d.addEventListener("focusin", (e) => {
        if (e.target.matches("input, textarea, select")) mbar.classList.add("is-tucked");
      });
      d.addEventListener("focusout", (e) => {
        if (e.target.matches("input, textarea, select")) mbar.classList.remove("is-tucked");
      });
    }
  }

  function mobileMenu() {
    const btn = $(".menu-toggle");
    const panel = $(".mobile-nav");
    if (!btn || !panel) return;
    const focusables = () => $$("a, button", panel).concat(btn);
    const close = (focusBtn) => {
      root.classList.remove("menu-open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open menu");
      panel.setAttribute("aria-hidden", "true");
      panel.inert = true;
      if (focusBtn) btn.focus();
    };
    const open = () => {
      root.classList.add("menu-open");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Close menu");
      panel.setAttribute("aria-hidden", "false");
      panel.inert = false;
      setTimeout(() => { const f = $("a", panel); if (f) f.focus(); }, 350);
    };
    panel.inert = true;
    btn.addEventListener("click", () => (root.classList.contains("menu-open") ? close(true) : open()));
    d.addEventListener("keydown", (e) => {
      if (!root.classList.contains("menu-open")) return;
      if (e.key === "Escape") close(true);
      if (e.key === "Tab") {
        const f = focusables();
        const first = f[0];
        const lastEl = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && d.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener("resize", () => { if (window.innerWidth > 1100) close(false); });
  }

  /* ------------------------------------------------------------------
     Text splitting & reveal-on-scroll
  ------------------------------------------------------------------ */
  function splitText() {
    $$("[data-split]").forEach((el) => {
      let i = 0;
      const delay = el.dataset.splitDelay || 0;
      const walk = (node) => {
        Array.from(node.childNodes).forEach((n) => {
          if (n.nodeType === 3) {
            const parts = n.textContent.split(/(\s+)/);
            const frag = d.createDocumentFragment();
            parts.forEach((p) => {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(" ")); return; }
              const outer = d.createElement("span");
              outer.className = "split-word";
              const inner = d.createElement("span");
              inner.textContent = p;
              outer.style.setProperty("--wi", i++);
              outer.style.setProperty("--wd", delay + "ms");
              outer.appendChild(inner);
              frag.appendChild(outer);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && n.tagName !== "BR") {
            walk(n);
          }
        });
      };
      walk(el);
      el.classList.add("is-split");
    });
  }

  function reveals() {
    $$("[data-stagger]").forEach((p) => {
      const step = parseInt(p.dataset.stagger, 10) || 80;
      Array.from(p.children).forEach((c, i) => c.style.setProperty("--rd", i * step + "ms"));
    });
    const targets = $$("[data-reveal], .split-heading .split-word, .step");
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    targets.forEach((t) => io.observe(t));
  }

  /* ------------------------------------------------------------------
     Scroll-linked effects: parallax, sticky story stack, step line
  ------------------------------------------------------------------ */
  function scrollFx() {
    if (reduce) return;
    const para = $$("[data-parallax]");
    const stack = $(".stack--sticky");
    const stories = stack ? $$(".story", stack) : [];
    const steps = $(".steps");
    const stickyMQ = matchMedia("(min-width: 980px) and (min-height: 720px)");
    const visible = new Set();
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      }, { rootMargin: "20% 0px 20% 0px" });
      para.forEach((p) => io.observe(p));
    } else {
      para.forEach((p) => visible.add(p));
    }
    let ticking = false;
    const run = () => {
      const vh = window.innerHeight;
      visible.forEach((el) => {
        const r = el.getBoundingClientRect();
        const s = parseFloat(el.dataset.parallax) || 0.1;
        const y = (r.top + r.height / 2 - vh / 2) * -s;
        el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
      });
      if (stories.length) {
        if (stickyMQ.matches) {
          stories.forEach((st, i) => {
            const next = stories[i + 1];
            if (!next) { st.style.transform = ""; st.style.filter = ""; return; }
            const a = st.getBoundingClientRect();
            const b = next.getBoundingClientRect();
            const p = clamp((a.bottom - b.top) / a.height, 0, 1);
            st.style.transform = "scale(" + (1 - p * 0.06).toFixed(4) + ")";
            st.style.filter = "brightness(" + (1 - p * 0.18).toFixed(3) + ")";
          });
        } else {
          stories.forEach((st) => { st.style.transform = ""; st.style.filter = ""; });
        }
      }
      if (steps) {
        const r = steps.getBoundingClientRect();
        const p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.25), 0, 1);
        steps.style.setProperty("--line-progress", p.toFixed(3));
      }
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    run();
  }

  /* ------------------------------------------------------------------
     Magnetic buttons
  ------------------------------------------------------------------ */
  function magnetic() {
    if (reduce || !finePointer) return;
    $$("[data-magnetic]").forEach((el) => {
      let raf = 0;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.32;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => { el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)"; });
      });
      el.addEventListener("pointerleave", () => { cancelAnimationFrame(raf); el.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------------
     Hero deck — real events dealt like printed photos
  ------------------------------------------------------------------ */
  function deck() {
    const el = $("[data-deck]");
    if (!el) return;
    const cards = $$(".deck__card", el);
    const cap = $(".deck__caption", el);
    const sw = $$(".deck__swatches li", el);
    const btnPrev = $("[data-deck-prev]", el);
    const btnNext = $("[data-deck-next]", el);
    const btnPlay = $("[data-deck-play]", el);
    const order = cards.map((_, i) => i);
    let timer = 0;
    let playing = !reduce;
    let inView = true;
    let hover = false;

    function layout(announce) {
      order.forEach((ci, pos) => {
        cards[ci].style.setProperty("--i", pos);
        cards[ci].setAttribute("aria-hidden", pos ? "true" : "false");
      });
      const top = cards[order[0]];
      cap.innerHTML = "";
      cap.append(top.dataset.title);
      const sub = d.createElement("span");
      sub.textContent = top.dataset.sub;
      cap.append(sub);
      cap.setAttribute("aria-live", announce ? "polite" : "off");
      const pal = top.dataset.palette.split(",");
      sw.forEach((s, i) => s.style.setProperty("--c", pal[i % pal.length]));
      if (inView) setPalette(pal);
    }
    function next(announce) {
      const ci = order.shift();
      order.push(ci);
      const c = cards[ci];
      if (!reduce) {
        c.classList.remove("is-leaving");
        void c.offsetWidth;
        c.classList.add("is-leaving");
        setTimeout(() => c.classList.remove("is-leaving"), 1000);
      }
      layout(announce);
    }
    function prev(announce) {
      order.unshift(order.pop());
      layout(announce);
    }
    function schedule() {
      clearTimeout(timer);
      if (playing && inView && !hover && !d.hidden) timer = setTimeout(() => { next(false); schedule(); }, 4200);
    }
    function setPlaying(v) {
      playing = v;
      if (btnPlay) {
        btnPlay.setAttribute("aria-pressed", String(!v));
        btnPlay.setAttribute("aria-label", v ? "Pause slideshow" : "Play slideshow");
        btnPlay.innerHTML = v
          ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>'
          : '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg>';
      }
      schedule();
    }
    btnNext && btnNext.addEventListener("click", () => { next(true); schedule(); });
    btnPrev && btnPrev.addEventListener("click", () => { prev(true); schedule(); });
    btnPlay && btnPlay.addEventListener("click", () => setPlaying(!playing));
    const stack = $(".deck__stack", el);
    stack.addEventListener("pointerenter", () => { hover = true; schedule(); });
    stack.addEventListener("pointerleave", () => { hover = false; schedule(); });
    el.addEventListener("focusin", () => { hover = true; schedule(); });
    el.addEventListener("focusout", () => { hover = false; schedule(); });
    let sx = null;
    stack.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    stack.addEventListener("pointerup", (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 40) { dx < 0 ? next(true) : prev(true); schedule(); }
      else if (e.pointerType === "mouse") { next(true); schedule(); }
    });
    d.addEventListener("visibilitychange", schedule);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        inView = e.isIntersecting;
        if (inView) setPalette(cards[order[0]].dataset.palette.split(","));
        schedule();
      }, { threshold: 0.25 }).observe(el);
    }
    layout(false);
    setPlaying(playing);
  }

  /* ------------------------------------------------------------------
     Package inclusions — selecting an item swaps the photo
  ------------------------------------------------------------------ */
  function inclusions() {
    $$("[data-incl]").forEach((wrap) => {
      const btns = $$(".incl__btn", wrap);
      const frame = $(".pkg__frame", wrap);
      const pics = frame ? $$(".pic", frame) : [];
      const cap = $(".pkg__cap", wrap);
      let idx = 0;
      let auto = 0;
      let touched = false;
      const show = (i) => {
        idx = i;
        btns.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
        const key = btns[i].dataset.key;
        pics.forEach((p) => {
          const on = p.dataset.key === key;
          if (on) { p.classList.remove("was-active"); p.classList.add("is-active"); }
          else if (p.classList.contains("is-active")) { p.classList.remove("is-active"); p.classList.add("was-active"); setTimeout(() => p.classList.remove("was-active"), 1000); }
        });
        if (cap) cap.textContent = btns[i].dataset.cap || "";
      };
      btns.forEach((b, i) => {
        b.addEventListener("click", () => { touched = true; clearInterval(auto); show(i); });
        if (finePointer) b.addEventListener("pointerenter", () => { touched = true; clearInterval(auto); show(i); });
      });
      show(0);
      if (!reduce && "IntersectionObserver" in window) {
        new IntersectionObserver(([e]) => {
          clearInterval(auto);
          if (e.isIntersecting && !touched) auto = setInterval(() => show((idx + 1) % btns.length), 3800);
        }, { threshold: 0.35 }).observe(wrap);
      }
    });
  }

  /* ------------------------------------------------------------------
     Tabs (menu preview)
  ------------------------------------------------------------------ */
  function tabs() {
    $$("[data-tabs]").forEach((wrap) => {
      const list = $('[role="tablist"]', wrap);
      const tabsEls = $$('[role="tab"]', wrap);
      const panels = tabsEls.map((t) => d.getElementById(t.getAttribute("aria-controls")));
      const ink = $(".tabs__ink", wrap);
      const moveInk = (t) => {
        if (!ink) return;
        ink.style.width = t.offsetWidth + "px";
        ink.style.transform = "translateX(" + t.offsetLeft + "px)";
      };
      const select = (i, focus) => {
        tabsEls.forEach((t, k) => {
          const on = k === i;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          panels[k].hidden = !on;
          panels[k].classList.toggle("is-entering", on && !reduce);
        });
        moveInk(tabsEls[i]);
        if (focus) tabsEls[i].focus();
        const t = tabsEls[i];
        const sl = list.scrollLeft;
        if (t.offsetLeft < sl || t.offsetLeft + t.offsetWidth > sl + list.clientWidth) list.scrollTo({ left: t.offsetLeft - 20, behavior: reduce ? "auto" : "smooth" });
      };
      tabsEls.forEach((t, i) => {
        t.addEventListener("click", () => select(i, false));
        t.addEventListener("keydown", (e) => {
          let n = null;
          if (e.key === "ArrowRight") n = (i + 1) % tabsEls.length;
          if (e.key === "ArrowLeft") n = (i - 1 + tabsEls.length) % tabsEls.length;
          if (e.key === "Home") n = 0;
          if (e.key === "End") n = tabsEls.length - 1;
          if (n !== null) { e.preventDefault(); select(n, true); }
        });
      });
      const start = Math.max(0, tabsEls.findIndex((t) => t.getAttribute("aria-selected") === "true"));
      select(start, false);
      window.addEventListener("resize", () => moveInk(tabsEls.find((t) => t.getAttribute("aria-selected") === "true")));
      if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => moveInk(tabsEls.find((t) => t.getAttribute("aria-selected") === "true")));
    });
  }

  /* ------------------------------------------------------------------
     FLIP helper for filtering
  ------------------------------------------------------------------ */
  function flip(items, change) {
    if (reduce) { change(); return; }
    const first = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
    change();
    items.forEach((el) => {
      if (el.classList.contains("is-hidden")) return;
      const f = first.get(el);
      const l = el.getBoundingClientRect();
      if (!f || f.width === 0) {
        el.animate([{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: "cubic-bezier(.16,1,.3,1)" });
        return;
      }
      const dx = f.left - l.left;
      const dy = f.top - l.top;
      if (dx || dy) el.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 650, easing: "cubic-bezier(.16,1,.3,1)" });
    });
  }

  /* ------------------------------------------------------------------
     Menu page: filter + search
  ------------------------------------------------------------------ */
  function menuFilter() {
    const wrap = $("[data-menu]");
    if (!wrap) return;
    const chips = $$("[data-filter]", wrap);
    const input = $("input[type=search]", wrap);
    const cats = $$(".menu-cat", wrap);
    const dishes = $$(".dish", wrap);
    const status = $("[data-status]", wrap);
    const empty = $(".empty", wrap);
    let cat = "all";
    const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const apply = () => {
      const q = norm(input ? input.value.trim() : "");
      flip(dishes, () => {
        let n = 0;
        dishes.forEach((el) => {
          const ok = (cat === "all" || el.dataset.cat === cat) && (!q || norm(el.dataset.name).includes(q));
          el.classList.toggle("is-hidden", !ok);
          if (ok) n++;
        });
        cats.forEach((c) => c.classList.toggle("is-hidden", !$$(".dish:not(.is-hidden)", c).length));
        if (status) status.textContent = n === 1 ? "Showing 1 dish" : "Showing " + n + " dishes";
        if (empty) empty.classList.toggle("is-shown", n === 0);
      });
    };
    chips.forEach((c) => c.addEventListener("click", () => {
      cat = c.dataset.filter;
      chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      apply();
      history.replaceState(null, "", cat === "all" ? location.pathname : "#" + cat);
    }));
    if (input) input.addEventListener("input", apply);
    const reset = $("[data-reset]", wrap);
    if (reset) reset.addEventListener("click", () => { if (input) input.value = ""; chips[0].click(); });
    const h = location.hash.slice(1);
    const pre = chips.find((c) => c.dataset.filter === h);
    if (pre) pre.click();
  }

  /* ------------------------------------------------------------------
     Gallery: filter + lightbox
  ------------------------------------------------------------------ */
  function gallery() {
    const wrap = $("[data-gallery]");
    if (!wrap) return;
    const chips = $$("[data-gfilter]", wrap);
    const items = $$(".gallery__item", wrap);
    const status = $("[data-status]", wrap);
    chips.forEach((c) => c.addEventListener("click", () => {
      const f = c.dataset.gfilter;
      chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      let n = 0;
      items.forEach((it, i) => {
        const ok = f === "all" || it.dataset.cat === f;
        it.classList.toggle("is-hidden", !ok);
        if (ok) {
          n++;
          if (!reduce) it.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: Math.min(n, 12) * 35, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
        }
      });
      if (status) status.textContent = "Showing " + n + " photos";
    }));

    const dlg = $(".lightbox");
    if (!dlg || typeof dlg.showModal !== "function") return;
    const img = $(".lightbox__stage img", dlg);
    const cap = $(".lightbox__cap", dlg);
    const count = $("[data-lb-count]", dlg);
    let list = [];
    let i = 0;
    let opener = null;
    const render = () => {
      const it = list[i];
      const b = $("button", it);
      img.src = b.dataset.full;
      img.alt = b.dataset.alt;
      img.style.animation = "none"; void img.offsetWidth; img.style.animation = "";
      cap.innerHTML = "";
      cap.append(b.dataset.alt);
      const s = d.createElement("span"); s.textContent = b.dataset.src; cap.append(s);
      if (count) count.textContent = (i + 1) + " of " + list.length;
    };
    items.forEach((it) => {
      $("button", it).addEventListener("click", (e) => {
        list = items.filter((x) => !x.classList.contains("is-hidden"));
        i = list.indexOf(it);
        opener = e.currentTarget;
        render();
        dlg.showModal();
      });
    });
    const go = (k) => { i = (i + k + list.length) % list.length; render(); };
    $("[data-lb-prev]", dlg).addEventListener("click", () => go(-1));
    $("[data-lb-next]", dlg).addEventListener("click", () => go(1));
    $("[data-lb-close]", dlg).addEventListener("click", () => dlg.close());
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.classList.contains("lightbox__stage")) dlg.close(); });
    dlg.addEventListener("close", () => { if (opener) opener.focus(); });
    let sx = null;
    dlg.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    dlg.addEventListener("pointerup", (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 50) go(e.clientX < sx ? 1 : -1); sx = null; });
  }

  /* ------------------------------------------------------------------
     FAQ — animated details
  ------------------------------------------------------------------ */
  function faq() {
    $$(".faq details").forEach((det) => {
      const sum = $("summary", det);
      const body = $(".faq__body", det);
      let anim = null;
      sum.addEventListener("click", (e) => {
        if (reduce || !body.animate) return;
        e.preventDefault();
        if (anim) anim.cancel();
        if (!det.open) {
          det.open = true;
          const h = body.offsetHeight;
          anim = body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 480, easing: "cubic-bezier(.16,1,.3,1)" });
          anim.onfinish = () => { anim = null; };
        } else {
          const h = body.offsetHeight;
          anim = body.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 360, easing: "cubic-bezier(.65,0,.35,1)" });
          anim.onfinish = () => { det.open = false; anim = null; };
        }
      });
      body.style.overflow = "hidden";
    });
  }

  /* ------------------------------------------------------------------
     Count-up numbers
  ------------------------------------------------------------------ */
  function counters() {
    const els = $$("[data-count]");
    if (!els.length) return;
    const runOne = (el) => {
      const to = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      if (reduce) { el.textContent = to + suffix; return; }
      const t0 = performance.now();
      const dur = 1400;
      const step = (t) => {
        const p = clamp((t - t0) / dur, 0, 1);
        const e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(to * e) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) { els.forEach(runOne); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { runOne(e.target); io.unobserve(e.target); }
    }), { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------
     Click-to-load map (no third-party requests until asked)
  ------------------------------------------------------------------ */
  function maps() {
    $$("[data-map]").forEach((m) => {
      const b = $("button", m);
      if (!b) return;
      b.addEventListener("click", () => {
        const f = d.createElement("iframe");
        f.src = m.dataset.map;
        f.title = "Map showing LUGOD in Novaliches, Quezon City";
        f.loading = "lazy";
        f.referrerPolicy = "no-referrer-when-downgrade";
        m.appendChild(f);
        $(".map__load", m).remove();
      });
    });
  }

  /* ------------------------------------------------------------------
     Toast + clipboard
  ------------------------------------------------------------------ */
  let toastTimer = 0;
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = d.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); d.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-shown"), 3200);
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) { /* fall back */ }
    const ta = d.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    d.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = d.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  function copyButtons() {
    $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
      const ok = await copyText(b.dataset.copy);
      toast(ok ? "Copied: " + b.dataset.copy : "Couldn't copy. Please copy it by hand.");
    }));
  }

  /* ------------------------------------------------------------------
     Request form
  ------------------------------------------------------------------ */
  function requestForm() {
    const form = $("#request-form");
    if (!form) return;
    const card = form.closest(".form-card");
    const reviewView = $("#request-review", card);
    const doneView = $("#request-done", card);
    const summaryBox = $(".review-box", reviewView);
    const errorSummary = $(".form-error-summary", form);
    const steps = $$(".form-steps li", card);
    const DRAFT = "lugod-request-draft";
    const today = new Date();
    const iso = (dt) => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
    const dateInput = form.elements.date;
    const notSure = form.elements.date_unsure;
    if (dateInput) dateInput.min = iso(today);

    // prefill from URL, then from draft
    const params = new URLSearchParams(location.search);
    const draft = (() => { try { return JSON.parse(local.get(DRAFT) || "null"); } catch (e) { return null; } })();
    if (draft) {
      Object.entries(draft).forEach(([k, v]) => {
        const el = form.elements[k];
        if (!el || k === "website") return;
        if (el instanceof RadioNodeList || (el.length && el[0] && el[0].type === "checkbox")) {
          const vals = [].concat(v);
          Array.from(el).forEach((x) => { x.checked = vals.includes(x.value); });
        } else if (el.type === "checkbox") el.checked = !!v;
        else el.value = v;
      });
    }
    const type = params.get("type");
    if (type && form.elements.event_type) {
      const opt = Array.from(form.elements.event_type.options).find((o) => o.value === type);
      if (opt) form.elements.event_type.value = type;
    }
    const pkg = params.get("package");
    if (pkg) {
      const box = form.querySelector('input[name="services"][value="' + pkg + '"]');
      if (box) box.checked = true;
    }

    const collect = () => {
      const fd = new FormData(form);
      const o = {};
      fd.forEach((v, k) => {
        if (o[k] !== undefined) o[k] = [].concat(o[k], v);
        else o[k] = v;
      });
      return o;
    };
    const saveDraft = () => local.set(DRAFT, JSON.stringify(collect()));
    form.addEventListener("input", saveDraft);
    form.addEventListener("change", saveDraft);

    const syncDate = () => {
      if (!dateInput || !notSure) return;
      dateInput.disabled = notSure.checked;
      if (notSure.checked) clearErr(dateInput);
    };
    if (notSure) notSure.addEventListener("change", syncDate);
    syncDate();

    const fieldOf = (el) => el.closest(".field");
    function setErr(el, msg) {
      const f = fieldOf(el);
      if (!f) return;
      f.classList.add("has-error");
      const e = $(".error", f);
      if (e) e.textContent = msg;
      el.setAttribute("aria-invalid", "true");
    }
    function clearErr(el) {
      const f = fieldOf(el);
      if (!f) return;
      f.classList.remove("has-error");
      el.removeAttribute("aria-invalid");
    }
    const phoneOk = (v) => /^(\+?63|0)9\d{9}$/.test(v.replace(/[\s\-().]/g, ""));
    const checks = [
      ["event_type", (v) => (v ? "" : "Choose the kind of event.")],
      ["date", (v) => {
        if (notSure && notSure.checked) return "";
        if (!v) return "Pick a date, or tick “not sure yet”.";
        if (v < iso(today)) return "Choose a date from today onwards.";
        return "";
      }],
      ["location", (v) => (v.trim().length >= 3 ? "" : "Tell us the venue, barangay or city.")],
      ["guests", (v) => {
        const n = parseInt(v, 10);
        return n >= 1 && n <= 5000 ? "" : "Enter the number of guests or meals (1 to 5,000).";
      }],
      ["name", (v) => (v.trim().length >= 2 ? "" : "Enter your name.")],
      ["mobile", (v) => (phoneOk(v) ? "" : "Enter a Philippine mobile number, for example 0917 123 4567.")],
      ["email", (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Check the email address, or leave it blank.")],
    ];
    function validate() {
      const errs = [];
      checks.forEach(([name, fn]) => {
        const el = form.elements[name];
        if (!el) return;
        const msg = fn(el.value || "");
        if (msg) { setErr(el, msg); errs.push([el, msg]); } else clearErr(el);
      });
      return errs;
    }
    checks.forEach(([name]) => {
      const el = form.elements[name];
      if (!el) return;
      el.addEventListener("blur", () => {
        if (!fieldOf(el).classList.contains("has-error")) return;
        const msg = checks.find((c) => c[0] === name)[1](el.value || "");
        if (msg) setErr(el, msg); else clearErr(el);
      });
      el.addEventListener("input", () => { if (fieldOf(el).classList.contains("has-error")) { const msg = checks.find((c) => c[0] === name)[1](el.value || ""); if (!msg) clearErr(el); } });
    });

    const labels = {
      event_type: "Event", date: "Date", location: "Location", guests: "Guests or meals", services: "Interested in",
      budget: "Budget", notes: "Notes", name: "Name", mobile: "Mobile", contact_pref: "Best way to reach me", email: "Email",
    };
    const prettyDate = (v) => {
      if (!v) return "Not sure yet";
      const [y, m, dd] = v.split("-").map(Number);
      const dt = new Date(y, m - 1, dd);
      return dt.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };
    function summaryPairs() {
      const o = collect();
      const sel = form.elements.event_type;
      const pairs = [];
      Object.keys(labels).forEach((k) => {
        let v = o[k];
        if (k === "event_type") v = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : v;
        if (k === "date") v = notSure && notSure.checked ? "Not sure yet" : prettyDate(v);
        if (k === "services" && v) {
          v = [].concat(v).map((val) => { const inp = form.querySelector('input[name="services"][value="' + val + '"]'); return inp ? inp.dataset.label : val; }).join(", ");
        }
        if (Array.isArray(v)) v = v.join(", ");
        if (v && String(v).trim()) pairs.push([labels[k], String(v).trim()]);
      });
      return pairs;
    }
    function messageText() {
      const lines = ["Hi LUGOD! I'd like to request a date for an event.", ""];
      summaryPairs().forEach(([k, v]) => lines.push(k + ": " + v));
      lines.push("", "(Sent from the LUGOD website request form.)");
      return lines.join("\n");
    }

    function setStep(n) {
      steps.forEach((li, i) => {
        li.classList.toggle("is-done", i < n);
        if (i === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      });
    }
    function showView(view) {
      [form, reviewView, doneView].forEach((v) => { if (v) v.hidden = v !== view; });
      if (!reduce && view.animate) view.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: "cubic-bezier(.16,1,.3,1)" });
      const h = $("h2, legend", view);
      scrollToEl(card);
      if (h) { h.setAttribute("tabindex", "-1"); setTimeout(() => h.focus({ preventScroll: true }), 50); }
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (form.elements.website && form.elements.website.value) return; // bot
      const errs = validate();
      if (errs.length) {
        const ul = $("ul", errorSummary);
        ul.innerHTML = "";
        errs.forEach(([el, msg]) => {
          const li = d.createElement("li");
          const a = d.createElement("a");
          a.href = "#" + el.id;
          a.textContent = msg;
          a.addEventListener("click", (ev) => { ev.preventDefault(); el.focus(); });
          li.appendChild(a);
          ul.appendChild(li);
        });
        errorSummary.classList.add("is-shown");
        errorSummary.focus();
        return;
      }
      errorSummary.classList.remove("is-shown");
      summaryBox.innerHTML = "";
      summaryPairs().forEach(([k, v]) => {
        const row = d.createElement("div");
        const dt = d.createElement("dt"); dt.textContent = k;
        const dd = d.createElement("dd"); dd.textContent = v;
        row.append(dt, dd);
        summaryBox.appendChild(row);
      });
      const text = messageText();
      const subject = "Date request: " + (form.elements.event_type.options[form.elements.event_type.selectedIndex].text) + ", " + (notSure && notSure.checked ? "date not set" : prettyDate(form.elements.date.value));
      const mail = $("[data-send=email]", reviewView);
      if (mail) mail.href = "mailto:" + CFG.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
      const sms = $("[data-send=sms]", reviewView);
      if (sms) sms.href = "sms:" + CFG.phone + "?&body=" + encodeURIComponent(text);
      reviewView.dataset.text = text;
      const direct = $("[data-send=direct]", reviewView);
      const ways = $(".send-ways", reviewView);
      if (CFG.formEndpoint) { direct.hidden = false; } else { direct.hidden = true; }
      if (ways) ways.hidden = false;
      setStep(1);
      showView(reviewView);
    });

    $("[data-edit]", reviewView).addEventListener("click", () => { setStep(0); showView(form); });
    $$("[data-send=messenger], [data-send=viber]", reviewView).forEach((a) => a.addEventListener("click", async (e) => {
      e.preventDefault();
      const ok = await copyText(reviewView.dataset.text || "");
      toast(ok ? "Your request is copied. Paste it into the chat." : "Couldn't copy automatically. Please copy the summary above.");
      const href = a.dataset.send === "viber" ? "viber://chat?number=" + encodeURIComponent(CFG.viber) : CFG.messenger;
      setTimeout(() => { window.open(href, a.dataset.send === "viber" ? "_self" : "_blank", "noopener"); }, 700);
      markSent(a.dataset.send);
    }));
    $$("[data-send=email], [data-send=sms]", reviewView).forEach((a) => a.addEventListener("click", () => markSent(a.dataset.send)));
    const copyAll = $("[data-copy-request]", reviewView);
    if (copyAll) copyAll.addEventListener("click", async () => {
      const ok = await copyText(reviewView.dataset.text || "");
      toast(ok ? "Request copied." : "Couldn't copy. Please select the summary and copy it.");
    });
    function markSent(via) {
      const after = $(".after-send", reviewView);
      if (!after) return;
      after.hidden = false;
      const names = { email: "your email app", sms: "your messages app", messenger: "Messenger", viber: "Viber" };
      $("[data-via]", after).textContent = names[via] || "the app";
    }
    const finish = $("[data-finish]", reviewView);
    if (finish) finish.addEventListener("click", () => { local.del(DRAFT); form.reset(); syncDate(); setStep(2); showView(doneView); });

    const directBtn = $("[data-send=direct]", reviewView);
    if (directBtn) directBtn.addEventListener("click", async () => {
      const status = $("[data-direct-status]", reviewView);
      directBtn.disabled = true;
      const label = directBtn.innerHTML;
      directBtn.textContent = "Sending…";
      status.textContent = "";
      try {
        const payload = collect();
        delete payload.website;
        payload._subject = "Website date request";
        payload.summary = reviewView.dataset.text;
        const res = await fetch(CFG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error("HTTP " + res.status);
        local.del(DRAFT);
        form.reset();
        syncDate();
        setStep(2);
        showView(doneView);
      } catch (err) {
        status.textContent = "We couldn't send this from the website just now. Your answers are kept here. Please use email, Messenger, Viber or text below, or call " + CFG.phone.replace("+63", "0") + ".";
        directBtn.disabled = false;
        directBtn.innerHTML = label;
      }
    });
    setStep(0);
  }

  /* ------------------------------------------------------------------
     Footer year & boot
  ------------------------------------------------------------------ */
  function boot() {
    splitText();
    curtainInit();
    smoothScrollInit();
    anchorLinks();
    headerInit();
    mobileMenu();
    paletteWatcher();
    reveals();
    scrollFx();
    magnetic();
    deck();
    inclusions();
    tabs();
    menuFilter();
    gallery();
    faq();
    counters();
    maps();
    copyButtons();
    requestForm();
    $$("[data-year]").forEach((y) => { y.textContent = new Date().getFullYear(); });
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
