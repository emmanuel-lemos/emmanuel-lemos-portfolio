// -------------------------
// Config apply (demo/local)
// -------------------------
(() => {
  const cfg = window.__PORTFOLIO__;
  if (!cfg) return;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el && text != null) el.textContent = text;
  };

  const setHref = (id, href) => {
    const el = document.getElementById(id);
    if (el && href) el.href = href;
  };

  // Contact
  const emailEl = document.getElementById("contactEmail");
  if (emailEl && cfg.email) {
    emailEl.textContent = cfg.email;
    emailEl.href = `mailto:${cfg.email}`;
  }

  setText("contactLocation", cfg.location);
  setText("contactResponse", cfg.responseTime);

  // Socials
  setHref("linkGithub", cfg.socials?.github);
  setHref("linkLinkedin", cfg.socials?.linkedin);
  setHref("linkInstagram", cfg.socials?.instagram);
  setHref("linkWhatsapp", cfg.socials?.whatsapp);

  // CV
  const cvLink = document.getElementById("cvLink");

  if (cvLink && cfg.cvUrl) {
    cvLink.href = cfg.cvUrl;

    // remove download se for link externo
    if (/^https?:\/\//.test(cfg.cvUrl)) {
      cvLink.removeAttribute("download");
      cvLink.setAttribute("target", "_blank");
      cvLink.setAttribute("rel", "noopener");
    }
  }

  // Avatar
  const avatar = document.getElementById("avatarImg");
  if (avatar && cfg.images?.avatar) {
    avatar.src = cfg.images.avatar;
  }
})();

// =============================
// Main.js (Carousels + Navbar + Dropdown + Mobile Drawer + Theme + i18n + Hero Marquee + Reveal)
// =============================

// ---------- Helpers ----------
function qs(id) {
  return document.getElementById(id);
}

// -----------------------------------------
// I18N LOADER (local -> fallback demo)
// -----------------------------------------
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function ensureI18NLoaded() {
  // Se já existe, não recarrega
  if (window.__I18N__ && (window.__I18N__.en || window.__I18N__["pt-BR"])) {
    return true;
  }

  try {
    await loadScript("/js/i18n.local.js");
  } catch (_) {
    await loadScript("/js/i18n.demo.js");
  }

  // garante que o global realmente existe
  return !!(window.__I18N__ && (window.__I18N__.en || window.__I18N__["pt-BR"]));
}

// =============================
// 0) Reveal global (todas as seções) - .reveal / .reveal-orbit
// =============================
document
  .querySelectorAll(".scroll-indicator.reveal")
  .forEach((el) => el.classList.add("is-in"));

(() => {
  const els = document.querySelectorAll(".reveal, .reveal-orbit");
  if (!els.length) return;

  const prefersReduce =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (prefersReduce) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  els.forEach((el) => io.observe(el));
})();

// =============================
// 1) Carousel INFINITO REAL (Design / Dev)
// =============================
function initInfiniteCarousel({
  viewportId,
  trackId,
  moveFnName,
  duration = 520,
  repeats = 13,
}) {
  const viewport = qs(viewportId);
  const track = qs(trackId);
  if (!viewport || !track) return;

  if (!document.getElementById("__carouselJumpStyle")) {
    const st = document.createElement("style");
    st.id = "__carouselJumpStyle";
    st.textContent = `
      .__carousel-jumping .carousel-slide{
        transition: none !important;
      }
    `;
    document.head.appendChild(st);
  }

  const getSlides = () =>
    Array.from(track.children).filter((el) =>
      el.classList.contains("carousel-slide")
    );

  if (!track.dataset.baseHtml) {
    const baseSlides = getSlides();
    if (baseSlides.length < 2) return;
    track.dataset.baseHtml = baseSlides.map((n) => n.outerHTML).join("");
  }

  const baseWrapper = document.createElement("div");
  baseWrapper.innerHTML = track.dataset.baseHtml;

  const baseSlides = Array.from(baseWrapper.children).filter((el) =>
    el.classList.contains("carousel-slide")
  );
  const baseCount = baseSlides.length;
  if (baseCount < 2) return;

  repeats = Math.max(11, repeats | 0);
  if (repeats % 2 === 0) repeats += 1;

  if (!track.dataset.loopBuilt || track.dataset.repeats !== String(repeats)) {
    track.innerHTML = "";
    const frag = document.createDocumentFragment();

    for (let r = 0; r < repeats; r++) {
      for (let i = 0; i < baseCount; i++) {
        const node = baseSlides[i].cloneNode(true);
        node.dataset.baseIndex = String(i);
        node.dataset.rep = String(r);
        frag.appendChild(node);
      }
    }

    track.appendChild(frag);
    track.dataset.loopBuilt = "true";
    track.dataset.repeats = String(repeats);
    track.dataset.baseCount = String(baseCount);
  }

  const total = baseCount * repeats;
  const midRep = Math.floor(repeats / 2);
  const midStart = baseCount * midRep;

  let index = midStart;
  let isAnimating = false;

  const allSlides = () => getSlides();

  function setActive() {
    const slides = allSlides();
    slides.forEach((s) => s.classList.remove("is-active"));
    slides[index]?.classList.add("is-active");
  }

  function translateTo(i, animate = true) {
    const slides = allSlides();
    const s = slides[i];
    if (!s) return;

    const vpW = viewport.clientWidth;
    const center = s.offsetLeft + s.offsetWidth / 2;
    const offset = center - vpW / 2;

    track.style.transition = animate
      ? `transform ${duration}ms cubic-bezier(.2,.9,.2,1)`
      : "none";

    track.style.transform = `translate3d(${-Math.round(offset)}px,0,0)`;
  }

  function jumpToMiddleSameBase() {
    const slides = allSlides();
    const cur = slides[index];
    if (!cur) return false;

    const baseIndex = parseInt(cur.dataset.baseIndex || "0", 10);
    const newIndex = midStart + baseIndex;

    if (newIndex === index) return false;

    track.classList.add("__carousel-jumping");
    index = newIndex;

    translateTo(index, false);
    setActive();

    void track.getBoundingClientRect();
    requestAnimationFrame(() => track.classList.remove("__carousel-jumping"));

    return true;
  }

  function ensureSafeZoneBeforeMove(dir) {
    const leftGuard = baseCount * 2;
    const rightGuard = total - baseCount * 3;

    if (dir > 0 && index >= rightGuard) return jumpToMiddleSameBase();
    if (dir < 0 && index <= leftGuard) return jumpToMiddleSameBase();
    return false;
  }

  function animateMove(dir) {
    isAnimating = true;

    index += dir;
    if (index < 0) index = 0;
    if (index > total - 1) index = total - 1;

    translateTo(index, true);
    setActive();
  }

  function move(dir) {
    if (isAnimating) return;
    ensureSafeZoneBeforeMove(dir);
    requestAnimationFrame(() => {
      if (isAnimating) return;
      animateMove(dir);
    });
  }

  window[moveFnName] = move;

  function onTransitionEnd(e) {
    if (e.target !== track || e.propertyName !== "transform") return;

    const leftEdge = baseCount * 1;
    const rightEdge = total - baseCount * 2;

    if (index <= leftEdge || index >= rightEdge) jumpToMiddleSameBase();
    isAnimating = false;
  }

  track.addEventListener("transitionend", onTransitionEnd);

  function initPosition() {
    index = midStart;
    requestAnimationFrame(() => {
      translateTo(index, false);
      setActive();
      requestAnimationFrame(() => translateTo(index, false));
    });
  }

  window.addEventListener("load", initPosition);
  setTimeout(initPosition, 60);
  setTimeout(initPosition, 220);

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => translateTo(index, false), 90);
  });

  window.addEventListener("blur", () => {
    isAnimating = false;
  });
}

// init carousels (Design/Dev)
initInfiniteCarousel({
  viewportId: "design-viewport",
  trackId: "design-carousel",
  moveFnName: "moveDesignSlide",
  duration: 520,
  repeats: 13,
});

initInfiniteCarousel({
  viewportId: "dev-viewport",
  trackId: "dev-carousel",
  moveFnName: "moveDevSlide",
  duration: 520,
  repeats: 13,
});

// =============================
// 2) Navbar: Desktop Projects Dropdown + Mobile Drawer + Theme + i18n
// =============================
(async () => {
  if (window.__NAV_BOUND__) return;
  window.__NAV_BOUND__ = true;

  const projectsBtn = qs("projectsDropdownBtn");
  const projectsMenu = qs("projectsDropdown");
  const projectsChevron = qs("projectsChevron");

  function setProjectsDropdown(open) {
    if (!projectsBtn || !projectsMenu) return;

    projectsMenu.classList.toggle("hidden", !open);
    projectsBtn.setAttribute("aria-expanded", open ? "true" : "false");
    projectsChevron?.classList.toggle("rotate-180", open);

    if (open) projectsBtn.classList.add("is-active");
    else projectsBtn.classList.remove("is-active");
  }

  projectsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = projectsMenu && !projectsMenu.classList.contains("hidden");
    setProjectsDropdown(!isOpen);
  });

  projectsMenu?.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) setProjectsDropdown(false);
  });

  document.addEventListener("click", () => setProjectsDropdown(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setProjectsDropdown(false);
  });

  // ---------- Theme ----------
  const root = document.documentElement;

  const themeToggle = qs("themeToggle");
  const iconMoon = qs("iconMoon");
  const iconSun = qs("iconSun");

  const themeToggleMobile = qs("themeToggleMobile");
  const iconMoonMobile = qs("iconMoonMobile");
  const iconSunMobile = qs("iconSunMobile");

  const langToggle = qs("langToggle");
  const langLabel = qs("langLabel");
  const langToggleMobile = qs("langToggleMobile");
  const langLabelMobile = qs("langLabelMobile");

  function setMarqueeIconColor(hex) {
    const marquee = document.querySelector("#home [data-marquee]");
    if (!marquee) return;

    marquee.querySelectorAll("img.icon").forEach((img) => {
      if (!img.src) return;
      img.src = img.src.replace(/\/[0-9a-fA-F]{3,6}(\?.*)?$/, `/${hex}$1`);
    });
  }

  function syncThemeIcons(theme) {
    const isLight = theme === "light";

    if (iconMoon && iconSun) {
      iconMoon.classList.toggle("hidden", isLight);
      iconSun.classList.toggle("hidden", !isLight);
    }

    if (iconMoonMobile && iconSunMobile) {
      iconMoonMobile.classList.toggle("hidden", isLight);
      iconSunMobile.classList.toggle("hidden", !isLight);
    }
  }

  function applyTheme(theme) {
    const isLight = theme === "light";

    root.classList.toggle("dark", !isLight);
    setMarqueeIconColor(isLight ? "111827" : "ffffff");
    syncThemeIcons(theme);

    const bg = document.getElementById("bgGlow");
    if (bg) {
      bg.style.setProperty("--mx", "0.501");
      bg.style.setProperty("--my", "0.499");
    }

    localStorage.setItem("theme", theme);
  }

  function toggleTheme() {
    const isDark = root.classList.contains("dark");
    applyTheme(isDark ? "light" : "dark");
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    applyTheme(savedTheme);
  } else {
    const prefersLight =
      window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
    applyTheme(prefersLight ? "light" : "dark");
  }

  themeToggle?.addEventListener("click", toggleTheme);
  themeToggleMobile?.addEventListener("click", toggleTheme);

  // ---------- i18n: GARANTE LOAD (local -> demo) ----------
  await ensureI18NLoaded();

  const LANG_BINDINGS = [
    { sel: 'nav[aria-label="Primary"] a[data-nav="home"]', key: "nav_home" },
    { sel: 'nav[aria-label="Primary"] a[data-nav="skills"]', key: "nav_skills" },
    { sel: 'nav[aria-label="Primary"] a[data-nav="experience"]', key: "nav_experience" },
    { sel: 'nav[aria-label="Primary"] button#projectsDropdownBtn', key: "nav_projects", mode: "firstTextNode" },
    { sel: 'nav[aria-label="Primary"] a[data-nav="contact"]', key: "nav_contact" },
    { sel: 'header a[href="#contact"].md\\:inline-flex', key: "cta_talk" },

    { sel: "#mobileDrawer h3", key: "menu_title" },

    { sel: '#mobileMenu nav[aria-label="Mobile navigation"] a[href="#home"] span:first-child', key: "nav_home" },
    { sel: '#mobileMenu nav[aria-label="Mobile navigation"] a[href="#skills"] span:first-child', key: "nav_skills" },
    { sel: '#mobileMenu nav[aria-label="Mobile navigation"] a[href="#experience"] span:first-child', key: "nav_experience" },
    { sel: "#mobileProjectsBtn span:first-child", key: "nav_projects" },
    { sel: '#mobileProjectsPanel a[href="#dev-projects"] span:first-child', key: "chip_dev" },
    { sel: '#mobileProjectsPanel a[href="#design-projects"] span:first-child', key: "chip_design" },
    { sel: '#mobileMenu nav[aria-label="Mobile navigation"] a[href="#contact"] span:first-child', key: "nav_contact" },

    { sel: '#projectsDropdown a[href="#dev-projects"] span:first-child', key: "chip_dev" },
    { sel: '#projectsDropdown a[href="#design-projects"] span:first-child', key: "chip_design" },

    { sel: '#home .reveal span.inline-flex .badge-text', key: "badge_available" },
    { sel: "#home p.reveal.text-gray-300", key: "hero_hey", mode: "replacePrefixBeforeName" },
    { sel: "#home h1", key: "hero_title_combo", mode: "heroTitle" },
    { sel: "#home p.reveal.text-gray-400", key: "hero_sub" },
    { sel: '#home a[href="#contact"].bg-purple-600', key: "hero_hire" },
    { sel: "#home a[download]", key: "hero_cv" },
    { sel: "#home .reveal.pt-6 p.text-sm", key: "hero_follow" },
    { sel: "#home a.scroll-indicator span.text-xs", key: "hero_scroll" },

    { sel: "#skills .skills-header .badge-text", key: "skills_badge" },
    { sel: "#skills .skills-header h2.reveal", key: "skills_title", mode: "keepAmpersandPurple" },
    { sel: "#skills .skills-header p.reveal.text-gray-400", key: "skills_sub" },
    { sel: "#skills .skills-orb-wrap p.text-sm", key: "skills_orb_hint" },
    { sel: "#skills .skills-orb-wrap .reveal.space-y-4 p.text-gray-300", key: "skills_p1" },
    { sel: "#skills .skills-orb-wrap .reveal.space-y-4 p.text-gray-400", key: "skills_p2" },

    { sel: "#contact .text-gray-400.text-sm", key: "contact_app" },
    { sel: "#contact h2.text-3xl", key: "contact_title" },
    { sel: "#contact p.text-gray-400.leading-relaxed", key: "contact_sub" },

    { sel: '#contact label[for="cf_name"]', key: "form_name" },
    { sel: '#contact #cf_name', key: "form_name_ph", attr: "placeholder" },

    { sel: '#contact label:has(+ input[type="email"])', key: "form_email" },
    { sel: '#contact input[type="email"]', key: "form_email_ph", attr: "placeholder" },

    { sel: "#contact label:has(+ textarea)", key: "form_msg" },
    { sel: "#contact textarea", key: "form_msg_ph", attr: "placeholder" },

    { sel: '#contact button[type="submit"]', key: "form_send" },
    { sel: "#contact p.text-gray-200", key: "findme" },
    { sel: "#contact p.text-gray-500.text-sm", key: "rights" },

    { sel: '#mobileDrawer a[href="#contact"] .cta-text', key: "get_in_touch" },
  ];

  function setLangButtonUI(lang) {
    const isPT = lang === "pt-BR";
    const label = isPT ? "PT" : "EN";

    if (langLabel) langLabel.textContent = label;
    if (langLabelMobile) langLabelMobile.textContent = label;

    langToggle?.setAttribute("aria-pressed", isPT ? "true" : "false");
    langToggleMobile?.setAttribute("aria-pressed", isPT ? "true" : "false");
  }

  function applyBinding(el, text, mode) {
    if (!el) return;

    if (mode === "firstTextNode") {
      const node = Array.from(el.childNodes).find(
        (n) => n.nodeType === Node.TEXT_NODE
      );
      if (node) node.textContent = " " + text + " ";
      else el.textContent = text;
      return;
    }

    if (mode === "textOnlyInElement") {
      Array.from(el.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) n.remove();
      });
      el.insertBefore(document.createTextNode(" " + text + " "), el.firstChild);
      return;
    }

    if (mode === "replacePrefixBeforeName") {
      const span = el.querySelector("span");
      if (!span) {
        el.textContent = text;
        return;
      }
      const after = el.textContent.split(span.textContent)[1] || "";
      el.innerHTML = `${text} ${span.outerHTML}${after}`;
      return;
    }

    if (mode === "heroTitle") {
      const parts = String(text).split("|");
      const a = (parts[0] || "").trim();
      const b = (parts[1] || "").trim();
      el.innerHTML = `${a} <span class="text-purple-500">&</span><br /> ${b}`;
      return;
    }

    if (mode === "keepAmpersandPurple") {
      const parts = String(text).split("|");
      const left = (parts[0] || "").replace(/&/g, "").trim();
      const right = (parts[1] || "").replace(/&/g, "").trim();

      const ampSpan = document.createElement("span");
      ampSpan.className = "text-purple-400";
      ampSpan.textContent = "&";

      el.innerHTML = "";
      el.appendChild(document.createTextNode(left + " "));
      el.appendChild(ampSpan);
      el.appendChild(document.createTextNode(" " + right));
      return;
    }

    el.textContent = text;
  }

  function applyLanguage(lang) {
    const I18N = window.__I18N__ || { en: {}, "pt-BR": {} };
    const dict = I18N[lang] || I18N.en || {};

    document.documentElement.setAttribute("lang", lang === "pt-BR" ? "pt-BR" : "en");
    setLangButtonUI(lang);

    const heroTitleText =
      lang === "pt-BR" ? "Designer|Desenvolvedor" : "Designer|Developer";
    const skillsTitleText = "Skills|Stack";
    const expTitleText =
      lang === "pt-BR"
        ? "3+ anos construindo |produtos web"
        : "3+ years building |web products";

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      const txt = dict[key];
      if (!txt) return;
      node.textContent = txt;
    });

    LANG_BINDINGS.forEach((b) => {
      const dictVal = dict[b.key];

      const val =
        b.key === "hero_title_1"
          ? heroTitleText
          : b.key === "skills_title"
          ? skillsTitleText
          : b.key === "exp_title"
          ? expTitleText
          : dictVal;

      if (!val) return;

      const el = document.querySelector(b.sel);
      if (!el) return;

      if (b.attr) {
        el.setAttribute(b.attr, val);
        return;
      }
      applyBinding(el, val, b.mode);
    });

    localStorage.setItem("lang", lang);
  }

  window.__APPLY_LANG__ = () => {
    const savedLang = localStorage.getItem("lang");
    applyLanguage(savedLang === "pt-BR" ? "pt-BR" : "en");
  };

  function toggleLanguage() {
    const current = localStorage.getItem("lang") || "en";
    applyLanguage(current === "pt-BR" ? "en" : "pt-BR");
  }

  window.__APPLY_LANG__();

  langToggle?.addEventListener("click", toggleLanguage);
  langToggleMobile?.addEventListener("click", toggleLanguage);

  // ---------- Mobile Drawer ----------
  (() => {
    if (window.__MOBILE_DRAWER_BOUND__) return;
    window.__MOBILE_DRAWER_BOUND__ = true;

    const menuToggle = qs("menuToggle");
    const mobileMenu = qs("mobileMenu");
    const mobileBackdrop = qs("mobileBackdrop");
    const mobileDrawer = qs("mobileDrawer");
    const mobileClose = qs("mobileClose");

    const mobileProjectsBtn = qs("mobileProjectsBtn");
    const mobileProjectsPanel = qs("mobileProjectsPanel");
    const mobileProjectsChevron = qs("mobileProjectsChevron");

    if (!mobileMenu || !mobileBackdrop || !mobileDrawer) return;

    let open = false;

    function isMobileHeader() {
      return window.matchMedia("(max-width: 1046.98px)").matches;
    }

    function setMobileProjects(isOpen) {
      if (!mobileProjectsBtn || !mobileProjectsPanel) return;
      mobileProjectsPanel.classList.toggle("hidden", !isOpen);
      mobileProjectsBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileProjectsChevron?.classList.toggle("rotate-180", isOpen);
    }

    function openDrawer() {
      if (open) return;
      open = true;

      mobileMenu.classList.remove("hidden");
      mobileMenu.setAttribute("aria-hidden", "false");
      menuToggle?.setAttribute("aria-expanded", "true");

      document.documentElement.classList.add("overflow-hidden");
      document.body.classList.add("overflow-hidden");

      requestAnimationFrame(() => {
        mobileBackdrop.classList.remove("opacity-0");
        mobileDrawer.classList.remove("translate-x-full");
      });
    }

    function closeDrawer() {
      if (!open) return;
      open = false;

      mobileBackdrop.classList.add("opacity-0");
      mobileDrawer.classList.add("translate-x-full");

      mobileMenu.setAttribute("aria-hidden", "true");
      menuToggle?.setAttribute("aria-expanded", "false");

      setMobileProjects(false);

      setTimeout(() => {
        mobileMenu.classList.add("hidden");
        document.documentElement.classList.remove("overflow-hidden");
        document.body.classList.remove("overflow-hidden");
      }, 320);
    }

    document.addEventListener("click", (e) => {
      const t = e.target;

      if (t.closest("#menuToggle")) {
        if (!isMobileHeader()) return;
        openDrawer();
        setProjectsDropdown(false);
        return;
      }

      if (t.closest("#mobileClose")) {
        closeDrawer();
        return;
      }

      if (t.closest("#mobileBackdrop")) {
        closeDrawer();
        return;
      }

      if (t.closest("#mobileProjectsBtn")) {
        e.preventDefault();
        const isOpen =
          mobileProjectsPanel && !mobileProjectsPanel.classList.contains("hidden");
        setMobileProjects(!isOpen);
        return;
      }

      if (open && t.closest("#mobileDrawer a")) {
        closeDrawer();
        return;
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDrawer();
        setProjectsDropdown(false);
      }
    });

    window.addEventListener("resize", () => {
      if (!isMobileHeader() && open) closeDrawer();
    });
  })();
})();

// =============================
// 3) Active nav by section (desktop) + map Projects
// =============================
(() => {
  const navLinks = document.querySelectorAll("[data-nav]");
  const sections = document.querySelectorAll("section[id]");

  if (!navLinks.length || !sections.length) return;

  const mapSectionToNav = (id) => {
    if (id === "dev-projects" || id === "design-projects") return "projects";
    return id;
  };

  function clearActive() {
    navLinks.forEach((l) => l.classList.remove("is-active"));
  }

  function setActive(navKey) {
    clearActive();
    navLinks.forEach((l) => {
      if (l.dataset.nav === navKey) l.classList.add("is-active");
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      setActive(mapSectionToNav(visible.target.id));
    },
    {
      rootMargin: "-40% 0px -50% 0px",
      threshold: [0, 0.15, 0.25, 0.35, 0.5, 0.65, 0.8, 1],
    }
  );

  sections.forEach((s) => observer.observe(s));
})();

// =============================
// 5) HERO marquee: shift estável (sem pulo)
// =============================
(() => {
  const home = document.getElementById("home");
  if (!home) return;

  const marquee = home.querySelector("[data-marquee]");
  const set1 = home.querySelector("[data-set]");
  if (!marquee || !set1) return;

  const imgs = Array.from(marquee.querySelectorAll("img"));

  const waitImages = Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((res) => {
            img.addEventListener("load", res, { once: true });
            img.addEventListener("error", res, { once: true });
          })
    )
  );

  function applyShift() {
    const w = Math.ceil(set1.scrollWidth);
    marquee.style.setProperty("--marquee-shift", `${w}px`);
  }

  function scheduleRecalc() {
    applyShift();
    requestAnimationFrame(applyShift);
    setTimeout(applyShift, 150);
  }

  waitImages.then(() => {
    scheduleRecalc();

    window.addEventListener("resize", () => {
      clearTimeout(window.__mqT);
      window.__mqT = setTimeout(scheduleRecalc, 120);
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleRecalc).catch(() => {});
    }
  });
})();

// =============================
// 6) Reveal por atributo [data-reveal] (Projects/Sections)
// =============================
(() => {
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!revealEls.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-inview");
      });
    },
    { threshold: 0.18 }
  );

  revealEls.forEach((el) => io.observe(el));
})();

//Envio do Form
(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const status = document.getElementById("contactStatus");
  const btn = document.getElementById("contactSubmit");

  const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY; // Web3Forms

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(form);

    // honeypot check
    if (data.get("website")) {
      console.warn("Bot detected. Submission ignored.");
      return;
    }

    data.append("access_key", ACCESS_KEY);
    data.append("subject", "Novo contato pelo Portfolio");
    data.append("from_name", "Portfolio - Emmanuel Lemos");

    try {
      btn.disabled = true;
      btn.textContent = "Sending...";
      status?.classList.remove("hidden");
      if (status) status.textContent = "Sending your message...";

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: data,
      });

      const json = await res.json();

      if (json.success) {
        if (status) status.textContent = "Message sent! I’ll reply soon.";
        form.reset();
      } else {
        if (status) status.textContent = "Something went wrong. Please try again.";
      }
    } catch (err) {
      if (status) status.textContent = "Network error. Please try again.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Send Message";
    }
  });
})();
