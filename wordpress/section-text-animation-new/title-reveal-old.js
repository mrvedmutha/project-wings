(function () {
  function splitLines(el) {
    const originalNodes = Array.from(el.childNodes);
    const items = [];

    originalNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\s+/g, " ").trim();
        if (text) {
          text.split(" ").forEach((word) => {
            if (word) {
              const span = document.createElement("span");
              span.className = "__tr-word";
              span.textContent = word;
              items.push(span);
            }
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(true);
        clone.classList.add("__tr-element");
        items.push(clone);
      }
    });

    el.innerHTML = "";
    items.forEach((item, i) => {
      el.appendChild(item);
      if (item.classList.contains("__tr-word") && i < items.length - 1) {
        el.appendChild(document.createTextNode(" "));
      }
    });

    const allItems = el.querySelectorAll(".__tr-word, .__tr-element");
    const lines = [];
    let currentTop = null;
    let currentLine = [];

    allItems.forEach((item) => {
      const top = Math.round(item.getBoundingClientRect().top);
      if (currentTop === null || top === currentTop) {
        currentLine.push(item);
      } else {
        lines.push(currentLine);
        currentLine = [item];
      }
      currentTop = top;
    });
    if (currentLine.length) lines.push(currentLine);

    el.innerHTML = "";
    lines.forEach((line) => {
      const lineWrapper = document.createElement("span");
      lineWrapper.className = "blog-single__heading-line";
      lineWrapper.style.display = "block";
      lineWrapper.style.overflow = "hidden";

      const lineInner = document.createElement("span");
      lineInner.className = "blog-single__heading-line-inner";
      lineInner.style.display = "block";

      line.forEach((item, idx) => {
        item.classList.remove("__tr-word", "__tr-element");
        item.className = item.className.trim() || "blog-single__heading-word";
        lineInner.appendChild(item);
        if (idx < line.length - 1) {
          lineInner.appendChild(document.createTextNode(" "));
        }
      });

      lineWrapper.appendChild(lineInner);
      el.appendChild(lineWrapper);
    });

    return lines;
  }

  function animateLines(el) {
    const lineInners = el.querySelectorAll(".blog-single__heading-line-inner");
    if (!lineInners.length) return;

    el.style.opacity = "1";

    gsap.fromTo(
      lineInners,
      { yPercent: 150, skewY: 1.5 },
      {
        yPercent: 0,
        skewY: 0,
        ease: "power4.out",
        stagger: 0.25,
        duration: 0.8,
        delay: 0.3,
        immediateRender: true,
      },
    );
  }

  function init() {
    const elements = document.querySelectorAll(".blog-single__heading");

    elements.forEach((el) => {
      if (el.dataset.trDone) return;
      el.dataset.trDone = "1";

      const target = el.querySelector(".elementor-heading-title") || el;
      splitLines(target);
      animateLines(target);
    });
  }

  document.fonts.ready.then(() => {
    requestAnimationFrame(() => requestAnimationFrame(init));
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document
        .querySelectorAll(".blog-single__heading[data-tr-done]")
        .forEach((el) => {
          delete el.dataset.trDone;
        });
      init();
    }, 400);
  });
})();
