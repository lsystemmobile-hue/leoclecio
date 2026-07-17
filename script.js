const revealElements = document.querySelectorAll(".reveal");
const timeline = document.querySelector(".timeline");
const timelineProgress = document.querySelector(".timeline__progress");
const scrollProgressBar = document.querySelector(".scroll-progress");
const ambientOne = document.querySelector(".ambient--one");
const ambientTwo = document.querySelector(".ambient--two");
const navElement = document.querySelector(".nav");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  }
);

revealElements.forEach((element) => revealObserver.observe(element));

function updateTimelineProgress() {
  if (timeline && timelineProgress) {
    const timelineRect = timeline.getBoundingClientRect();
    const viewportTrigger = window.innerHeight * 0.58;
    const traveled = viewportTrigger - timelineRect.top;
    const progress = Math.min(Math.max(traveled / timelineRect.height, 0), 1);
    timelineProgress.style.transform = `scaleY(${progress})`;
  }

  if (scrollProgressBar) {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0;
    scrollProgressBar.style.transform = `scaleX(${progress})`;
  }

  if (navElement) {
    if (window.scrollY > 50) {
      navElement.classList.add("nav--scrolled");
    } else {
      navElement.classList.remove("nav--scrolled");
    }
  }
}

let ticking = false;

function requestTimelineUpdate() {
  if (ticking) return;

  window.requestAnimationFrame(() => {
    updateTimelineProgress();
    ticking = false;
  });

  ticking = true;
}

window.addEventListener("scroll", requestTimelineUpdate, { passive: true });
window.addEventListener("resize", requestTimelineUpdate);
window.addEventListener("load", requestTimelineUpdate);

requestTimelineUpdate();

if (ambientOne || ambientTwo) {
  window.addEventListener("mousemove", (e) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) * 0.05;
    const y = (clientY - window.innerHeight / 2) * 0.05;

    if (ambientOne) ambientOne.style.transform = `translate(${x}px, ${y}px)`;
    if (ambientTwo) ambientTwo.style.transform = `translate(${-x}px, ${-y}px)`;
  });
}

// Portfolio: tabs + slideshow (múltiplos painéis)
(function () {
  const tabs    = document.querySelectorAll(".portfolio__tab");
  const panels  = document.querySelectorAll(".portfolio__panel");
  const started = new Set();

  function startSlider(panel) {
    if (started.has(panel)) return;
    const sliderEl = panel.querySelector(".portfolio__slider");
    if (!sliderEl) return;
    started.add(panel);
    const slides = Array.from(sliderEl.querySelectorAll(".portfolio__slide"));
    let current = 0;

    function goTo(index) {
      slides[current].classList.remove("is-active");
      current = index % slides.length;
      slides[current].classList.add("is-active");
      setTimeout(() => goTo(current + 1), 1500);
    }

    setTimeout(() => goTo(1), 1500);
  }

  function switchTab(target) {
    tabs.forEach((t)  => t.classList.remove("is-active"));
    panels.forEach((p) => p.classList.remove("is-active"));
    const activeTab = document.querySelector(`.portfolio__tab[data-tab="${target}"]`);
    if (activeTab) activeTab.classList.add("is-active");
    const activePanel = document.querySelector(`.portfolio__panel[data-panel="${target}"]`);
    if (activePanel) {
      activePanel.classList.add("is-active");
      startSlider(activePanel);
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.addEventListener("click", (e) => {
    const card = e.target.closest(".portfolio__project--card");
    if (card) {
      const target = card.dataset.gotoTab;
      if (target) switchTab(target);
    }
  });

  const activePanelOnLoad = document.querySelector(".portfolio__panel.is-active");
  if (activePanelOnLoad) {
    startSlider(activePanelOnLoad);
  }
}());


// Efeito de surgimento letra por letra para "Resultados que aparecem."
(function () {
  const textEl = document.querySelector(".hero h1 span");
  if (textEl) {
    const text = textEl.textContent.trim();
    textEl.innerHTML = "";
    textEl.style.opacity = "1";
    
    text.split("").forEach((char, index) => {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.opacity = "0";
      span.style.transform = "translateY(6px)";
      span.style.transition = "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 300ms cubic-bezier(0.16, 1, 0.3, 1)";
      span.style.display = char === " " ? "inline" : "inline-block";
      
      textEl.appendChild(span);
      
      // Delay inicial de 450ms para desimpedir a thread do navegador e começar do "R"
      setTimeout(() => {
        span.style.opacity = "1";
        span.style.transform = "translateY(0)";
      }, 450 + index * 75);
    });
  }
}());

