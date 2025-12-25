"""
Production AI Configuration
Zero manual settings needed - AI decides everything
"""

# Quality thresholds (AI auto-filters)
QUALITY_CONFIG = {
    'min_resolution': 700,           # Minimum width/height
    'min_aesthetic_score': 0.65,     # Beauty score (0-1)
    'max_blur_score': 0.3,           # Reject blurry images
    'min_contrast': 0.2              # Reject washed out images
}

# AI Categorization confidence
CATEGORIZATION_CONFIG = {
    'min_confidence': 0.6,           # Only confident predictions
    'enable_multi_category': True,   # Image can be in multiple categories
    'auto_occasion_detection': True  # AI decides occasions
}

# Categories (AI auto-assigns)
CATEGORIES = {
    'primary': ['casual', 'formal', 'party', 'work', 'date', 'vacation'],
    'style': ['trendy', 'elegant', 'minimalist', 'boho', 'streetwear', 'classic', 'romantic'],
    'formality': ['very-casual', 'casual', 'smart-casual', 'business', 'formal', 'black-tie']
}

# Embedding settings
EMBEDDING_CONFIG = {
    'model': 'openai/clip-vit-base-patch32',
    'dimension': 512,
    'normalize': True
}

# Processing
BATCH_CONFIG = {
    'batch_size': 10,               # Process 10 images at a time
    'parallel_processing': False,    # Set True if you have GPU
    'skip_existing': True            # Don't reprocess
}
