const Replicate = require("replicate");
console.log("DEBUG REPLICATE TOKEN EXISTS:", !!process.env.REPLICATE_API_TOKEN);
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// TEMP TEST: generate a simple image to verify API
exports.testGenerate = async (req, res) => {
  try {
    const output = await replicate.run(
      "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc", // Replicate model id
      {
        input: {
          prompt: "high quality fashion photo of a woman in a red evening dress, studio lighting",
          negative_prompt: "blurry, lowres, watermark, logo, text",
          width: 768,
          height: 1024,
          num_outputs: 1,
        },
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : null;
    return res.json({ success: true, imageUrl, raw: output });
  } catch (err) {
    console.error("Replicate test error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Replicate failed" });
  }
};
