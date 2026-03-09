// Hillview Group, Inc. - Main JavaScript File

document.addEventListener("DOMContentLoaded", function () {
  // Initialize Lucide icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", function () {
      mobileMenu.classList.toggle("hidden");

      // Toggle menu icon between hamburger and X
      const icon = mobileMenuBtn.querySelector("i");
      if (icon) {
        if (mobileMenu.classList.contains("hidden")) {
          icon.setAttribute("data-lucide", "menu");
        } else {
          icon.setAttribute("data-lucide", "x");
        }
        lucide.createIcons();
      }
    });

    // Close mobile menu when clicking on a link
    const mobileLinks = mobileMenu.querySelectorAll("a");
    mobileLinks.forEach((link) => {
      link.addEventListener("click", function () {
        mobileMenu.classList.add("hidden");
        const icon = mobileMenuBtn.querySelector("i");
        if (icon) {
          icon.setAttribute("data-lucide", "menu");
          lucide.createIcons();
        }
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with slide-up class
  document.querySelectorAll(".slide-up").forEach((el) => {
    observer.observe(el);
  });

  // Add scroll effect to navigation
  const nav = document.querySelector("nav");
  if (nav) {
    let lastScroll = 0;

    window.addEventListener("scroll", () => {
      const currentScroll = window.pageYOffset;

      // Add background blur on scroll
      if (currentScroll > 50) {
        nav.classList.add("shadow-lg");
      } else {
        nav.classList.remove("shadow-lg");
      }

      lastScroll = currentScroll;
    });
  }

  // Form input focus effects
  document.querySelectorAll(".form-input").forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
    });

    input.addEventListener("blur", function () {
      this.parentElement.classList.remove("focused");
    });
  });

  // Re-initialize Lucide icons after any dynamic content changes
  window.reinitializeIcons = function () {
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  };

  // Close mobile menu when clicking outside
  document.addEventListener("click", function (e) {
    if (mobileMenu && !mobileMenu.classList.contains("hidden")) {
      if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileMenu.classList.add("hidden");
        const icon = mobileMenuBtn.querySelector("i");
        if (icon) {
          icon.setAttribute("data-lucide", "menu");
          lucide.createIcons();
        }
      }
    }
  });

  // Handle escape key to close mobile menu
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      mobileMenu &&
      !mobileMenu.classList.contains("hidden")
    ) {
      mobileMenu.classList.add("hidden");
      const icon = mobileMenuBtn.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", "menu");
        lucide.createIcons();
      }
    }
  });

  console.log("✅ Hillview Group scripts loaded successfully");
});
