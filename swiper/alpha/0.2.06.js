// Swiper → Webflow utility – Alpha v0.2.04.js (with a11y defaults & role fix)
window.FrSwiper = (() => {
  const PREFIX = 'fr-swiper-instance';
  const DATA_PREFIX = 'fr-swiper-set-';
  const instances = []; // live Swiper objects
  const registry = new WeakMap(); // element ► Swiper map
  let sliderCount = 0;

  /* helpers ------------------------------------------------------------- */
  const parseDataAttributes = el => {
    const opts = {};
    Array.from(el.attributes).forEach(attr => {
      if (!attr.name.startsWith(DATA_PREFIX)) return;
      const path = attr.name.replace(DATA_PREFIX, '').split('-');
      let step = opts;
      path.forEach((key, i) => {
        if (i === path.length - 1) {
          step[key] = attr.value === 'true' ?
            true :
            attr.value === 'false' ?
            false :
            isNaN(attr.value) ? attr.value : Number(attr.value);
        } else {
          step[key] = step[key] || {};
          step = step[key];
        }
      });
    });
    return opts;
  };

  /* mount one slider ---------------------------------------------------- */
  const mount = el => {
    if (registry.has(el)) return; // already initialised

    const idx = sliderCount++;
    el.classList.add(`${PREFIX}-${idx}`);

    const baseCls = el.classList[0];
    const wrapper = el.querySelector(`.${baseCls}_list-wrapper`);
    if (!wrapper) return;

    wrapper.classList.add(`fr-swiper-list-wrapper-${idx}`);

    const next = el.querySelector('[fr-swiper-next]');
    const prev = el.querySelector('[fr-swiper-prev]');
    const pag = el.querySelector('[fr-swiper-pagination]');

    // Find the swiper-wrapper element (the one Webflow adds role="list" to)
    const swiperWrapperEl = el.querySelector(`.${baseCls}_list`);
    // If it exists, remove the 'role' attribute before Swiper adds its own.
    if (swiperWrapperEl) {
      swiperWrapperEl.removeAttribute('role');
    }

    const defaults = {
      wrapperClass: `${baseCls}_list`,
      slideClass: `${baseCls}_slide`,
      slidesPerView: 'auto',
      followFinger: true,
      spaceBetween: 0,
      mousewheel: {
        forceToAxis: true
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true
      },
      a11y: {
        enabled: true,
        containerRole: 'list', // Sets role="list" on the swiper-wrapper
        slideRole: 'listitem', // Sets role="listitem" on each swiper-slide
      },
      navigation: {
        nextEl: next,
        prevEl: prev,
        disabledClass: 'is--disabled'
      },
      pagination: {
        el: pag,
        bulletActiveClass: 'is--active',
        bulletClass: 'slider_bullet',
        bulletElement: 'button',
        clickable: true
      }
    };

    const options = { ...defaults,
      ...parseDataAttributes(el)
    };
    const swiper = new Swiper(`.fr-swiper-list-wrapper-${idx}`, options);

    window[`swiperInstance${idx}`] = swiper; // legacy handle
    instances.push(swiper);
    registry.set(el, swiper);
  };

  /* scan for any yet-uninitialised elements ----------------------------- */
  const scan = () => {
    document.querySelectorAll('[fr-swiper-instance]').forEach(mount);
  };

  /* full reset (if ever needed) ----------------------------------------- */
  const destroy = () => {
    instances.forEach(swiper => swiper.destroy(true, true));
    instances.length = 0;
    sliderCount = 0;
    // Note: registry.clear() is not a standard WeakMap method. Assuming it should be handled differently if needed.
    // For a full reset, re-initializing the WeakMap is safer.
    // registry = new WeakMap();
    document.querySelectorAll('[fr-swiper-instance]')
      .forEach(el => {
        el.classList.forEach(cls => {
          if (cls.startsWith(PREFIX)) el.classList.remove(cls);
        });
        el.removeAttribute('data-fs-init');
      });
    document.querySelectorAll('[class*="fr-swiper-list-wrapper-"]')
      .forEach(el => {
        el.classList.forEach(cls => {
          if (cls.startsWith('fr-swiper-list-wrapper-')) el.classList.remove(cls);
        });
      });
  };

  /* public surface ------------------------------------------------------ */
  return {
    init: scan, // initial run or incremental build
    scan, // alias – call after injecting new HTML
    destroy, // blow everything away if required
    get active() {
      return [...instances];
    }
  };
})();

/* auto-initialise once the DOM is ready */
document.addEventListener('DOMContentLoaded', () => FrSwiper.init());
