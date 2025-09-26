document.addEventListener("DOMContentLoaded", () => {
  const clickableStats = document.querySelectorAll(".profile-stats .clickable");
  const contents = document.querySelectorAll(".tab-content");

  clickableStats.forEach(stat => {
    stat.addEventListener("click", () => {
      // Remove active highlight from all
      clickableStats.forEach(s => s.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      // Add active to clicked stat
      stat.classList.add("active");

      // Show the correct tab content
      const target = stat.getAttribute("data-tab");
      const targetContent = document.getElementById(target);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });

  // Default: show posts
  document.querySelector(".profile-stats .clickable[data-tab='posts']").classList.add("active");
  document.getElementById("posts").classList.add("active");
});

// Edit Profile Modal
const editProfileBtn = document.querySelector(".edit-profile-btn");
const modal = document.getElementById("editProfileModal");
const cancelBtn = modal ? modal.querySelector(".cancel-btn") : null;
const form = document.getElementById("editProfileForm");

// Open modal
editProfileBtn?.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

// Cancel modal with confirmation
cancelBtn?.addEventListener("click", () => {
  if (confirm("Discard changes?")) {
    modal.classList.add("hidden");
  }
});

// Submit form via fetch
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  try {
    const res = await fetch("/profile/update", {
      method: "POST",
      body: formData,
      headers: {
        "Accept": "application/json"
      }
    });
    const data = await res.json();
    if (data.ok) {
      alert("Profile updated successfully!");
      location.reload(); // refresh to show new info
    } else {
      alert(data.message || "Error updating profile");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});
const bannerCamera = document.querySelector(".banner-camera");
const bannerInput = document.getElementById("bannerInput");

bannerCamera?.addEventListener("click", () => {
  bannerInput.click();
});

bannerInput.addEventListener("change", async () => {
  if (bannerInput.files.length === 0) return;

  const formData = new FormData();
  formData.append("banner", bannerInput.files[0]);

  try {
    const res = await fetch("/profile/update-banner", {
  method: "POST",
  body: formData,
  headers: {
    "Accept": "application/json"
  }
});
    const data = await res.json();
    if (data.ok) {
      alert("Banner updated successfully!");
      location.reload();
    } else {
      alert(data.message || "Failed to update banner");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
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