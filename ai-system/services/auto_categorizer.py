"""
Auto-Categorizer - AI decides everything
NO manual CSV needed!
"""

from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image

class AutoCategorizer:
    """
    Automatically categorizes fashion images using CLIP
    """
    
    def __init__(self, clip_model, clip_processor, config):
        self.model = clip_model
        self.processor = clip_processor
        self.config = config
        
        # Category definitions (AI matches to these)
        self.category_definitions = {
            'casual': [
                "casual everyday outfit",
                "comfortable casual wear",
                "street style casual fashion",
                "relaxed daily outfit"
            ],
            'formal': [
                "formal business outfit",
                "professional business attire",
                "elegant formal dress",
                "black tie formal wear"
            ],
            'party': [
                "party night out outfit",
                "club wear fashion",
                "cocktail party dress",
                "celebration outfit"
            ],
            'work': [
                "business casual office wear",
                "professional work outfit",
                "office appropriate attire",
                "workplace fashion"
            ],
            'date': [
                "romantic date night outfit",
                "dinner date fashion",
                "date appropriate clothing",
                "romantic evening wear"
            ],
            'vacation': [
                "vacation resort wear",
                "beach holiday outfit",
                "travel casual fashion",
                "summer vacation clothing"
            ]
        }
        
        # Style definitions
        self.style_definitions = {
            'trendy': "trendy fashionable modern style",
            'elegant': "elegant sophisticated classy style",
            'minimalist': "minimalist simple clean aesthetic",
            'boho': "bohemian boho chic style",
            'streetwear': "urban streetwear casual style",
            'classic': "classic timeless traditional style",
            'romantic': "romantic feminine soft style"
        }
    
    def categorize(self, image):
        """
        Returns: {
            'primary_category': str,
            'confidence': float,
            'all_categories': dict,
            'style': str,
            'style_confidence': float
        }
        """
        try:
            # Get category scores
            category_scores = self._score_categories(image)
            
            # Get style scores
            style_scores = self._score_styles(image)
            
            # Determine primary category
            primary_category = max(category_scores, key=category_scores.get)
            confidence = category_scores[primary_category]
            
            # Determine style
            primary_style = max(style_scores, key=style_scores.get)
            style_confidence = style_scores[primary_style]
            
            # Multi-category support
            multi_categories = {
                cat: score 
                for cat, score in category_scores.items() 
                if score > self.config['min_confidence']
            }
            
            return {
                'primary_category': primary_category,
                'confidence': round(confidence, 3),
                'all_categories': category_scores,
                'multi_categories': multi_categories,
                'style': primary_style,
                'style_confidence': round(style_confidence, 3),
                'all_styles': style_scores
            }
            
        except Exception as e:
            print(f"Categorization error: {e}")
            return {
                'primary_category': 'casual',
                'confidence': 0.0,
                'error': str(e)
            }
    
    def _score_categories(self, image):
        """Score image against all categories"""
        scores = {}
        
        for category, descriptions in self.category_definitions.items():
            # Get average score across all descriptions
            category_score = self._get_clip_similarity(image, descriptions)
            scores[category] = category_score
        
        # Normalize scores
        total = sum(scores.values())
        if total > 0:
            scores = {k: v/total for k, v in scores.items()}
        
        return scores
    
    def _score_styles(self, image):
        """Score image against all styles"""
        scores = {}
        
        descriptions = list(self.style_definitions.values())
        similarities = self._get_clip_similarity_batch(image, descriptions)
        
        for i, style in enumerate(self.style_definitions.keys()):
            scores[style] = similarities[i]
        
        # Normalize
        total = sum(scores.values())
        if total > 0:
            scores = {k: v/total for k, v in scores.items()}
        
        return scores
    
    def _get_clip_similarity(self, image, text_descriptions):
        """Get CLIP similarity score"""
        try:
            inputs = self.processor(
                text=text_descriptions,
                images=image,
                return_tensors="pt",
                padding=True
            )
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                similarity = outputs.logits_per_image.softmax(dim=1)[0]
                avg_similarity = similarity.mean().item()
            
            return avg_similarity
            
        except:
            return 0.0
    
    def _get_clip_similarity_batch(self, image, texts):
        """Get similarities for multiple texts at once"""
        try:
            inputs = self.processor(
                text=texts,
                images=image,
                return_tensors="pt",
                padding=True
            )
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                similarities = outputs.logits_per_image.softmax(dim=1)[0]
            
            return similarities.tolist()
            
        except:
            return [0.0] * len(texts)
