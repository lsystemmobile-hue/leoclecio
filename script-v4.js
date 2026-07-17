/* =========================================================
   Performance-first script — zero layout thrashing,
   GPU-composited animations only, all listeners passive.
   ========================================================= */

// ── Smooth anchor scroll via RAF (replaces CSS scroll-behavior) ──
(function () {
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function smoothScrollTo(targetY, duration) {
    const startY = window.scrollY;
    const diff = targetY - startY;
    let startTime = null;

    function step(currentTime) {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + diff * easeOutCubic(progress));
      if (elapsed < duration) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  document.addEventListener("click", function (e) {
    const link = e.target.closest("a[href^='#']");
    if (!link) return;
    const hash = link.getAttribute("href");
    if (hash === "#") return;
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    const offset = 90;
    const targetY = target.getBoundingClientRect().top + window.scrollY - offset;
    smoothScrollTo(targetY, 450);
    history.pushState(null, "", hash);
  });
})();

// ── Scroll-driven updates (RAF-throttled) ──
const timeline = document.querySelector(".timeline");
const timelineProgress = document.querySelector(".timeline__progress");
const scrollProgressBar = document.querySelector(".scroll-progress");
const navElement = document.querySelector(".nav");

let timelineTop = 0;
let timelineHeight = 1;
let pageHeight = 1;
let innerH = window.innerHeight;

function recacheLayout() {
  if (timeline) {
    const rect = timeline.getBoundingClientRect();
    timelineTop = rect.top + window.scrollY;
    timelineHeight = rect.height || 1;
  }
  pageHeight = document.documentElement.scrollHeight - window.innerHeight || 1;
  innerH = window.innerHeight;
}

recacheLayout();
window.addEventListener("resize", recacheLayout, { passive: true });

let rafPending = false;

function onScroll() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(function () {
    rafPending = false;
    const scrollY = window.scrollY;

    if (timelineProgress) {
      const traveled = (scrollY + innerH * 0.58) - timelineTop;
      const progress = Math.min(Math.max(traveled / timelineHeight, 0), 1);
      timelineProgress.style.transform = "scaleY(" + progress + ")";
    }

    if (scrollProgressBar) {
      scrollProgressBar.style.transform = "scaleX(" + (scrollY / pageHeight) + ")";
    }

    if (navElement) {
      navElement.classList.toggle("nav--scrolled", scrollY > 50);
    }
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ── Ambient orbs (RAF-throttled, desktop hover only) ──
const ambientOne = document.querySelector(".ambient--one");
const ambientTwo = document.querySelector(".ambient--two");

if ((ambientOne || ambientTwo) && window.matchMedia("(hover: hover)").matches) {
  let mousePending = false;
  let mx = 0, my = 0;

  window.addEventListener("mousemove", function (e) {
    mx = e.clientX;
    my = e.clientY;
    if (mousePending) return;
    mousePending = true;
    requestAnimationFrame(function () {
      mousePending = false;
      const x = (mx - window.innerWidth / 2) * 0.05;
      const y = (my - window.innerHeight / 2) * 0.05;
      if (ambientOne) ambientOne.style.transform = "translate(" + x + "px," + y + "px)";
      if (ambientTwo) ambientTwo.style.transform = "translate(" + (-x) + "px," + (-y) + "px)";
    });
  }, { passive: true });
}

// ── IntersectionObserver for reveal animations ──
const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });

revealElements.forEach(function (el) { revealObserver.observe(el); });

// ── Portfolio: tabs + auto-slideshow ──
(function () {
  const tabs   = document.querySelectorAll(".portfolio__tab");
  const panels = document.querySelectorAll(".portfolio__panel");
  const started = new Set();

  function startSlider(panel) {
    if (started.has(panel)) return;
    const sliderEl = panel.querySelector(".portfolio__slider");
    if (!sliderEl) return;
    started.add(panel);
    const slides = Array.from(sliderEl.querySelectorAll(".portfolio__slide"));
    if (slides.length < 2) return;
    let current = 0;

    function goTo(index) {
      slides[current].classList.remove("is-active");
      current = index % slides.length;
      slides[current].classList.add("is-active");
      setTimeout(function () { goTo(current + 1); }, 1800);
    }

    setTimeout(function () { goTo(1); }, 1800);
  }

  function switchTab(target) {
    tabs.forEach(function (t) { t.classList.remove("is-active"); });
    panels.forEach(function (p) { p.classList.remove("is-active"); });
    const activeTab = document.querySelector('.portfolio__tab[data-tab="' + target + '"]');
    if (activeTab) activeTab.classList.add("is-active");
    const activePanel = document.querySelector('.portfolio__panel[data-panel="' + target + '"]');
    if (activePanel) {
      activePanel.classList.add("is-active");
      startSlider(activePanel);
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () { switchTab(tab.dataset.tab); });
  });

  document.addEventListener("click", function (e) {
    const card = e.target.closest(".portfolio__project--card");
    if (card && card.dataset.gotoTab) switchTab(card.dataset.gotoTab);
  });

  const firstActive = document.querySelector(".portfolio__panel.is-active");
  if (firstActive) startSlider(firstActive);
}());

// ── Typewriter: "Resultados" and "que aparecem." ──
(function () {
  const textEls = document.querySelectorAll(".hero h1 > span");
  if (textEls.length === 0) return;

  const allSpans = [];

  textEls.forEach(function (textEl) {
    const text = textEl.textContent.trim();
    textEl.innerHTML = "";
    textEl.style.opacity = "1";

    const fragment = document.createDocumentFragment();

    text.split("").forEach(function (char) {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.cssText = "opacity:0;transform:translateY(6px);transition:opacity 300ms cubic-bezier(0.16,1,0.3,1),transform 300ms cubic-bezier(0.16,1,0.3,1);display:" + (char === " " ? "inline" : "inline-block");
      fragment.appendChild(span);
      allSpans.push(span);
    });

    textEl.appendChild(fragment);
  });

  allSpans.forEach(function (span, i) {
    setTimeout(function () {
      requestAnimationFrame(function () {
        span.style.opacity = "1";
        span.style.transform = "translateY(0)";
      });
    }, 450 + i * 65);
  });
}());
