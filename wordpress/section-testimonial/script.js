(function () {
  "use strict";

  function waitFor(fn, interval = 100, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const id = setInterval(() => {
        const result = fn();
        if (result) {
          clearInterval(id);
          resolve(result);
        } else if (Date.now() - start > timeout) {
          clearInterval(id);
          reject("timeout");
        }
      }, interval);
    });
  }

  waitFor(() => {
    const scope = document.querySelector(".testimo");
    if (!scope) return null;
    const el = scope.querySelector(".tss-carousel");
    return el && el.swiper && typeof gsap !== "undefined" ? el : null;
  })
    .then(initAnimation)
    .catch(() =>
      console.warn("Wings .testimo animation: Swiper or GSAP not found."),
    );

  function initAnimation(swiperEl) {
    const swiper = swiperEl.swiper;

    swiper.params.speed = 0;
    swiper.params.autoplay = false;
    swiper.params.loop = false;
    if (swiper.autoplay?.stop) swiper.autoplay.stop();

    const wrapper = swiperEl.querySelector(".swiper-wrapper");
    if (!wrapper) return;

    Object.assign(wrapper.style, {
      transform: "none",
      transition: "none",
      overflow: "visible",
      display: "block",
    });

    const allSlides = Array.from(wrapper.querySelectorAll(".slide-item"));
    const total = allSlides.length;
    if (!total) return;

    const COLS = 2;
    const CARD_DELAY = 0.18; /* stagger gap between card 1 and card 2 */
    const pages = [];

    for (let i = 0; i < total; i += COLS) {
      const page = document.createElement("div");
      page.className = "tss-gsap-page";
      Object.assign(page.style, {
        display: "flex",
        gap: "0",
        width: "100%",
        position: "absolute",
        inset: "0",
        opacity: "0",
        pointerEvents: "none",
        boxSizing: "border-box",
      });

      const chunk = allSlides.slice(i, i + COLS);
      chunk.forEach((slide) => {
        slide.style.width = `${100 / COLS}%`;
        slide.style.flexShrink = "0";
        page.appendChild(slide);
      });

      wrapper.appendChild(page);
      pages.push(page);
    }

    const pageCount = pages.length;
    let current = 0;
    let activeTl = null; /* track active timeline so we can kill it instantly */

    /* ── Measure tallest page for container height ── */
    let maxH = 0;
    pages.forEach((p) => {
      p.style.position = "relative";
      p.style.opacity = "1";
      maxH = Math.max(maxH, p.offsetHeight);
      p.style.position = "absolute";
      p.style.opacity = "0";
    });
    if (maxH) {
      wrapper.style.minHeight = maxH + "px";
      swiperEl.style.minHeight = maxH + "px";
    }

    /* ── Helpers ── */
    function getCards(page) {
      return Array.from(page.querySelectorAll(".slide-item"));
    }

    function hardShow(page) {
      getCards(page).forEach((card) => {
        const img = card.querySelector(".profile-img-wrapper");
        const txts = card.querySelectorAll(
          ".author-name, .author-bio, .item-content",
        );
        if (img) gsap.set(img, { clipPath: "inset(0% 0% 0% 0%)" });
        gsap.set(txts, { opacity: 1 });
      });
      Object.assign(page.style, {
        position: "relative",
        inset: "",
        opacity: "1",
        pointerEvents: "auto",
      });
    }

    function hardHide(page, clip) {
      getCards(page).forEach((card) => {
        const img = card.querySelector(".profile-img-wrapper");
        const txts = card.querySelectorAll(
          ".author-name, .author-bio, .item-content",
        );
        if (img) gsap.set(img, { clipPath: clip });
        gsap.set(txts, { opacity: 0 });
      });
      Object.assign(page.style, {
        position: "absolute",
        opacity: "0",
        pointerEvents: "none",
      });
    }

    /* ── Initial states ── */
    pages.forEach((page, i) => {
      if (i === 0) hardShow(page);
      else hardHide(page, "inset(100% 0% 0% 0%)");
    });

    /* ── Core animation ── */
    function animateTo(nextIndex, direction = 1) {
      nextIndex = ((nextIndex % pageCount) + pageCount) % pageCount;
      if (nextIndex === current) return;

      /*
       * Kill running timeline immediately on new click — zero lag.
       * Snap the current page to its final hidden state so no ghost
       * frames bleed into the next transition.
       */
      if (activeTl) {
        activeTl.kill();
        activeTl = null;
        hardHide(
          pages[current],
          direction === 1 ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)",
        );
      }

      const curPage = pages[current];
      const nxtPage = pages[nextIndex];

      /*
       * DIRECTION
       * next  (+1) → exit wipes UP   (bottom inset grows to 100%)
       *            → enter reveals BOTTOM-TO-TOP (top inset 100%→0%)
       * prev  (-1) → exit wipes DOWN  (top inset grows to 100%)
       *            → enter reveals TOP-TO-BOTTOM (bottom inset 100%→0%)
       */
      const isPrev = direction === -1;
      const exitClip = isPrev ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)";
      const enterClipStart = isPrev
        ? "inset(0% 0% 100% 0%)"
        : "inset(100% 0% 0% 0%)";

      /* Prepare incoming page */
      Object.assign(nxtPage.style, {
        position: "absolute",
        inset: "0",
        opacity: "1",
        pointerEvents: "none",
      });
      getCards(nxtPage).forEach((card) => {
        const img = card.querySelector(".profile-img-wrapper");
        const txts = card.querySelectorAll(
          ".author-name, .author-bio, .item-content",
        );
        if (img) gsap.set(img, { clipPath: enterClipStart });
        gsap.set(txts, { opacity: 0 });
      });

      const tl = gsap.timeline({
        onComplete() {
          hardHide(curPage, exitClip);
          hardShow(nxtPage);
          current = nextIndex;
          activeTl = null;
          resetAutoPlay();
        },
      });

      activeTl = tl;

      /* EXIT — cards wipe out one after another */
      getCards(curPage).forEach((card, idx) => {
        const img = card.querySelector(".profile-img-wrapper");
        const txts = card.querySelectorAll(
          ".author-name, .author-bio, .item-content",
        );
        const at = idx * CARD_DELAY;

        if (img)
          tl.to(
            img,
            { clipPath: exitClip, duration: 0.55, ease: "power2.inOut" },
            at,
          );
        tl.to(
          txts,
          { opacity: 0, duration: 0.3, ease: "power1.in", stagger: 0.04 },
          at,
        );
      });

      /*
       * ENTER — starts at 0.3s so it heavily overlaps the exit.
       * This eliminates the empty white gap between outgoing and
       * incoming content — both pages are always visible together
       * during the crossover.
       */
      const enterStart = 0.3;
      getCards(nxtPage).forEach((card, idx) => {
        const img = card.querySelector(".profile-img-wrapper");
        const txts = card.querySelectorAll(
          ".author-name, .author-bio, .item-content",
        );
        const at = enterStart + idx * CARD_DELAY;

        if (img)
          tl.to(
            img,
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.65,
              ease: "expo.out",
            },
            at,
          );
        tl.to(
          txts,
          { opacity: 1, duration: 0.45, ease: "power2.out", stagger: 0.05 },
          at + 0.15,
        );
      });
    }

    /* ── Autoplay ── */
    let autoTimer = null;
    function resetAutoPlay() {
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => animateTo(current + 1, 1), 6000);
    }
    resetAutoPlay();

    /* ── Hijack nav buttons ── */
    function hijackBtn(btn, dir) {
      if (!btn) return;
      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
      clone.removeAttribute("disabled");
      clone.classList.remove("swiper-button-disabled");
      clone.addEventListener("click", () => {
        clearTimeout(autoTimer);
        animateTo(current + dir, dir);
        resetAutoPlay();
      });
      new MutationObserver(() => {
        clone.classList.remove("swiper-button-disabled");
        clone.removeAttribute("disabled");
      }).observe(clone, {
        attributes: true,
        attributeFilter: ["class", "disabled"],
      });
    }

    hijackBtn(swiperEl.querySelector(".swiper-button-next"), 1);
    hijackBtn(swiperEl.querySelector(".swiper-button-prev"), -1);

    console.log(
      `✅ Wings .testimo – ${pageCount} pages × ${COLS} cols, per-card stagger.`,
    );
  }
})();
