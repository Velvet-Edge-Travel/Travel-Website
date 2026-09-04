const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");

const updateHeader = () =>
  header?.classList.toggle("scrolled", window.scrollY > 30);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

toggle?.addEventListener("click", () => {
  const open = document.body.classList.toggle("menu-open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
});

document.querySelectorAll(".nav__links a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    toggle?.setAttribute("aria-expanded", "false");
  });
});

if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("reveal-ready");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  document
    .querySelectorAll("[data-reveal]")
    .forEach((item) => observer.observe(item));
}

document.querySelectorAll("[data-enquiry-form]").forEach((form) => {
  const travelType = form.querySelector("[data-travel-type]");
  const golfFields = form.querySelector("[data-golf-fields]");

  const updateGolfFields = () => {
    if (!travelType || !golfFields) return;

    const isGolfJourney = travelType.value === "golf";
    golfFields.hidden = !isGolfJourney;
    golfFields.querySelectorAll("input, select, textarea").forEach((field) => {
      field.disabled = !isGolfJourney;
      field.required =
        isGolfJourney && field.hasAttribute("data-golf-required");
    });
  };

  travelType?.addEventListener("change", updateGolfFields);
  updateGolfFields();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector(".form-status");
    status?.classList.add("visible");
    form.reset();
    updateGolfFields();
  });
});

document.querySelectorAll("[data-year]").forEach((item) => {
  item.textContent = new Date().getFullYear();
});

document.querySelector("[data-print-quote]")?.addEventListener("click", () => {
  document.querySelectorAll(".quote-accordion").forEach((section) => {
    section.open = true;
  });
  window.print();
});
