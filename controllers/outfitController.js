const axios = require("axios");
const LuxuryOutfit = require("../models/LuxuryOutfit");

const AI_SERVICE_URL = "http://localhost:5000";

exports.getSuggestionPage = async (req, res) => {
  try {
    // Optional: load distinct filter values from DB
    const categories = ["casual", "formal", "party", "work", "date", "vacation"];
    const styles = ["trendy", "elegant", "minimalist", "boho", "streetwear", "classic", "romantic"];
    const colors = ["black","white","blue","red","green","yellow","pink","brown","gray","purple","orange","beige","multicolor"];
    const occasions = ["casual", "party", "work", "wedding", "romantic", "vacation"];

    res.render("outfit-suggestion", {
      pageTitle: "Outfit Suggestion",
      categories,
      styles,
      colors,
      occasions,
    });
  } catch (err) {
    console.error("Error rendering suggestion page:", err);
    res.status(500).send("Error loading outfit suggestion page");
  }
};

exports.searchOutfits = async (req, res) => {
  try {
    const { prompt, category, style, occasion, color, limit } = req.body;

    // 1. Build MongoDB base filter
    const filter = {};

    if (category) filter["category.primary"] = category;
    if (style) filter["style.primary"] = style;
    if (occasion) filter["attributes.occasions"] = occasion;
    if (color) filter["attributes.colors"] = color;

    // 2. If no prompt yet → just filter + sort by aesthetic score
    if (!prompt || !prompt.trim()) {
      const outfits = await LuxuryOutfit.find(filter)
        .sort({ "quality.aesthetic_score": -1 })
        .limit(Math.min(parseInt(limit) || 20, 60))
        .lean();

      return res.json({ success: true, mode: "filter-only", outfits });
    }

    // 3. If prompt present → get text embedding from Python AI
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/text-embedding`, {
      text: prompt,
    });

    if (!aiResponse.data.success) {
      return res.status(500).json({ success: false, error: "AI text embedding failed" });
    }

    const queryEmbedding = aiResponse.data.embedding; // 512-dim array

    // 4. Fetch candidate outfits from Mongo (filter + aesthetic sort)
    const candidates = await LuxuryOutfit.find(filter)
      .sort({ "quality.aesthetic_score": -1 })
      .limit(200) // candidate pool
      .lean();

    // 5. Compute cosine similarity in Node
    const norm = (v) => Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);

    const qNorm = norm(queryEmbedding);

    const scored = candidates.map((item) => {
      const v = item.embedding_vector || [];
      if (!v.length || v.length !== queryEmbedding.length) {
        return { item, score: -1 };
      }
      const score = dot(queryEmbedding, v) / (qNorm * norm(v) || 1);
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const topK = scored
      .filter((s) => s.score > 0)
      .slice(0, Math.min(parseInt(limit) || 20, 60))
      .map((s) => ({ ...s.item, similarity: s.score }));

    res.json({
      success: true,
      mode: "semantic",
      prompt,
      outfits: topK,
    });
  } catch (err) {
    console.error("Error in searchOutfits:", err);
    res.status(500).json({ success: false, error: "Server error while searching outfits" });
  }
};
