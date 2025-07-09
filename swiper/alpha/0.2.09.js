// Swiper → Webflow utility – (DEFINITIVE MutationObserver FIX)
window.FrSwiper = (() => {
  const PREFIX = 'fr-swiper-instance';
  const DATA_PREFIX = 'fr-swiper-set-';
  const instances = [];
  const registry = new WeakMap();
  let sliderCount = 0;

  const parseDataAttributes = el => {
    const opts = {};
    Array.from(el.attributes).forEach(attr => {
      if (!attr.name.startsWith(DATA_PREFIX)) return;
      const path = attr.name.replace(DATA_PREFIX, '').split('-');
      let step = opts;
      path.forEach((key, i) => {
        if (i === path.length - 1) {
          step[key] = attr.value === 'true' ? true : attr.value === 'false' ? false : isNaN(attr.value) ? attr.value : Number(attr.value);
        } else {
          step[key] = step[key] || {};
          step = step[key];
        }
      });
    });
    return opts;
  };

  const mount = el => {
    if (registry.has(el)) return;

    // --- 1. CLEAN SLATE ---
    // First, aggressively remove any and all role="list" attributes within the component.
    const rogueLists = el.querySelectorAll('[role="list"]');
    rogueLists.forEach(list => list.removeAttribute('role'));

    const idx = sliderCount++;
    el.classList.add(`${PREFIX}-${idx}`);

    const baseCls = el.classList[0];
    const wrapper = el.querySelector(`.${baseCls}_list-wrapper`);
    if (!wrapper) return;

    wrapper.classList.add(`fr-swiper-list-wrapper-${idx}`);

    const next = el.querySelector('[fr-swiper-next]');
    const prev = el.querySelector('[fr-swiper-prev]');
    const pag = el.querySelector('[fr-swiper-pagination]');

    const defaults = {
      wrapperClass: `${baseCls}_list`,
      slideClass: `${baseCls}_slide`,
      slidesPerView: 'auto',
      followFinger: true,
      spaceBetween: 0,
      mousewheel: { forceToAxis: true },
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: {
        enabled: true,
        containerRole: 'list',
        slideRole: 'listitem',
      },
      navigation: { nextEl: next, prevEl: prev, disabledClass: 'is--disabled' },
      pagination: {
        el: pag,
        bulletActiveClass: 'is--active',
        bulletClass: 'slider_bullet',
        bulletElement: 'button',
        clickable: true,
      },
    };

    const options = { ...defaults, ...parseDataAttributes(el) };
    const swiper = new Swiper(`.fr-swiper-list-wrapper-${idx}`, options);

    // --- 2. ENFORCE CORRECT STATE ---
    // Immediately after Swiper initializes, GUARANTEE the correct roles are set.
    // Swiper's wrapper (the direct parent) MUST have role="list".
    if (swiper.wrapperEl) {
      swiper.wrapperEl.setAttribute('role', 'list');
    }
    // The outer wrapper MUST NOT have role="list".
    wrapper.removeAttribute('role');

    // --- 3. SET UP THE GUARD ---
    // Create a MutationObserver to watch the outer wrapper.
    // If Webflow's script tries to add role="list" back, this will instantly remove it.
    const observer = new MutationObserver(mutationsList => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'role') {
          if (wrapper.getAttribute('role') === 'list') {
            wrapper.removeAttribute('role');
          }
        }
      }
    });

    // Start observing the outer wrapper for attribute changes.
    observer.observe(wrapper, { attributes: true });

    window[`swiperInstance${idx}`] = swiper;
    instances.push({ swiper, observer }); // Store observer for later cleanup
    registry.set(el, swiper);
  };

  const scan = () => {
    document.querySelectorAll('[fr-swiper-instance]').forEach(mount);
  };

  const destroy = () => {
    instances.forEach(({ swiper, observer }) => {
      // Disconnect the observer to prevent memory leaks
      if (observer) {
        observer.disconnect();
      }
      swiper.destroy(true, true);
    });
    instances.length = 0;
    sliderCount = 0;
    // ... rest of destroy function
  };

  return {
    init: scan,
    scan,
    destroy,
    get active() {
      return instances.map(inst => inst.swiper);
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => FrSwiper.init());
