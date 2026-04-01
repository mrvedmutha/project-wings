/**
 * Blog Title Reveal
 * ──────────────────────────────────────────────
 * Target class : .blog-single__heading
 * Dependency   : GSAP 3.x (gsap.min.js) — no plugins needed
 *
 * Animation    : Lines slide up with opacity fade, slowed to 0.2× speed
 *                for a smooth cinematic entrance.
 * ──────────────────────────────────────────────
 */
(function () {
  "use strict";

  /* ── Manual line splitting ────────────────── */
  function splitIntoLines(target) {
    // Save original HTML so we can restore on resize
    if (!target.dataset.originalHTML) {
      target.dataset.originalHTML = target.innerHTML;
    }

    var originalNodes = Array.from(target.childNodes);
    var items = [];

    originalNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var text = node.textContent.replace(/\s+/g, " ").trim();
        if (!text) return;
        text.split(" ").forEach(function (word) {
          if (!word) return;
          var span = document.createElement("span");
          span.className = "btr-word";
          span.style.display = "inline-block";
          span.textContent = word;
          items.push(span);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        var clone = node.cloneNode(true);
        clone.style.display = "inline-block";
        clone.style.verticalAlign = "middle";
        clone.classList.add("btr-elem");
        items.push(clone);
      }
    });

    // Render words into target for measurement
    target.innerHTML = "";
    items.forEach(function (item, i) {
      target.appendChild(item);
      if (i < items.length - 1) {
        target.appendChild(document.createTextNode(" "));
      }
    });

    // Group items into visual lines by offsetTop
    var lines = [];
    var currentTop = null;
    var currentLine = [];

    items.forEach(function (item) {
      var top = Math.round(item.getBoundingClientRect().top);
      if (currentTop === null || top === currentTop) {
        currentLine.push(item);
      } else {
        lines.push(currentLine);
        currentLine = [item];
      }
      currentTop = top;
    });
    if (currentLine.length) lines.push(currentLine);

    // Rebuild DOM: wrap each visual line in mask + inner containers
    target.innerHTML = "";
    lines.forEach(function (line) {
      var mask = document.createElement("span");
      mask.className = "btr-line";
      // Apply critical mask styles inline so it works even without the CSS file
      mask.style.display = "block";
      mask.style.overflow = "hidden";
      mask.style.paddingBottom = "0.08em";

      var inner = document.createElement("span");
      inner.className = "btr-line-inner";
      inner.style.display = "block";

      line.forEach(function (item, idx) {
        item.classList.remove("btr-word", "btr-elem");
        inner.appendChild(item);
        if (idx < line.length - 1) {
          inner.appendChild(document.createTextNode(" "));
        }
      });

      mask.appendChild(inner);
      target.appendChild(mask);
    });

    return target.querySelectorAll(".btr-line-inner");
  }

  /* ── Animation ────────────────────────────── */
  function animateHeading(el) {
    var target = el.querySelector(".elementor-heading-title") || el;
    var lineInners = splitIntoLines(target);

    if (!lineInners.length) return;

    // Force the parent heading visible — use native DOM with !important
    // so it wins over any CSS rule (including Elementor's own styles)
    target.style.setProperty("opacity", "1", "important");
    target.style.setProperty("visibility", "visible", "important");

    // Build a timeline for full control
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    // Start each line hidden below its mask, then animate up
    tl.set(lineInners, { yPercent: 100, opacity: 0 });
    tl.to(lineInners, {
      yPercent: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.1,
    });

    // Slow the whole timeline to 0.2× for a cinematic reveal
    tl.timeScale(0.2);
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    var headings = document.querySelectorAll(".blog-single__heading");

    headings.forEach(function (el) {
      if (el.dataset.titleRevealDone) return;
      el.dataset.titleRevealDone = "1";
      animateHeading(el);
    });
  }

  // Wait for web-fonts so line-break measurements are accurate
  document.fonts.ready.then(function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(init);
    });
  });

  // Re-split on resize (line breaks may change)
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      document
        .querySelectorAll(".blog-single__heading[data-title-reveal-done]")
        .forEach(function (el) {
          var target = el.querySelector(".elementor-heading-title") || el;
          // Restore original HTML before re-splitting
          if (target.dataset.originalHTML) {
            target.innerHTML = target.dataset.originalHTML;
          }
          delete el.dataset.titleRevealDone;
        });
      init();
    }, 400);
  });
})();
