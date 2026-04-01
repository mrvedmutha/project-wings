gsap.registerPlugin(SplitText);

console.clear();

document.fonts.ready.then(() => {
  const element = document.querySelector(".split");
  gsap.set(element, { opacity: 1 });

  let split;
  SplitText.create(".split", {
    type: "words,lines",
    linesClass: "line",
    autoSplit: true,
    mask: "lines",
    onSplit: (self) => {
      // Debug logging
      console.log("=== SPLITTEXT DEBUG ===");
      console.log("Total lines created:", self.lines.length);
      console.log("Window height:", window.innerHeight);
      console.log("");

      // Detailed height analysis for each line
      self.lines.forEach((line, index) => {
        const computedStyle = window.getComputedStyle(line);

        console.log(`📏 Line ${index + 1}:`);
        console.log(`  Text: "${line.textContent.trim()}"`);
        console.log(`  Element:`, line);
        console.log(`  Tag: ${line.tagName}, Classes: "${line.className}"`);
        console.log(`  div.line offsetHeight: ${line.offsetHeight}px`);
        console.log(`  div.line clientHeight: ${line.clientHeight}px`);
        console.log(`  div.line scrollHeight: ${line.scrollHeight}px`);
        console.log(
          `  getBoundingClientRect height: ${line.getBoundingClientRect().height}px`,
        );

        // Check parent (might be a mask wrapper)
        if (line.parentElement) {
          console.log(`  Parent element:`, line.parentElement);
          console.log(
            `  Parent tag: ${line.parentElement.tagName}, Classes: "${line.parentElement.className}"`,
          );
          console.log(
            `  Parent offsetHeight: ${line.parentElement.offsetHeight}px`,
          );

          if (line.parentElement !== element) {
            console.log(`  🎭 MASK WRAPPER DETECTED!`);
          }
        }

        console.log(`  computed line-height: ${computedStyle.lineHeight}`);
        console.log(`  computed font-size: ${computedStyle.fontSize}`);
        console.log("");
      });

      // Compare heights
      if (self.lines.length > 1) {
        const heights = self.lines.map((line) => line.offsetHeight);
        const minHeight = Math.min(...heights);
        const maxHeight = Math.max(...heights);

        console.log("📊 Height Comparison:");
        console.log(`  Min line height: ${minHeight}px`);
        console.log(`  Max line height: ${maxHeight}px`);
        console.log(`  Height difference: ${maxHeight - minHeight}px`);

        if (maxHeight > minHeight) {
          console.log(`  ⚠️ Line height inconsistency detected!`);
          heights.forEach((h, i) => {
            if (h > minHeight) {
              console.log(
                `    → Line ${i + 1} is ${h - minHeight}px taller than expected`,
              );
            }
          });
        } else {
          console.log("  ✓ All lines have consistent height");
        }
      }

      console.log("======================");

      // Remove text-indent from parent after split
      element.style.textIndent = "0";

      // Apply padding only to the first line
      if (self.lines[0]) {
        self.lines[0].style.paddingLeft = "25%";
      }

      split = gsap.from(self.lines, {
        duration: 0.6,
        yPercent: 100,
        opacity: 0,
        stagger: 0.1,
        ease: "expo.out",
      });
      return split;
    },
  });

  document.querySelector("button").addEventListener("click", (e) => {
    split.timeScale(0.2).play(0);
  });
});
