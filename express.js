/* =========================================================
   Site Express — Form Validation & Countdown Timer Script
   ========================================================= */

(function () {
  // ── Smooth anchor scroll ──
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
  });
})();

// ── Scroll updates (RAF-throttled) ──
const scrollProgressBar = document.querySelector(".scroll-progress");
const navElement = document.querySelector(".nav");

let pageHeight = 1;
function recacheLayout() {
  pageHeight = document.documentElement.scrollHeight - window.innerHeight || 1;
}
recacheLayout();
window.addEventListener("resize", recacheLayout, { passive: true });

let rafPending = false;
window.addEventListener("scroll", function () {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(function () {
    rafPending = false;
    const scrollY = window.scrollY;
    if (scrollProgressBar) {
      scrollProgressBar.style.transform = "scaleX(" + (scrollY / pageHeight) + ")";
    }
    if (navElement) {
      navElement.classList.toggle("nav--scrolled", scrollY > 50);
    }
  });
}, { passive: true });

// ── Ambient orbs (MouseMove parallax) ──
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
      const x = (mx - window.innerWidth / 2) * 0.04;
      const y = (my - window.innerHeight / 2) * 0.04;
      if (ambientOne) ambientOne.style.transform = "translate(" + x + "px," + y + "px)";
      if (ambientTwo) ambientTwo.style.transform = "translate(" + (-x) + "px," + (-y) + "px)";
    });
  }, { passive: true });
}

// ── Form & Countdown Elements ──
const form = document.getElementById("express-form");
const successCard = document.getElementById("express-success");
const timerEl = document.getElementById("countdown-timer");
const progressFillEl = document.getElementById("countdown-progress");
const whatsappBtn = document.getElementById("express-whatsapp-btn");

const nameInput = document.getElementById("express-name");
const whatsappInput = document.getElementById("express-whatsapp");
const emailInput = document.getElementById("express-email");
const instagramInput = document.getElementById("express-instagram");
const businessInput = document.getElementById("express-business");
const colorsInput = document.getElementById("express-colors");
const goalSelect = document.getElementById("express-goal");
const notesInput = document.getElementById("express-notes");

const DEVELOPER_PHONE = "5515992568868";
const DEMO_DURATION = 7 * 60 * 60 * 1000; // 7 Hours in ms

// ── WhatsApp Mask Input ──
if (whatsappInput) {
  whatsappInput.addEventListener("input", function (e) {
    let x = e.target.value.replace(/\D/g, "").match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
    if (!x[2]) {
      e.target.value = x[1];
    } else {
      e.target.value = "(" + x[1] + ") " + x[2] + (x[3] ? "-" + x[3] : "");
    }
  });
}

// ── Countdown logic ──
let countdownInterval;

function startCountdown(deadline) {
  function updateTimer() {
    const now = Date.now();
    const timeLeft = deadline - now;

    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      if (timerEl) timerEl.textContent = "00:00:00";
      if (progressFillEl) progressFillEl.style.width = "100%";
      return;
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const formattedTime = 
      String(hours).padStart(2, "0") + ":" + 
      String(minutes).padStart(2, "0") + ":" + 
      String(seconds).padStart(2, "0");

    if (timerEl) timerEl.textContent = formattedTime;

    const elapsed = DEMO_DURATION - timeLeft;
    const progressPercent = Math.min((elapsed / DEMO_DURATION) * 100, 100);
    if (progressFillEl) progressFillEl.style.width = progressPercent + "%";
  }

  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

// ── Handle view states based on LocalStorage deadline ──
function checkActiveDeadline() {
  const storedDeadline = localStorage.getItem("express_demo_deadline_v2");
  if (storedDeadline) {
    const deadline = parseInt(storedDeadline, 10);
    if (deadline > Date.now()) {
      // Form was already submitted and timer is active
      form.style.display = "none";
      successCard.style.display = "flex";
      
      const storedWhatsAppLink = localStorage.getItem("express_demo_whatsapp_link_v2");
      if (storedWhatsAppLink && whatsappBtn) {
        whatsappBtn.setAttribute("href", storedWhatsAppLink);
      }
      
      startCountdown(deadline);
    } else {
      // Stored deadline has passed, clear it so they can submit again
      localStorage.removeItem("express_demo_deadline_v2");
      localStorage.removeItem("express_demo_whatsapp_link_v2");
    }
  }
}

checkActiveDeadline();

// ── Form Validation Helper ──
function validateField(inputEl, errorEl) {
  let isValid = true;
  const parent = inputEl.closest(".form-group");

  if (inputEl.hasAttribute("required")) {
    if (!inputEl.value.trim()) {
      isValid = false;
    } else if (inputEl.type === "tel") {
      // Validate phone length: needs at least DDD + number (10 or 11 digits)
      const numbersOnly = inputEl.value.replace(/\D/g, "");
      if (numbersOnly.length < 10) {
        isValid = false;
      }
    } else if (inputEl.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputEl.value.trim())) {
        isValid = false;
      }
    }
  }

  if (!isValid) {
    parent.classList.add("is-invalid");
  } else {
    parent.classList.remove("is-invalid");
  }

  return isValid;
}

// Clear invalid state on type/select
[nameInput, whatsappInput, emailInput, instagramInput, businessInput, colorsInput, goalSelect].forEach(function (input) {
  if (!input) return;
  input.addEventListener("input", function () {
    input.closest(".form-group").classList.remove("is-invalid");
  });
});

// ── Custom Select Dropdown logic ──
const customSelect = document.getElementById("goal-custom-select");
const customSelectTrigger = customSelect ? customSelect.querySelector(".custom-select__trigger") : null;
const customSelectValue = customSelect ? customSelect.querySelector(".custom-select__value") : null;
const customSelectOptions = customSelect ? customSelect.querySelectorAll(".custom-select__option") : [];

if (customSelectTrigger && customSelect) {
  customSelectTrigger.addEventListener("click", function (e) {
    e.stopPropagation();
    customSelect.classList.toggle("is-open");
  });
}

customSelectOptions.forEach(function (option) {
  option.addEventListener("click", function (e) {
    e.stopPropagation();
    const val = option.getAttribute("data-value");
    
    // Set value to hidden input
    if (goalSelect) {
      goalSelect.value = val;
      goalSelect.closest(".form-group").classList.remove("is-invalid");
    }
    
    // Update trigger text
    if (customSelectValue) {
      customSelectValue.textContent = val;
      customSelectValue.classList.add("has-value");
    }
    
    // Update active class
    customSelectOptions.forEach(function (opt) {
      opt.classList.remove("is-selected");
    });
    option.classList.add("is-selected");
    
    // Close dropdown
    customSelect.classList.remove("is-open");
  });
});

// Close custom dropdown when clicking outside
document.addEventListener("click", function (e) {
  if (customSelect && !customSelect.contains(e.target)) {
    customSelect.classList.remove("is-open");
  }
});

// ── Handle Form Submit ──
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Validate all required fields
    const isNameValid = validateField(nameInput, document.getElementById("error-name"));
    const isWhatsappValid = validateField(whatsappInput, document.getElementById("error-whatsapp"));
    const isEmailValid = validateField(emailInput, document.getElementById("error-email"));
    const isBusinessValid = validateField(businessInput, document.getElementById("error-business"));
    const isColorsValid = validateField(colorsInput, document.getElementById("error-colors"));
    const isGoalValid = validateField(goalSelect, document.getElementById("error-goal"));

    if (!isNameValid || !isWhatsappValid || !isEmailValid || !isBusinessValid || !isColorsValid || !isGoalValid) {
      // Scroll to the first invalid field
      const firstInvalid = document.querySelector(".form-group.is-invalid");
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Capture values
    const name = nameInput.value.trim();
    const whatsapp = whatsappInput.value.trim();
    const email = emailInput.value.trim();
    const instagram = instagramInput ? instagramInput.value.trim() : "";
    const business = businessInput.value.trim();
    const colors = colorsInput ? colorsInput.value.trim() : "";
    const goal = goalSelect.value;
    const notes = notesInput.value.trim() || "Nenhuma observação adicional.";

    // Generate WhatsApp text
    const textMsg = 
      "Olá Leoclecio! Enviei a solicitação do meu Site Express (7h).\n\n" +
      "*Nome:* " + name + "\n" +
      "*WhatsApp:* " + whatsapp + "\n" +
      "*E-mail:* " + email + "\n" +
      (instagram ? "*Instagram:* " + instagram + "\n" : "") +
      "*Empresa/Segmento:* " + business + "\n" +
      (colors ? "*Cores de Preferência:* " + colors + "\n" : "") +
      "*Objetivo do Site:* " + goal + "\n" +
      "*Observações/Preferências:* " + notes;

    const encodedText = encodeURIComponent(textMsg);
    const waLink = "https://wa.me/" + DEVELOPER_PHONE + "?text=" + encodedText;

    // Send to Brevo API
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const endpoint = isLocal ? "https://api.brevo.com/v3/smtp/email" : "/api/submit";
    const headers = {
      "content-type": "application/json",
      "accept": "application/json"
    };
    if (isLocal) {
      headers["api-key"] = "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";
    }

    const payload = {
      name: name,
      whatsapp: whatsapp,
      email: email,
      instagram: instagram,
      business: business,
      colors: colors,
      goal: goal,
      notes: notes
    };

    let requestBody;
    if (isLocal) {
      const htmlContent = `
        <h2>Nova solicitação (Site Express 7h)</h2>
        <hr/>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>WhatsApp:</strong> ${whatsapp}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Instagram:</strong> ${instagram || 'Não informado'}</p>
        <p><strong>Empresa/Segmento:</strong> ${business}</p>
        <p><strong>Cores de Preferência:</strong> ${colors}</p>
        <p><strong>Objetivo do Site:</strong> ${goal}</p>
        <p><strong>Observações/Preferências:</strong> ${notes}</p>
      `;

      requestBody = JSON.stringify({
        sender: {
          name: "Formulário Site Express",
          email: "leoclecio@outlook.com"
        },
        to: [
          {
            email: "leoclecio@outlook.com",
            name: "Leoclecio"
          }
        ],
        replyTo: {
          email: email,
          name: name
        },
        subject: `Nova Solicitação de Site Express - ${name}`,
        htmlContent: htmlContent
      });
    } else {
      requestBody = JSON.stringify(payload);
    }

    fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: requestBody
    })
    .then(function (response) {
      if (!response.ok) {
        console.warn("Falha ao enviar e-mail pelo Brevo.");
      }
    })
    .catch(function (error) {
      console.error("Erro Brevo:", error);
    });

    // Set link to button
    if (whatsappBtn) {
      whatsappBtn.setAttribute("href", waLink);
    }

    // Set deadline & save states to LocalStorage
    const targetDeadline = Date.now() + DEMO_DURATION;
    localStorage.setItem("express_demo_deadline_v2", targetDeadline.toString());
    localStorage.setItem("express_demo_whatsapp_link_v2", waLink);

    // Transition form to Success screen
    form.classList.add("fade-out");
    setTimeout(function () {
      form.style.display = "none";
      successCard.style.display = "flex";
      startCountdown(targetDeadline);
    }, 3000);
  });
}

// ── Color Cards Grid logic ──
(function () {
  const colorCards = document.querySelectorAll(".color-card");
  const colorsHiddenInput = document.getElementById("express-colors");
  const customColorWrapper = document.getElementById("express-colors-custom-wrapper");
  const customColorInput = document.getElementById("express-colors-custom");

  if (!colorsHiddenInput) return;

  colorCards.forEach(function (card) {
    card.addEventListener("click", function () {
      const val = card.getAttribute("data-value");

      // Toggle active visual states on cards
      colorCards.forEach(function (c) {
        c.classList.remove("is-active");
      });
      card.classList.add("is-active");

      // Clear invalid state on parent form-group
      const parent = colorsHiddenInput.closest(".form-group");
      if (parent) parent.classList.remove("is-invalid");

      if (val !== "custom") {
        // Hide custom wrapper and set hidden input value
        if (customColorWrapper) customColorWrapper.style.display = "none";
        if (customColorInput) customColorInput.value = "";
        colorsHiddenInput.value = val;
      } else {
        // Show custom wrapper and update value based on current custom text input
        if (customColorWrapper) customColorWrapper.style.display = "block";
        if (customColorInput) {
          customColorInput.focus();
          colorsHiddenInput.value = customColorInput.value.trim();
        }
      }
    });
  });

  // Track keypress on custom text input to update hidden colors input
  if (customColorInput) {
    customColorInput.addEventListener("input", function () {
      colorsHiddenInput.value = customColorInput.value.trim();
      // Remove invalid state when typing in custom color input
      const parent = colorsHiddenInput.closest(".form-group");
      if (parent) parent.classList.remove("is-invalid");
    });
  }
})();

