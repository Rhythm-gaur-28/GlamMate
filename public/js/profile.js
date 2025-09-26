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
  document.querySelector(".profile-stats .clickable[data-tab='posts']")?.classList.add("active");
  document.getElementById("posts")?.classList.add("active");
});

// Custom Notification System
class NotificationManager {
  constructor() {
    this.createNotificationContainer();
  }

  createNotificationContainer() {
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      document.body.appendChild(container);
    }
  }

  show(type, title, message, buttons = []) {
    return new Promise((resolve) => {
      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'notification-overlay';
      
      // Create notification
      const notification = document.createElement('div');
      notification.className = 'custom-notification';
      
      // Create content
      const content = document.createElement('div');
      content.className = 'notification-content';
      
      // Icon
      const icon = document.createElement('div');
      icon.className = `notification-icon ${type}`;
      icon.innerHTML = type === 'success' ? '✓' : '⚠';
      
      // Message container
      const messageContainer = document.createElement('div');
      messageContainer.className = 'notification-message';
      
      const titleEl = document.createElement('h3');
      titleEl.className = 'notification-title';
      titleEl.textContent = title;
      
      const textEl = document.createElement('p');
      textEl.className = 'notification-text';
      textEl.textContent = message;
      
      messageContainer.appendChild(titleEl);
      messageContainer.appendChild(textEl);
      
      content.appendChild(icon);
      content.appendChild(messageContainer);
      
      // Add buttons if provided
      if (buttons.length > 0) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'notification-buttons';
        
        buttons.forEach(button => {
          const btn = document.createElement('button');
          btn.className = `notification-btn ${button.type || 'secondary'}`;
          btn.textContent = button.text;
          btn.onclick = () => {
            this.hide(notification, overlay);
            resolve(button.value);
          };
          buttonContainer.appendChild(btn);
        });
        
        notification.appendChild(content);
        notification.appendChild(buttonContainer);
      } else {
        notification.appendChild(content);
        // Auto-hide after 3 seconds for info notifications
        setTimeout(() => {
          this.hide(notification, overlay);
          resolve(null);
        }, 3000);
      }
      
      // Add to DOM
      document.body.appendChild(overlay);
      document.body.appendChild(notification);
      
      // Show with animation
      requestAnimationFrame(() => {
        overlay.classList.add('show');
        notification.classList.add('show');
      });
      
      // Close on overlay click for info notifications
      if (buttons.length === 0) {
        overlay.onclick = () => {
          this.hide(notification, overlay);
          resolve(null);
        };
      }
    });
  }

  hide(notification, overlay) {
    notification.classList.remove('show');
    overlay.classList.remove('show');
    
    setTimeout(() => {
      if (notification.parentNode) notification.parentNode.removeChild(notification);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 400);
  }

  success(title, message) {
    return this.show('success', title, message);
  }

  confirm(title, message) {
    return this.show('warning', title, message, [
      { text: 'Cancel', type: 'secondary', value: false },
      { text: 'Confirm', type: 'primary', value: true }
    ]);
  }
}

// Initialize notification manager
const notifications = new NotificationManager();

// Edit Profile Modal
const editProfileBtn = document.querySelector(".edit-profile-btn");
const modal = document.getElementById("editProfileModal");
const form = document.getElementById("editProfileForm");
const profilePreview = document.getElementById("profilePreview");
const avatarInput = document.getElementById("avatar");

// Profile preview functionality
function updateProfilePreview(file) {
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      profilePreview.innerHTML = `<img src="${e.target.result}" alt="Profile Preview">`;
    };
    reader.readAsDataURL(file);
  }
}

// Handle avatar input change
avatarInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    updateProfilePreview(file);
  }
});

// Open modal
editProfileBtn?.addEventListener("click", () => {
  modal?.classList.remove("hidden");
  document.body.style.overflow = 'hidden';
});

// Close modal function
function closeModal() {
  modal?.classList.add("hidden");
  document.body.style.overflow = '';
}

// Cancel button with custom confirmation
document.querySelector(".cancel-btn")?.addEventListener("click", async () => {
  const confirmed = await notifications.confirm(
    'Discard Changes?',
    'Are you sure you want to close this dialog? Any unsaved changes will be lost.'
  );
  
  if (confirmed) {
    closeModal();
  }
});

// Submit form with enhanced UX
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const saveBtn = form.querySelector(".save-btn");
  const formData = new FormData(form);

  // Add loading state
  saveBtn.classList.add("loading");
  saveBtn.disabled = true;

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
      await notifications.success(
        'Profile Updated!',
        'Your profile has been successfully updated. The page will refresh to show your changes.'
      );
      closeModal();
      location.reload();
    } else {
      await notifications.show('warning', 'Update Failed', data.message || "There was an error updating your profile. Please try again.");
    }
  } catch (err) {
    console.error(err);
    await notifications.show('warning', 'Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
  } finally {
    saveBtn.classList.remove("loading");
    saveBtn.disabled = false;
  }
});

// Banner upload functionality
const bannerCamera = document.querySelector(".banner-camera");
const bannerInput = document.getElementById("bannerInput");

bannerCamera?.addEventListener("click", () => {
  bannerInput?.click();
});

bannerInput?.addEventListener("change", async () => {
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
      await notifications.success(
        'Banner Updated!',
        'Your profile banner has been successfully updated.'
      );
      location.reload();
    } else {
      await notifications.show('warning', 'Update Failed', data.message || "Failed to update banner. Please try again.");
    }
  } catch (err) {
    console.error(err);
    await notifications.show('warning', 'Connection Error', 'Unable to upload banner. Please check your connection.');
  }
});

// Profile dropdown functionality
document.addEventListener("DOMContentLoaded", () => {
  const profileDropdown = document.querySelector(".profile-dropdown");
  const dropdownMenu = profileDropdown?.querySelector(".dropdown-menu");

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

// Close modal on escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal?.classList.contains("hidden")) {
    document.querySelector(".cancel-btn")?.click();
  }
});

// Prevent modal close on content click
modal?.querySelector(".modal-content")?.addEventListener("click", (e) => {
  e.stopPropagation();
});

// Close modal on overlay click
modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    document.querySelector(".cancel-btn")?.click();
  }
});
