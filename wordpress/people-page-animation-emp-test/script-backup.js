<script>
    document.addEventListener("DOMContentLoaded", () => {
  const slides = Array.from(
    document.querySelectorAll(".people-page_content-group"),
  );
  const prevBtn = document.querySelector(".people-page_nav-button--prev");
  const nextBtn = document.querySelector(".people-page_nav-button--next");
  const slider = document.querySelector(".people-page_slider");

  if (!slides.length) return;

  let current = 0;
  let isAnimating = false;
  let autoPlayTimer = null;

  // Calculate maximum height needed across all slides
  let maxHeight = 0;
  slides.forEach((slide) => {
    // Temporarily make slide visible to measure its natural height
    slide.style.position = "relative";
    slide.style.opacity = "1";
    const slideHeight = slide.offsetHeight;
    if (slideHeight > maxHeight) {
      maxHeight = slideHeight;
    }
    // Reset to default state
    slide.style.position = "";
    slide.style.opacity = "";
  });

  // Set the slider to the maximum height
  if (maxHeight > 0) {
    slider.style.height = `${maxHeight}px`;
  }

  // Prepare all slides: active one visible, others hidden and clipped
  slides.forEach((slide, index) => {
    const imageBox = slide.querySelector(".people-page_image-box");
    const textEls = slide.querySelectorAll(
      ".people-page_name, .people-page_role, .people-page_heading",
    );

    if (index === current) {
      gsap.set(imageBox, { clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(textEls, { opacity: 1, y: 0 });
      slide.classList.add("is-active");
      slide.setAttribute("aria-hidden", "false");
    } else {
      gsap.set(imageBox, { clipPath: "inset(0% 0% 100% 0%)" });
      gsap.set(textEls, { opacity: 0, y: 10 });
      slide.classList.remove("is-active");
      slide.setAttribute("aria-hidden", "true");
    }
  });

  function resetAutoPlay() {
    clearTimeout(autoPlayTimer);
    autoPlayTimer = setTimeout(() => {
      const nextIndex = (current + 1) % slides.length;
      animateTo(nextIndex, 1);
    }, 10000); // 10 seconds
  }

  function animateTo(nextIndex, direction = 1) {
    const isPrev = direction === -1;

    if (
      isAnimating ||
      nextIndex === current ||
      nextIndex < 0 ||
      nextIndex >= slides.length
    ) {
      return;
    }
    isAnimating = true;

    const currentSlide = slides[current];
    const nextSlide = slides[nextIndex];

    const currentImage = currentSlide.querySelector(".people-page_image-box");
    const currentText = currentSlide.querySelectorAll(
      ".people-page_name, .people-page_role, .people-page_heading",
    );

    const nextImage = nextSlide.querySelector(".people-page_image-box");
    const nextText = nextSlide.querySelectorAll(
      ".people-page_name, .people-page_role, .people-page_heading",
    );

    const nextImageStart = isPrev
      ? "inset(100% 0% 0% 0%)"
      : "inset(0% 0% 100% 0%)";
    const exitTarget = isPrev ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)";

    gsap.set(nextSlide, {
      opacity: 1,
      pointerEvents: "auto",
      position: "absolute",
      inset: 0,
    });
    gsap.set(nextImage, { clipPath: nextImageStart });
    gsap.set(nextText, { opacity: 0, y: 10 });

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        currentSlide.classList.remove("is-active");
        currentSlide.setAttribute("aria-hidden", "true");
        gsap.set(currentSlide, {
          opacity: 0,
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
        });

        nextSlide.classList.add("is-active");
        nextSlide.setAttribute("aria-hidden", "false");
        gsap.set(nextSlide, { position: "relative", inset: "", opacity: 1 });

        current = nextIndex;
        isAnimating = false;
        resetAutoPlay();
      },
    });

    // Exit current: image direction depends on navigation; text fades out/up
    tl.to(
      currentImage,
      { clipPath: exitTarget, duration: 0.6, ease: "power2.inOut" },
      0,
    );
    tl.to(
      currentText,
      { opacity: 0, y: -10, stagger: 0.05, duration: 0.45, ease: "power1.in" },
      0,
    );

    // Entry next: image direction depends on navigation, then text fade-in with stagger
    tl.addLabel("enter", 0.6);
    tl.to(
      nextImage,
      { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power2.out" },
      "enter",
    );
    tl.to(
      nextText,
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, ease: "power2.out" },
      "enter+=0.1",
    );
  }

  prevBtn?.addEventListener("click", () => {
    const nextIndex = (current - 1 + slides.length) % slides.length;
    animateTo(nextIndex, -1);
    resetAutoPlay();
  });

  nextBtn?.addEventListener("click", () => {
    const nextIndex = (current + 1) % slides.length;
    animateTo(nextIndex, 1);
    resetAutoPlay();
  });

  // Start auto-play timer
  resetAutoPlay();
});

</script>