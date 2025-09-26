document.addEventListener("DOMContentLoaded", () => {
  const featureCards = document.querySelectorAll(".feature-card");
  const options = {
    threshold: 0.2
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        obs.unobserve(entry.target);
      }
    });
  }, options);

  featureCards.forEach(card => {
    observer.observe(card);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("usernameModal");
  const submitBtn = document.getElementById("submitUsername");
  const input = document.getElementById("usernameInput");
  const errorMsg = document.getElementById("errorMsg");

  if (modal) {
    modal.style.display = "flex"; // show modal
  }

  submitBtn?.addEventListener("click", async () => {
    const username = input.value.trim();
    if (!username) {
      errorMsg.textContent = "Username cannot be empty";
      return;
    }

    try {
      const res = await fetch("/set-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (data.ok) {
        modal.style.display = "none";
        location.reload(); // reload page to show username in navbar
      } else {
        errorMsg.textContent = data.message;
      }
    } catch (err) {
      console.error(err);
      errorMsg.textContent = "Server error. Try again.";
    }
  });
});

//scroll funtion navbar
document.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  const heroSection = document.querySelector(".hero"); // make sure your hero section has this class
  const loveSection = document.querySelector(".love-glammate");
  const actionSection = document.querySelector(".glammate-action"); // give this class to GlamMate in Action section

  const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
  const loveBottom = loveSection.offsetTop + loveSection.offsetHeight;

  if (window.scrollY < loveSection.offsetTop - 50) {
    // Before Love GlamMate — transparent
    navbar.classList.remove("scrolled");
  } else if (window.scrollY >= loveSection.offsetTop - 50 && window.scrollY < actionSection.offsetTop - 50) {
    // In Love GlamMate — pink
    navbar.classList.add("scrolled");
  } else if (window.scrollY >= actionSection.offsetTop - 50) {
    // In GlamMate in Action — transparent again
    navbar.classList.remove("scrolled");
  }
});


//glammate action slider
const slider = document.querySelector(".slider");
const slides = document.querySelectorAll(".slide");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");
const dotsContainer = document.querySelector(".dots");

let currentIndex = 0;
let slideInterval;
const intervalTime = 4000; // 4 seconds

// Create dots
slides.forEach((_, index) => {
  const dot = document.createElement("span");
  dot.addEventListener("click", () => goToSlide(index));
  dotsContainer.appendChild(dot);
});
const dots = dotsContainer.querySelectorAll("span");

function updateDots() {
  dots.forEach(dot => dot.classList.remove("active"));
  dots[currentIndex].classList.add("active");
}

function goToSlide(index) {
  currentIndex = index;
  slider.style.transform = `translateX(-${index * 100}%)`;
  updateDots();
  resetAutoSlide();
}

function nextSlide() {
  if (currentIndex < slides.length - 1) {
    currentIndex++;
  } else {
    // Go directly to first slide without "rewind" animation
    currentIndex = 0;
    slider.style.transition = "none"; // disable animation for instant jump
    slider.style.transform = `translateX(0)`;

    // Force reflow to apply transform instantly
    slider.offsetHeight; // this line is important

    slider.style.transition = "transform 0.5s ease"; // re-enable animation
  }
  goToSlide(currentIndex);
}


function prevSlideFn() {
  currentIndex = (currentIndex - 1 + slides.length) % slides.length;
  goToSlide(currentIndex);
}

function startAutoSlide() {
  slideInterval = setInterval(nextSlide, intervalTime);
}

function resetAutoSlide() {
  clearInterval(slideInterval);
  startAutoSlide();
}

prevBtn.addEventListener("click", prevSlideFn);
nextBtn.addEventListener("click", nextSlide);

goToSlide(0);
startAutoSlide();

// Intersection Observer for Fade-in
document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".fade-in-step");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, index * 200); // delay for sequential effect
      }
    });
  }, { threshold: 0.3 });

  steps.forEach(step => observer.observe(step));
});
// loved-by-glam-girls.js
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".review-card");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }, index * 200); // Stagger animation
      }
    });
  }, { threshold: 0.2 });

  cards.forEach(card => observer.observe(card));
});
// Profile dropdown toggle

document.addEventListener("DOMContentLoaded", () => {
  const profileDropdown = document.querySelector(".profile-dropdown");
  // Only select the dropdown-menu inside profile-dropdown
  const dropdownMenu = profileDropdown ? profileDropdown.querySelector(".dropdown-menu") : null;

  if (profileDropdown && dropdownMenu) {
    profileDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!profileDropdown.contains(e.target)) {
        dropdownMenu.classList.remove("show");
      }
    });
  }
});