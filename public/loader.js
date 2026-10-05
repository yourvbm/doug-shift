/* Doug Stoddard / The Freedom Shift page loader.
   GHL holds only a tiny snippet that loads this file. Everything on the page
   (copy, design, popups) is edited here and goes live on push. */
(function () {
  var CONFIG = {
    ORDER_URL: 'https://dougstoddard.com/shift-enroll',
    CALENDAR_URL: 'https://link.dougstoddard.com/widget/booking/RSsmMMSRg0R6KZWF1eaw',
    THANKYOU_URL: 'https://dougstoddard.com/shift-thank-you'
  };

  var script = document.currentScript;
  var base = new URL('.', script.src).href;
  var page = script.getAttribute('data-page') || 'freedom-shift';
  var host = document.getElementById('shift-root');
  if (!host) { host = document.createElement('div'); host.id = 'shift-root'; script.parentNode.insertBefore(host, script); }

  function track(name, params) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: name }, params || {}));
      if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    } catch (e) {}
  }

  /* Inside the order-form popup: when the order form finishes and lands here,
     tell the parent page to go to the thank-you page. */
  if (page === 'thank-you' && window.parent !== window) {
    try { window.parent.postMessage({ shiftEnrolled: true }, '*'); } catch (e) {}
  }

  if (!document.getElementById('fs-fonts')) {
    var l = document.createElement('link');
    l.id = 'fs-fonts'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,500;0,600;0,700;0,800;1,700;1,800&family=Source+Sans+3:wght@400;600&family=Source+Serif+4:ital,wght@1,400&display=swap';
    document.head.appendChild(l);
  }

  var v = '?v=' + Math.floor(Date.now() / 60000);
  function get(u) { return fetch(u + v).then(function (r) { if (!r.ok) throw new Error(u); return r.text(); }); }
  function fill(s) {
    return s.replace(/\{\{BASE\}\}/g, base)
      .replace(/\{\{ORDER_URL\}\}/g, CONFIG.ORDER_URL)
      .replace(/\{\{CALENDAR_URL\}\}/g, CONFIG.CALENDAR_URL);
  }

  Promise.all([get(base + 'pages/shift.css'), get(base + 'pages/' + page + '.html')]).then(function (r) {
    var root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    host.style.cssText = 'display:block;width:100vw;position:relative;left:50%;margin-left:-50vw;max-width:100vw';
    document.documentElement.style.overflowX = 'clip';
    root.innerHTML = '<style>' + r[0] + '</style>' + fill(r[1]);
    wire(root);
    reveal(root);
    if (page === 'thank-you' && window.parent === window) track('enroll_complete', { value: 1000, currency: 'USD' });
    track(page.replace('-', '_') + '_view');
  }).catch(function () {
    host.innerHTML = '<p style="font:16px sans-serif;padding:40px;text-align:center">This page is temporarily unavailable. Please refresh.</p>';
  });

  function reveal(root) {
    var els = root.querySelectorAll('.tile,.card,.session,.duo,.quote-card,.bonus,.ticket,.about-in,.window-h,.eyebrow,.turn-p');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting || (e.rootBounds && e.boundingClientRect.top < e.rootBounds.top)) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el, i) {
      el.classList.add('rv');
      el.style.transitionDelay = ((i % 4) * 70) + 'ms';
      io.observe(el);
    });
  }

  function wire(root) {
    var sticky = root.getElementById('sticky'), hero = root.querySelector('.hero');
    if (sticky && hero) {
      var update = function () {
        var past = hero.getBoundingClientRect().bottom < 0;
        var en = root.getElementById('enroll').getBoundingClientRect();
        sticky.classList.toggle('on', past && en.top >= innerHeight);
      };
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    }
    var lastTrigger = null;
    function open(id, trigger) {
      var m = root.getElementById('m-' + id); if (!m) return;
      var f = m.querySelector('iframe');
      if (!f.getAttribute('src')) f.setAttribute('src', f.getAttribute('data-src'));
      m.hidden = false; lastTrigger = trigger;
      document.documentElement.style.overflow = 'hidden';
      m.querySelector('[data-close]').focus();
    }
    function closeAll() {
      root.querySelectorAll('.modal').forEach(function (m) { m.hidden = true; });
      document.documentElement.style.overflow = '';
      if (lastTrigger) lastTrigger.focus();
    }
    root.addEventListener('click', function (e) {
      var o = e.target.closest('[data-open]');
      if (o) { track(o.getAttribute('data-track') || 'cta_click'); open(o.getAttribute('data-open'), o); return; }
      if (e.target.closest('[data-close]') || e.target.classList.contains('modal')) closeAll();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
    window.addEventListener('message', function (e) {
      if (e.data && e.data.shiftEnrolled) window.location.href = CONFIG.THANKYOU_URL;
    });
  }
})();
