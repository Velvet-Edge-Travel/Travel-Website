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

/* Velvet Edge footer social icons */
(()=>{
 const footer=document.querySelector('.site-footer');if(!footer||footer.querySelector('[data-footer-socials]'))return;
 // Add each verified account URL here when ready. Empty values render unlinked icons.
 const accounts={instagram:'',facebook:'',tiktok:''};
 const icons={
 instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor"/></svg>',
 facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.8 22v-9.1h3.05l.46-3.55H13.8V7.08c0-1.03.29-1.73 1.76-1.73h1.88V2.18A25.2 25.2 0 0 0 14.7 2c-2.72 0-4.59 1.66-4.59 4.72v2.63H7.05v3.55h3.06V22z"/></svg>',
 tiktok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.5 2h-3.2v13.15a3.08 3.08 0 1 1-2.67-3.05V8.86a6.3 6.3 0 1 0 5.87 6.29V8.4A9.02 9.02 0 0 0 22 10.25V7.03A5.52 5.52 0 0 1 16.5 2z"/></svg>'};
 const style=document.createElement('style');style.textContent=`
 .footer-socials{display:flex;justify-content:center;align-items:center;gap:22px;padding:0 0 30px}
 .footer-socials__icon{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border:1px solid rgba(199,163,90,.5);border-radius:50%;color:#c7a35a;flex-shrink:0}
 .footer-socials__icon svg{width:23px;height:23px;display:block}
 a.footer-socials__icon{transition:background .2s,color .2s}
 a.footer-socials__icon:hover,a.footer-socials__icon:focus-visible{background:#c7a35a;color:#171512}
 @media(max-width:650px){.footer-socials{padding-block:0 26px;gap:20px}}
 `;document.head.append(style);
 const row=document.createElement('div');row.className='footer-socials container';row.dataset.footerSocials='';row.setAttribute('role','group');row.setAttribute('aria-label','Social media');
 row.innerHTML=Object.entries(icons).map(([name,icon])=>{const label=name==='tiktok'?'TikTok':name[0].toUpperCase()+name.slice(1);const url=accounts[name];return /^https:\/\//.test(url)?'<a class="footer-socials__icon" href="'+url+'" target="_blank" rel="noopener noreferrer" aria-label="'+label+'">'+icon+'</a>':'<span class="footer-socials__icon" role="img" aria-label="'+label+'">'+icon+'</span>';}).join('');
 footer.insertBefore(row,footer.querySelector('[data-travel-marks]')||footer.querySelector('.footer__bottom'));
})();
