// WordPress/Elementor compatible Split Text Reveal Animation
// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

function initSplitTextAnimation() {
  const splitElements = document.querySelectorAll(".split");

  splitElements.forEach((element) => {
    // Prevent double-processing
    if (element.getAttribute("data-split-done") === "true") return;
    element.setAttribute("data-split-done", "true");

    // In Elementor, actual content lives inside .elementor-widget-container > p
    // Find the deepest content node(s) that hold the actual text
    let contentNode = element;

    // Try to find the Elementor widget container first
    const widgetContainer = element.querySelector(
      ".elementor-widget-container",
    );
    if (widgetContainer) {
      contentNode = widgetContainer;
    }

    // Collect all text and inline element nodes recursively from the content
    const nodes = [];

    function extractNodes(parent) {
      Array.from(parent.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          // Clean whitespace but preserve meaningful spaces
          const text = node.textContent.replace(/\s+/g, " ");
          if (text.trim().length > 0) {
            nodes.push({ type: "text", content: text });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName.toLowerCase();

          // Skip <br> tags (Elementor sometimes adds them around <source> etc.)
          if (tag === "br") return;

          // Inline media elements — preserve as-is
          if (
            tag === "video" ||
            tag === "img" ||
            tag === "svg" ||
            tag === "iframe"
          ) {
            nodes.push({ type: "element", content: node.cloneNode(true) });
            return;
          }

          // Block/wrapper elements (p, div, span without special meaning) — recurse into them
          if (
            tag === "p" ||
            tag === "div" ||
            tag === "span" ||
            tag === "strong" ||
            tag === "em" ||
            tag === "b" ||
            tag === "i" ||
            tag === "a" ||
            tag === "mark" ||
            tag === "small" ||
            tag === "sub" ||
            tag === "sup"
          ) {
            extractNodes(node);
            return;
          }

          // For anything else (source, etc.), skip or preserve
          if (tag === "source") return;

          // Default: preserve as element
          nodes.push({ type: "element", content: node.cloneNode(true) });
        }
      });
    }

    extractNodes(contentNode);

    // Build the split structure
    const parentSpan = document.createElement("span");
    parentSpan.setAttribute("data-split-text", "");

    nodes.forEach((node) => {
      if (node.type === "text") {
        // Split text into words (handle &nbsp; as space too)
        const text = node.content.replace(/\u00A0/g, " ");
        const words = text.split(" ").filter((w) => w.length > 0);

        words.forEach((word) => {
          const maskSpan = document.createElement("span");
          maskSpan.className = "split-mask-c";

          const innerSpan = document.createElement("span");
          innerSpan.className = "split-w split-is";
          innerSpan.textContent = word;

          maskSpan.appendChild(innerSpan);
          parentSpan.appendChild(maskSpan);
        });
      } else if (node.type === "element") {
        const maskSpan = document.createElement("span");
        maskSpan.className = "split-mask-c split-element";

        const innerSpan = document.createElement("span");
        innerSpan.className = "split-w split-is";
        innerSpan.appendChild(node.content);

        maskSpan.appendChild(innerSpan);
        parentSpan.appendChild(maskSpan);
      }
    });

    // Replace content: clear the widget container (or element) and insert split structure
    if (widgetContainer) {
      widgetContainer.innerHTML = "";
      widgetContainer.appendChild(parentSpan);
    } else {
      element.innerHTML = "";
      element.appendChild(parentSpan);
    }

    // Get all inner spans for animation
    const animateElements = parentSpan.querySelectorAll(".split-is");

    // GSAP animation with ScrollTrigger
    gsap.from(animateElements, {
      scrollTrigger: {
        trigger: element,
        start: "top 80%",
        toggleActions: "play none none none",
        markers: false,
      },
      yPercent: 100,
      skewY: -5,
      opacity: 0,
      duration: 0.6,
      stagger: 0.02,
      ease: "expo.out",
    });
  });
}

// Initialize after DOM is loaded and fonts are ready
// Use window load for WordPress to ensure Elementor has finished rendering
function startSplitAnimation() {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      initSplitTextAnimation();
    });
  } else {
    initSplitTextAnimation();
  }
}

// Try both DOMContentLoaded and window load for maximum compatibility
if (document.readyState === "complete") {
  // Page already loaded (script loaded late / async)
  startSplitAnimation();
} else {
  window.addEventListener("load", () => {
    startSplitAnimation();
  });
}
