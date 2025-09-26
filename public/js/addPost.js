const steps = document.querySelectorAll(".wizard-step");
let currentStep = 0;
const imagesBase64 = [];

const imageInput = document.getElementById("imageInput");
const previewContainer = document.getElementById("previewContainer");
const hiddenImagesContainer = document.getElementById("hiddenImagesContainer");

imageInput.addEventListener("change", (e) => {
    previewContainer.innerHTML = "";
    imagesBase64.length = 0;

    const files = Array.from(e.target.files).slice(0, 5);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function (ev) {
            const img = document.createElement("img");
            img.src = ev.target.result;
            img.className = "image-preview";
            previewContainer.appendChild(img);

            imagesBase64.push(ev.target.result);
        };
        reader.readAsDataURL(file);
    });
});

// Step navigation
document.getElementById("next1").addEventListener("click", () => {
    if (imagesBase64.length === 0) { alert("Upload at least one image"); return; }
    steps[currentStep].classList.remove("active");
    currentStep++;
    steps[currentStep].classList.add("active");

    // Populate filter preview
    const filterSelect = document.getElementById("filterSelect");
    const filterPreview = document.getElementById("filterPreview");
    filterPreview.innerHTML = "";
    imagesBase64.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.style.filter = filterSelect.value;
        img.className = "filter-preview";
        filterPreview.appendChild(img);
    });
});

document.getElementById("prev2").addEventListener("click", () => {
    steps[currentStep].classList.remove("active");
    currentStep--;
    steps[currentStep].classList.add("active");
});

document.getElementById("next2").addEventListener("click", () => {
    steps[currentStep].classList.remove("active");
    currentStep++;
    steps[currentStep].classList.add("active");

    // Add hidden inputs for submission
    hiddenImagesContainer.innerHTML = "";
    imagesBase64.forEach(base64 => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "images";
        input.value = base64;
        hiddenImagesContainer.appendChild(input);
    });
});

document.getElementById("prev3").addEventListener("click", () => {
    steps[currentStep].classList.remove("active");
    currentStep--;
    steps[currentStep].classList.add("active");
});

// Filter preview change
document.getElementById("filterSelect").addEventListener("change", (e) => {
    const filterPreview = document.getElementById("filterPreview");
    filterPreview.querySelectorAll("img").forEach(img => {
        img.style.filter = e.target.value;
    });
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