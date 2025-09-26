// public/js/explore.js
document.addEventListener("DOMContentLoaded", () => {
  // like buttons
  document.querySelectorAll(".btn-like").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      try {
        const res = await fetch(`/explore/post/${id}/like`, { method: "POST", headers: { "Accept": "application/json" }});
        const data = await res.json();
        if (data.ok) {
          btn.classList.toggle("active", data.liked);
          const span = btn.querySelector(".count");
          if (span) span.innerText = data.likesCount;
          // change icon style
          const icon = btn.querySelector("i");
          if (icon) icon.className = data.liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
        } else {
          if (data.message) alert(data.message);
        }
      } catch (err) { console.error(err); }
    });
  });
document.addEventListener("DOMContentLoaded", function () {
  const likeBtn = document.getElementById("likeBtn");
  const likeCount = document.getElementById("likeCount");

  likeBtn.addEventListener("click", async function () {
    const postId = likeBtn.getAttribute("data-id");
    try {
      const res = await fetch(`/posts/${postId}/like`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        likeCount.textContent = data.likes;
        likeBtn.classList.toggle("liked");
      }
    } catch (err) {
      console.error(err);
    }
  });
});
  // save buttons
  document.querySelectorAll(".btn-save").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      try {
        const res = await fetch(`/explore/post/${id}/save`, { method: "POST", headers: { "Accept": "application/json" }});
        const data = await res.json();
        if (data.ok) {
          btn.classList.toggle("active", data.saved);
          const icon = btn.querySelector("i");
          if (icon) icon.className = data.saved ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark";
        } else {
          if (data.message) alert(data.message);
        }
      } catch (err) { console.error(err); }
    });
  });

  // Delegated click for cards (so overlay buttons don't navigate)
  document.querySelectorAll(".card-link").forEach(link => {
    link.addEventListener("click", (e) => {
      // normal navigation will occur - keep
    });
  });
});

// Profile dropdown toggle
document.addEventListener("DOMContentLoaded", () => {
  const profileDropdown = document.querySelector(".profile-dropdown");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  if (profileDropdown && dropdownMenu) {
    profileDropdown.addEventListener("click", (e) => {
      e.stopPropagation(); // stop bubbling
      dropdownMenu.classList.toggle("show");
    });

    // close dropdown if click outside
    document.addEventListener("click", (e) => {
      if (!profileDropdown.contains(e.target)) {
        dropdownMenu.classList.remove("show");
      }
    });
  }
});

// ... (existing code) ...

// User Search Functionality
const userSearchInput = document.getElementById('userSearch');
const searchResultsContainer = document.getElementById('searchResults');

// Function to fetch and display search results
async function searchUsers(query) {
    if (query.length < 2) {
        searchResultsContainer.classList.remove('show');
        return;
    }

    try {
        const response = await fetch(`/api/users/search?q=${query}`);
        const users = await response.json();
        
        searchResultsContainer.innerHTML = ''; // Clear previous results

        if (users.length > 0) {
            users.forEach(user => {
                const resultItem = document.createElement('a');
                resultItem.href = `/profile/${user.username}`;
                resultItem.classList.add('search-result-item');
                resultItem.innerHTML = `
                    <img src="${user.avatar || '/images/default-avatar.jpg'}" class="avatar" alt="${user.username} avatar">
                    <div class="user-info">
                        <span class="username">@${user.username}</span>
                        ${user.name ? `<span class="name">${user.name}</span>` : ''}
                    </div>
                `;
                searchResultsContainer.appendChild(resultItem);
            });
            searchResultsContainer.classList.add('show');
        } else {
            searchResultsContainer.classList.remove('show');
        }
    } catch (error) {
        console.error('Failed to fetch search results:', error);
        searchResultsContainer.classList.remove('show');
    }
}

// Event listener for the search input
userSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    searchUsers(query);
});

// Close the dropdown if the user clicks outside of it
document.addEventListener('click', (e) => {
    if (!userSearchInput.contains(e.target) && !searchResultsContainer.contains(e.target)) {
        searchResultsContainer.classList.remove('show');
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