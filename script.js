/* =========================================================
   Syntap — website scripts (shared by index.html and review.html)
   Every wiring function checks for its elements first, so it's
   safe to load this same file on both pages.
   Syntap Review purchase settings live in PRODUCT_CONFIG below.
   ========================================================= */

const PRODUCT_CONFIG = {
  productName: "Syntap Review Stand",

  // EDIT: your WhatsApp number in international format, digits only, no + or spaces
  // e.g. 2348012345678
  whatsappNumber: '2348146223256',

  currency: "₦",

  // EDIT: shown in the FAQ and footer
  deliveryText: "[INSERT DELIVERY INFORMATION]",

  // EDIT: set real prices (numbers, no commas). price = total price for that package.
  packages: [
    { id: "single", name: "1 Stand", quantity: 1, price: 30000, unitNote: "Try it at one location" },
    { id: "double", name: "2 Stands", quantity: 2, price: 50000, unitNote: "Most popular for small outlets", badge: "Most Popular" },
    { id: "business", name: "5 Stands", quantity: 5, price: 120000, unitNote: "Best value per stand" }
  ]
};

/* Illustrative destinations for the homepage "one tap" visuals only —
   not a live feed of any device. */
const IDEA_DESTINATIONS = ["Google Review", "Payment", "Menu", "Contact", "More"];
const CONCEPT_STAGES = [
  { when: "Today", value: "Review" },
  { when: "Tomorrow", value: "Menu" },
  { when: "Next", value: "Payment" },
  { when: "Later", value: "Contact" }
];

/* =========================================================
   Analytics stub — wire up Meta Pixel / GA4 / a real backend here.
   This does not currently record anything; it is a hook point.
   ========================================================= */
function trackEvent(eventName, data = {}) {
  console.debug("[track]", eventName, data);
}

/* =========================================================
   Init
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  renderFooterAndFaqSettings();
  const state = { selectedPackageId: null };

  renderPackages(state);
  renderQuantityOptions();
  syncQuantityFromPackage(state);
  updateSummary(state);

  wireWhatsappLinks();
  wireScrollButtons();
  wireStickyCta();
  wireAccordion();
  wireScrollReveal();
  wireOrderForm(state);
  wireMobileNav();
  wireIdeaCycler();
  wireConceptCycler();
});

function renderFooterAndFaqSettings() {
  const deliveryEls = [document.getElementById("deliveryFaqText"), document.getElementById("footerDelivery")];
  deliveryEls.forEach(el => { if (el) el.textContent = PRODUCT_CONFIG.deliveryText; });

  const waEl = document.getElementById("footerWhatsapp");
  if (waEl) waEl.textContent = formatWhatsappDisplay(PRODUCT_CONFIG.whatsappNumber);
}

/* =========================================================
   Mobile nav
   ========================================================= */
function wireMobileNav() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("mobileNav");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
    menu.hidden = isOpen;
  });

  menu.querySelectorAll("a, button").forEach(el => {
    el.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      menu.hidden = true;
    });
  });
}

/* =========================================================
   "One tap can open almost anything" — single cycling readout
   ========================================================= */
function wireIdeaCycler() {
  const readout = document.getElementById("ideaReadout");
  const valueEl = document.getElementById("ideaValue");
  const dot = document.getElementById("ideaTapDot");
  if (!readout || !valueEl) return;

  let i = 0;
  setInterval(() => {
    if (dot) {
      dot.classList.remove("is-pulsing");
      void dot.offsetWidth; // restart the pulse animation
      dot.classList.add("is-pulsing");
    }
    readout.classList.add("is-changing");
    setTimeout(() => {
      i = (i + 1) % IDEA_DESTINATIONS.length;
      valueEl.textContent = IDEA_DESTINATIONS[i];
      readout.classList.remove("is-changing");
    }, 300);
  }, 2800);
}

/* =========================================================
   "The physical object stays" — cycling when/value pair
   ========================================================= */
function wireConceptCycler() {
  const readout = document.getElementById("conceptReadout");
  const whenEl = document.getElementById("conceptWhen");
  const valueEl = document.getElementById("conceptValue");
  if (!readout || !whenEl || !valueEl) return;

  let i = 0;
  setInterval(() => {
    readout.classList.add("is-changing");
    setTimeout(() => {
      i = (i + 1) % CONCEPT_STAGES.length;
      whenEl.textContent = CONCEPT_STAGES[i].when;
      valueEl.textContent = CONCEPT_STAGES[i].value;
      readout.classList.remove("is-changing");
    }, 350);
  }, 2600);
}

/* =========================================================
   Packages — render, select, price
   ========================================================= */
function formatPrice(amount) {
  return PRODUCT_CONFIG.currency + Number(amount).toLocaleString("en-NG");
}

function renderPackages(state) {
  const container = document.getElementById("packages");
  if (!container) return;

  const unitPrices = PRODUCT_CONFIG.packages.map(p => p.price / p.quantity);
  const baseUnit = Math.max(...unitPrices.filter(n => !isNaN(n) && isFinite(n)));

  container.innerHTML = "";
  PRODUCT_CONFIG.packages.forEach(pkg => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "package";
    card.setAttribute("data-package-id", pkg.id);
    card.setAttribute("aria-pressed", "false");

    const unitPrice = pkg.price / pkg.quantity;
    const savingsPct = baseUnit > 0 ? Math.round((1 - unitPrice / baseUnit) * 100) : 0;

    card.innerHTML = `
      ${pkg.badge ? `<span class="package-badge">${pkg.badge}</span>` : ""}
      <span class="package-name">${pkg.name}</span>
      <span class="package-price">${formatPrice(pkg.price)}</span>
      <span class="package-unit">${pkg.unitNote || ""}${savingsPct > 0 ? ` · Save ${savingsPct}%` : ""}</span>
    `;

    card.addEventListener("click", () => {
      state.selectedPackageId = pkg.id;
      container.querySelectorAll(".package").forEach(el => {
        el.classList.remove("is-selected");
        el.setAttribute("aria-pressed", "false");
      });
      card.classList.add("is-selected");
      card.setAttribute("aria-pressed", "true");
      syncQuantityFromPackage(state);
      updateSummary(state);
      trackEvent("package_selected", { package: pkg.id });
    });

    container.appendChild(card);
  });

  const recommended = PRODUCT_CONFIG.packages.find(p => p.badge) || PRODUCT_CONFIG.packages[0];
  state.selectedPackageId = recommended.id;
  const defaultCard = container.querySelector(`[data-package-id="${recommended.id}"]`);
  if (defaultCard) {
    defaultCard.classList.add("is-selected");
    defaultCard.setAttribute("aria-pressed", "true");
  }
}

function getSelectedPackage(state) {
  return PRODUCT_CONFIG.packages.find(p => p.id === state.selectedPackageId) || PRODUCT_CONFIG.packages[0];
}

function renderQuantityOptions() {
  const select = document.getElementById("quantity");
  if (!select) return;
  select.innerHTML = "";
  PRODUCT_CONFIG.packages.forEach(pkg => {
    const opt = document.createElement("option");
    opt.value = pkg.id;
    opt.textContent = `${pkg.name} — ${formatPrice(pkg.price)}`;
    select.appendChild(opt);
  });
}

function syncQuantityFromPackage(state) {
  const select = document.getElementById("quantity");
  if (select) select.value = state.selectedPackageId;
}

function updateSummary(state) {
  const pkg = getSelectedPackage(state);
  const productEl = document.getElementById("summaryProduct");
  const qtyEl = document.getElementById("summaryQty");
  const totalEl = document.getElementById("summaryTotal");
  const savingsEl = document.getElementById("summarySavings");

  if (productEl) productEl.textContent = PRODUCT_CONFIG.productName;
  if (qtyEl) qtyEl.textContent = `${pkg.quantity} stand${pkg.quantity > 1 ? "s" : ""} (${pkg.name})`;
  if (totalEl) totalEl.textContent = formatPrice(pkg.price);

  if (savingsEl) {
    const unitPrices = PRODUCT_CONFIG.packages.map(p => p.price / p.quantity);
    const baseUnit = Math.max(...unitPrices.filter(n => !isNaN(n) && isFinite(n)));
    const unitPrice = pkg.price / pkg.quantity;
    const savingsPct = baseUnit > 0 ? Math.round((1 - unitPrice / baseUnit) * 100) : 0;
    savingsEl.textContent = savingsPct > 0 ? `You save ${savingsPct}% per stand with this package.` : "";
  }
}

/* =========================================================
   Order form — validation + WhatsApp handoff
   ========================================================= */
function wireOrderForm(state) {
  const form = document.getElementById("orderForm");
  if (!form) return;

  const quantitySelect = document.getElementById("quantity");
  quantitySelect.addEventListener("change", () => {
    state.selectedPackageId = quantitySelect.value;
    document.querySelectorAll(".package").forEach(el => {
      const isMatch = el.getAttribute("data-package-id") === state.selectedPackageId;
      el.classList.toggle("is-selected", isMatch);
      el.setAttribute("aria-pressed", String(isMatch));
    });
    updateSummary(state);
  });

  let formStarted = false;
  form.addEventListener("input", () => {
    if (!formStarted) {
      formStarted = true;
      trackEvent("order_form_start");
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const values = {
      fullName: form.fullName.value.trim(),
      businessName: form.businessName.value.trim(),
      phone: form.phone.value.trim(),
      businessType: form.businessType.value,
      quantity: form.quantity.value,
      reviewLink: form.reviewLink.value.trim(),
      notes: form.notes.value.trim()
    };

    const errors = validateOrder(values);
    renderErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorField = form.querySelector(".field.has-error input, .field.has-error select");
      if (firstErrorField) firstErrorField.focus();
      return;
    }

    state.selectedPackageId = values.quantity;
    const pkg = getSelectedPackage(state);

    const confirmState = document.getElementById("confirmState");
    if (confirmState) confirmState.hidden = false;

    trackEvent("order_form_submit", { package: pkg.id });

    const message = buildWhatsappMessage(values, pkg);
    const url = `https://wa.me/${PRODUCT_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;

    trackEvent("whatsapp_click", { source: "order_form" });
    window.open(url, "_blank", "noopener");
  });
}

function validateOrder(values) {
  const errors = {};

  if (!values.fullName) errors.fullName = "Please enter your full name.";
  if (!values.businessName) errors.businessName = "Please enter your business name.";

  const phoneDigits = values.phone.replace(/[\s-]/g, "");
  const ngPhonePattern = /^(0\d{10}|\+?234\d{10})$/;
  if (!values.phone) {
    errors.phone = "Please enter your phone number.";
  } else if (!ngPhonePattern.test(phoneDigits)) {
    errors.phone = "Enter a valid Nigerian number, e.g. 08012345678.";
  }

  if (!values.businessType) errors.businessType = "Please select your business type.";
  if (!values.quantity) errors.quantity = "Please choose how many stands you need.";

  if (!values.reviewLink) {
    errors.reviewLink = "Please add your Google review link.";
  } else {
    try {
      const parsed = new URL(values.reviewLink);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error("bad protocol");
    } catch {
      errors.reviewLink = "Enter a valid link starting with https://";
    }
  }

  return errors;
}

function renderErrors(errors) {
  document.querySelectorAll(".field").forEach(field => field.classList.remove("has-error"));
  document.querySelectorAll(".field-error").forEach(el => { el.textContent = ""; });

  Object.entries(errors).forEach(([name, message]) => {
    const errorEl = document.querySelector(`[data-error-for="${name}"]`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.closest(".field").classList.add("has-error");
    }
  });
}

function buildWhatsappMessage(values, pkg) {
  const lines = [
    `Hello, I want to order the ${PRODUCT_CONFIG.productName} (Syntap Review).`,
    "",
    `Name: ${values.fullName}`,
    `Business: ${values.businessName}`,
    `Business Type: ${values.businessType}`,
    `Phone: ${values.phone}`,
    `Package: ${pkg.name} (${formatPrice(pkg.price)})`,
    `Google Review Link: ${values.reviewLink}`
  ];
  if (values.notes) lines.push(`Notes: ${values.notes}`);
  lines.push("", "Please help me complete my order.");
  return lines.join("\n");
}

/* =========================================================
   WhatsApp links (header, hero, sticky, final CTA)
   ========================================================= */
function wireWhatsappLinks() {
  const isConfigured = PRODUCT_CONFIG.whatsappNumber && !PRODUCT_CONFIG.whatsappNumber.includes("X");
  const defaultMessage = `Hello, I'd like to know more about Syntap.`;
  const url = isConfigured
    ? `https://wa.me/${PRODUCT_CONFIG.whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`
    : "#";

  document.querySelectorAll("[data-whatsapp]").forEach(el => {
    el.setAttribute("href", url);
    if (isConfigured) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    } else {
      // Never send a customer to a broken wa.me/234XXXXXXXXXX link —
      // set PRODUCT_CONFIG.whatsappNumber in this file to go live.
      el.removeAttribute("target");
      el.addEventListener("click", (e) => {
        e.preventDefault();
        console.warn("Syntap: whatsappNumber is not configured yet — set PRODUCT_CONFIG.whatsappNumber in script.js.");
      });
    }
  });
}

function formatWhatsappDisplay(number) {
  if (!number || number.includes("X")) return "[INSERT WHATSAPP NUMBER]";
  return "+" + number;
}

/* =========================================================
   Smooth scroll buttons
   ========================================================= */
function wireScrollButtons() {
  document.querySelectorAll("[data-scroll]").forEach(el => {
    el.addEventListener("click", (e) => {
      const target = document.querySelector(el.getAttribute("data-scroll"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

/* =========================================================
   Sticky mobile CTA — product page only, appears after hero
   ========================================================= */
function wireStickyCta() {
  const sticky = document.getElementById("stickyCta");
  const hero = document.querySelector(".hero");
  if (!sticky || !hero) return;

  document.body.classList.add("has-sticky-cta");

  const observer = new IntersectionObserver(
    ([entry]) => { sticky.classList.toggle("is-visible", !entry.isIntersecting); },
    { threshold: 0 }
  );
  observer.observe(hero);
}

/* =========================================================
   FAQ accordion
   ========================================================= */
function wireAccordion() {
  document.querySelectorAll(".accordion-trigger").forEach(trigger => {
    const panel = trigger.nextElementSibling;
    trigger.addEventListener("click", () => {
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!isOpen));
      panel.style.maxHeight = isOpen ? "0px" : panel.scrollHeight + "px";
    });
  });
}

/* =========================================================
   Scroll reveal — used sparingly, only where content is a
   genuine set of comparable items (pricing, steps)
   ========================================================= */
function wireScrollReveal() {
  const targets = document.querySelectorAll(".package, .step");
  targets.forEach(el => el.setAttribute("data-reveal", ""));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach(el => observer.observe(el));
}
