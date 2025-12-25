document.addEventListener("DOMContentLoaded", () => {
  const promptInput = document.getElementById("prompt-input");
  const categorySelect = document.getElementById("filter-category");
  const styleSelect = document.getElementById("filter-style");
  const occasionSelect = document.getElementById("filter-occasion");
  const colorSelect = document.getElementById("filter-color");
  const searchBtn = document.getElementById("search-btn");

  const resultsGrid = document.getElementById("results-grid");
  const resultsEmpty = document.getElementById("results-empty");
  const resultsLoading = document.getElementById("results-loading");

  async function fetchOutfits() {
    const payload = {
      prompt: promptInput.value.trim(),
      category: categorySelect.value,
      style: styleSelect.value,
      occasion: occasionSelect.value,
      color: colorSelect.value,
      limit: 24,
    };

    resultsGrid.innerHTML = "";
    resultsEmpty.style.display = "none";
    resultsLoading.style.display = "block";

    try {
      const res = await fetch("/api/outfits/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      resultsLoading.style.display = "none";

      if (!data.success || !data.outfits || !data.outfits.length) {
        resultsEmpty.style.display = "block";
        return;
      }

      data.outfits.forEach((o) => {
        const card = document.createElement("article");
        card.className = "gm-outfit-card";

        // ---- IMAGE PATH FIX ----
        let imgPath = o.image_path || "";
        imgPath = imgPath.replace(/\\/g, "/");

        // If image_path is just "party--031.jpg", prepend folder
        if (!imgPath.startsWith("curated-outfits")) {
          imgPath = "curated-outfits/1-downloaded/" + imgPath;
        }

        const img = document.createElement("img");
        img.src = "/" + imgPath;
        img.alt = (o.category && o.category.primary) || "Outfit";
        // ------------------------

        const meta = document.createElement("div");
        meta.className = "gm-outfit-meta";

        const cat = document.createElement("p");
        cat.className = "gm-outfit-cat";
        cat.textContent = `${(o.category && o.category.primary) || ""} • ${
          (o.style && o.style.primary) || ""
        }`;

        const tags = document.createElement("p");
        tags.className = "gm-outfit-tags";
        const colors = (o.attributes?.colors || []).slice(0, 3).join(", ");
        const occ = (o.attributes?.occasions || []).slice(0, 2).join(", ");
        tags.textContent = [colors, occ].filter(Boolean).join(" • ");

        meta.appendChild(cat);
        meta.appendChild(tags);

        card.appendChild(img);
        card.appendChild(meta);

        resultsGrid.appendChild(card);
      });
    } catch (err) {
      console.error("Error fetching outfits:", err);
      resultsLoading.style.display = "none";
      resultsEmpty.style.display = "block";
      resultsEmpty.textContent = "Something went wrong. Please try again.";
    }
  }

  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    fetchOutfits();
  });

  // Optional: Enter key triggers search
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      fetchOutfits();
    }
  });
});
