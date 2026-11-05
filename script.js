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

document.querySelectorAll("[data-year]").forEach((item) => {
  item.textContent = new Date().getFullYear();
});

document.querySelector("[data-print-quote]")?.addEventListener("click", () => {
  document.querySelectorAll(".quote-accordion").forEach((section) => {
    section.open = true;
  });
  window.print();
});

/* Velvet Edge footer travel marks */
(()=>{
  const footer=document.querySelector('.site-footer');
  if(!footer || footer.querySelector('[data-travel-marks]')) return;
  const style=document.createElement('style');
  style.textContent=`
  .travel-marks{padding:34px 0;border-top:1px solid rgba(199,163,90,.28)}
  .travel-marks__row{display:flex;justify-content:center;align-items:center;gap:clamp(28px,5vw,72px);flex-wrap:wrap}
  .travel-marks__item{display:flex;align-items:center;justify-content:center;flex:0 1 190px;height:90px}
  .travel-marks__item img{display:block;object-fit:contain;width:100%;height:78px;max-width:190px;filter:brightness(0) invert(.94) sepia(.12)}
  .travel-marks__item--iata{flex-basis:210px}.travel-marks__item--iata img{max-width:210px}
  .travel-marks__item--abta img{filter:grayscale(1) invert(1);mix-blend-mode:screen}
  .travel-marks__item--atol{flex-basis:88px}.travel-marks__item--atol img{max-width:82px;height:82px;filter:grayscale(1)}
  @media(max-width:650px){.travel-marks{padding:28px 0}.travel-marks__row{display:grid;grid-template-columns:1fr 1fr;gap:24px 28px}.travel-marks__item{height:74px;min-width:0}.travel-marks__item img{height:66px;max-width:160px}.travel-marks__item--atol img{height:74px;max-width:74px}}
  `;
  document.head.append(style);
  const block=document.createElement('div');block.className='travel-marks container';block.dataset.travelMarks='';block.setAttribute('aria-label','Travel industry logos');
  block.innerHTML=`<div class="travel-marks__row"><div class="travel-marks__item travel-marks__item--abta"><img src="footer-abta.jpg" alt="ABTA" width="209" height="80" loading="lazy"></div><div class="travel-marks__item travel-marks__item--iata"><img src="footer-iata.png" alt="IATA Accredited Agent" width="3000" height="863" loading="lazy"></div><div class="travel-marks__item travel-marks__item--atol"><img src="footer-atol.png" alt="ATOL Protected" width="110" height="110" loading="lazy"></div><div class="travel-marks__item"><img src="footer-arc.png" alt="ARC Verified Travel Consultant" width="800" height="320" loading="lazy"></div></div>`;
  const bottom=footer.querySelector('.footer__bottom');footer.insertBefore(block,bottom);
})();
