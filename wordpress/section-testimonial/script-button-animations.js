(function () {
  "use strict";

  function init() {
    if (typeof gsap === "undefined") {
      console.warn("Wings testimonials button animations: GSAP not found.");
      return;
    }

    const nextBtn = document.querySelector(
      ".homepage-testimonial__button-right a.elementor-icon",
    );
    const prevBtn = document.querySelector(
      ".homepage-testimonial__button-left a.elementor-icon",
    );

    /* ── SVG arrow animations ── */
    let globalAnimating = false; // Shared lock across both buttons

    function createArrowAnimation(btn, direction) {
      const svg = btn?.querySelector("svg");
      if (!svg) return;

      // Create masked wrapper for overflow control
      const mask = document.createElement("div");
      mask.style.overflow = "hidden";
      mask.style.display = "inline-block";
      mask.style.width = "100%";
      mask.style.height = "100%";

      svg.parentNode.insertBefore(mask, svg);
      mask.appendChild(svg);

      btn.addEventListener("mouseenter", () => {
        if (globalAnimating) return; // Block if ANY button is animating
        globalAnimating = true;

        const exitDistance = direction === "right" ? 50 : -50;
        const enterDistance = direction === "right" ? -50 : 50;

        const tl = gsap.timeline({
          onComplete: () => {
            globalAnimating = false; // Release lock when animation completes
          },
        });

        // Exit animation - arrow slides out in its direction
        tl.to(svg, {
          x: exitDistance,
          duration: 0.4,
          ease: "power2.in",
        });
        // Instantly move to opposite side
        tl.set(svg, { x: enterDistance });
        // Enter animation - arrow slides in from opposite side
        tl.to(svg, {
          x: 0,
          duration: 0.5,
          ease: "power2.out",
        });
      });
    }

    if (nextBtn) createArrowAnimation(nextBtn, "right");
    if (prevBtn) createArrowAnimation(prevBtn, "left");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
