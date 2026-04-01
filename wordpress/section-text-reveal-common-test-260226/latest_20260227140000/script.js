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

          // Block/wrapper elements — recurse into them to extract text
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
            tag === "sup" ||
            tag === "h1" ||
            tag === "h2" ||
            tag === "h3" ||
            tag === "h4" ||
            tag === "h5" ||
            tag === "h6"
          ) {
            extractNodes(node);
            return;
          }

          // Skip <source> and similar non-content tags
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

    // Detect if a heading wraps the content, and shallow-clone it to preserve styles
    const headingEl = contentNode.querySelector("h1, h2, h3, h4, h5, h6");
    let headingWrapper = null;
    if (headingEl) {
      headingWrapper = headingEl.cloneNode(false); // shallow: keeps tag, class, style — no children
    }

    // Replace content: wrap split words in the heading clone if one was found
    if (widgetContainer) {
      widgetContainer.innerHTML = "";
      if (headingWrapper) {
        headingWrapper.appendChild(parentSpan);
        widgetContainer.appendChild(headingWrapper);
      } else {
        widgetContainer.appendChild(parentSpan);
      }
    } else {
      element.innerHTML = "";
      if (headingWrapper) {
        headingWrapper.appendChild(parentSpan);
        element.appendChild(headingWrapper);
      } else {
        element.appendChild(parentSpan);
      }
    }

    // Check if this element uses the hidden-until-animate class
    const isOpZero = element.classList.contains("split-op-zero");

    // Get all mask containers to measure line positions
    const maskElements = parentSpan.querySelectorAll(".split-mask-c");
    const animateElements = parentSpan.querySelectorAll(".split-is");

    // Wait a tick so layout is fully calculated before measuring
    requestAnimationFrame(() => {
      // Group words into lines by their offsetTop
      const lineMap = new Map();
      maskElements.forEach((mask, i) => {
        const top = Math.round(mask.getBoundingClientRect().top);
        if (!lineMap.has(top)) lineMap.set(top, []);
        lineMap.get(top).push(i);
      });

      // Assign a line index to each word in DOM order
      const wordLineIndex = new Array(maskElements.length);
      let lineIndex = 0;
      // Sort lines top-to-bottom before assigning indices
      const sortedTops = Array.from(lineMap.keys()).sort((a, b) => a - b);
      sortedTops.forEach((top) => {
        lineMap.get(top).forEach((i) => {
          wordLineIndex[i] = lineIndex;
        });
        lineIndex++;
      });

      // GSAP animation — stagger by line index
      gsap.from(Array.from(animateElements), {
        scrollTrigger: {
          trigger: element,
          start: "top 80%",
          toggleActions: "play none none none",
          markers: false,
          onToggle: (self) => {
            if (self.isActive && isOpZero) {
              element.classList.remove("split-op-zero");
            }
          },
        },
        yPercent: 100,
        duration: 1.3,
        stagger: {
          each: 0.02,
          fn: (index) => wordLineIndex[index] * 0.08,
        },
        ease: "expo.out",
      });
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
