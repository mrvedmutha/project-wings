function getVisualLines(el) {
  if (!el) return;

  const originalContent = Array.from(el.childNodes);
  const items = [];

  originalContent.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.replace(/\s+/g, " ").trim();
      if (text) {
        const words = text.split(" ");
        words.forEach((word) => {
          if (word) {
            const span = document.createElement("span");
            span.className = "__word";
            span.textContent = word;
            items.push(span);
          }
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.classList.add("__element");
      items.push(node.cloneNode(true));
    }
  });

  el.innerHTML = "";
  items.forEach((item) => {
    el.appendChild(item);
    if (
      item.classList.contains("__word") &&
      items.indexOf(item) < items.length - 1
    ) {
      el.appendChild(document.createTextNode(" "));
    }
  });

  const allItems = el.querySelectorAll(".__word, .__element");
  const lines = [];
  let currentTop = null;
  let currentLine = [];

  allItems.forEach((item) => {
    const top = item.offsetTop;
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
    lineWrapper.className = "line";
    const lineInner = document.createElement("span");
    lineInner.className = "line-inner";

    line.forEach((item, idx) => {
      item.classList.remove("__word", "__element");
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
  const lineInners = el.querySelectorAll(".line-inner");

  gsap.registerPlugin(ScrollTrigger);
  gsap.set(el, { opacity: 1 });
  gsap.set(lineInners, { yPercent: 150, skewY: 1.5 });

  const tween = gsap.to(lineInners, {
    yPercent: 0,
    skewY: 0,
    ease: "power4.out",
    stagger: 0.25,
    duration: 0.8,
    scrollTrigger: {
      trigger: el,
      start: "top 80%",
      toggleActions: "play none none none",
    },
  });

  if (tween.scrollTrigger) {
    scrollTriggers.push(tween.scrollTrigger);
  }

  return tween;
}

let resizeTimer;
let scrollTriggers = [];

function init() {
  const elements = document.querySelectorAll(".split");
  elements.forEach((el) => {
    getVisualLines(el);
    animateLines(el);
  });
}

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    scrollTriggers.forEach((st) => st.kill());
    scrollTriggers = [];
    const elements = document.querySelectorAll(".split");
    elements.forEach((el) => {
      getVisualLines(el);
      animateLines(el);
    });
  }, 400);
});

document.fonts.ready.then(init);
