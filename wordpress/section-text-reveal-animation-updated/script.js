function getVisualLines(el) {
  if (!el) return;

  // Force block display for consistent measurement regardless of tag (h1-h6, p, span, etc.)
  const originalDisplay = el.style.display;
  const originalOverflow = el.style.overflow;
  el.style.display = "block";
  el.style.overflow = "visible";

  const fullText = el.textContent.replace(/\s+/g, " ").trim();
  const words = fullText.split(" ");

  // Use inline-block for word spans so offsetTop measures correctly inside any element
  el.innerHTML = words
    .map(
      (word) =>
        `<span class="__word" style="display:inline;white-space:nowrap;">${word}</span>`,
    )
    .join(" ");

  const spans = el.querySelectorAll(".__word");
  const lines = [];
  let currentTop = null;
  let currentLine = [];

  // Use a small tolerance for offsetTop comparison to handle sub-pixel differences
  spans.forEach((span) => {
    const top = span.offsetTop;
    if (currentTop === null || Math.abs(top - currentTop) < 2) {
      currentLine.push(span.textContent);
    } else {
      lines.push(currentLine.join(" "));
      currentLine = [span.textContent];
    }
    currentTop = top;
  });

  if (currentLine.length) lines.push(currentLine.join(" "));

  el.innerHTML = lines
    .map(
      (lineText) =>
        `<span class="line"><span class="line-inner">${lineText}</span></span>`,
    )
    .join("");

  // Restore original inline styles (CSS classes will still apply)
  el.style.display = originalDisplay;
  el.style.overflow = originalOverflow;

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
    duration: 1.3,
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
