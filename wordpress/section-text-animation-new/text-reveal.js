(function () {
  gsap.registerPlugin(ScrollTrigger);

  function prepareElement(el) {
    // Force all child elements (video, img, etc.) to inline-block
    // BEFORE we do anything, so browser treats them as inline during measure
    el.querySelectorAll("video, img, iframe, svg").forEach((media) => {
      media.dataset.originalDisplay = media.style.display;
      media.style.display = "inline-block";
      media.style.verticalAlign = "middle";
    });
  }

  function restoreElement(el) {
    el.querySelectorAll("[data-original-display]").forEach((media) => {
      media.style.display = media.dataset.originalDisplay || "";
      delete media.dataset.originalDisplay;
    });
  }

  function detectLines(el) {
    // Save all child nodes before modifying DOM
    const savedNodes = Array.from(el.childNodes).map((n) => n.cloneNode(true));

    // Build flat list of word spans + non-text elements
    const fragments = [];

    savedNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\s+/g, " ");
        const words = text.split(" ");
        words.forEach((word) => {
          if (!word.trim()) return;
          const span = document.createElement("span");
          span.className = "__w";
          span.style.cssText = "display:inline-block;";
          span.textContent = word;
          fragments.push(span);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(true);
        clone.style.display = "inline-block";
        clone.style.verticalAlign = "middle";
        clone.classList.add("__e");
        fragments.push(clone);
      }
    });

    // Render fragments into el for measurement
    el.innerHTML = "";
    fragments.forEach((frag, i) => {
      el.appendChild(frag);
      if (i < fragments.length - 1) {
        el.appendChild(document.createTextNode(" "));
      }
    });

    // Read offsetTop to group into lines
    const lineGroups = [];
    let lastTop = null;
    let currentGroup = [];

    fragments.forEach((frag) => {
      const top = Math.round(frag.getBoundingClientRect().top);
      if (lastTop === null || top === lastTop) {
        currentGroup.push(frag);
      } else {
        lineGroups.push(currentGroup);
        currentGroup = [frag];
      }
      lastTop = top;
    });
    if (currentGroup.length) lineGroups.push(currentGroup);

    // Rebuild DOM with .line > .line-inner wrappers
    el.innerHTML = "";

    lineGroups.forEach((group, lineIndex) => {
      const line = document.createElement("span");
      line.className = "tr-line";

      const inner = document.createElement("span");
      inner.className = "tr-line-inner";

      group.forEach((frag, i) => {
        frag.classList.remove("__w", "__e");
        inner.appendChild(frag);
        if (i < group.length - 1) {
          inner.appendChild(document.createTextNode(" "));
        }
      });

      line.appendChild(inner);
      el.appendChild(line);
    });

    return lineGroups.length;
  }

  function animateElement(el) {
    const inners = el.querySelectorAll(".tr-line-inner");
    if (!inners.length) return;

    gsap.set(el, { opacity: 1 });
    gsap.set(inners, { yPercent: 130, skewY: 2 });

    gsap.to(inners, {
      yPercent: 0,
      skewY: 0,
      ease: "power4.out",
      stagger: 0.12,
      duration: 0.85,
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  }

  function init() {
    const elements = document.querySelectorAll(".split");

    elements.forEach((el) => {
      prepareElement(el);
      detectLines(el);
      animateElement(el);
    });
  }

  // Inject required CSS
  const style = document.createElement("style");
  style.textContent = `
    .split { opacity: 0; }
    .tr-line {
      display: block;
      overflow: hidden;
      padding-bottom: 0.08em;
    }
    .tr-line + .tr-line { text-indent: 0 !important; }
    .tr-line-inner { display: block; }
  `;
  document.head.appendChild(style);

  document.fonts.ready.then(() => {
    // Small timeout ensures layout is fully painted after fonts load
    requestAnimationFrame(() => requestAnimationFrame(init));
  });

  // Re-run on resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.getAll().forEach((st) => st.kill());

      document.querySelectorAll(".split").forEach((el) => {
        // Restore original text before re-splitting
        gsap.set(el, { clearProps: "opacity" });
      });

      init();
    }, 400);
  });
})();
