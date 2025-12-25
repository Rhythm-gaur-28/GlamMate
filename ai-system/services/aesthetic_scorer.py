"""
AI Aesthetic Scorer - Rates image beauty (like Instagram algorithm)
Uses CLIP's understanding of aesthetic quality
"""

from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image

class AestheticScorer:
    """
    Scores images on aesthetic appeal (0-1)
    Higher = more beautiful/professional
    """
    
    def __init__(self, clip_model, clip_processor):
        self.model = clip_model
        self.processor = clip_processor
        
        # Aesthetic descriptors (positive)
        self.positive_prompts = [
            "professional fashion photography",
            "high quality aesthetic photo",
            "pinterest worthy image",
            "beautiful composition",
            "magazine quality photography",
            "instagram aesthetic",
            "trendy fashion photo",
            "luxury fashion photography"
        ]
        
        # Non-aesthetic descriptors (negative)
        self.negative_prompts = [
            "blurry low quality photo",
            "amateur snapshot",
            "poor lighting",
            "bad composition",
            "messy background"
        ]
    
    def score_aesthetics(self, image):
        """
        Returns aesthetic score 0-1
        """
        try:
            # Prepare image and text
            inputs = self.processor(
                text=self.positive_prompts + self.negative_prompts,
                images=image,
                return_tensors="pt",
                padding=True
            )
            
            # Get similarity scores
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=1)[0]
            
            # Calculate aesthetic score
            positive_score = probs[:len(self.positive_prompts)].sum().item()
            negative_score = probs[len(self.positive_prompts):].sum().item()
            
            # Normalize to 0-1
            aesthetic_score = positive_score / (positive_score + negative_score)
            
            return round(aesthetic_score, 3)
            
        except Exception as e:
            print(f"Aesthetic scoring error: {e}")
            return 0.5  # Neutral score on error
