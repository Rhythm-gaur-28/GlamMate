"""
AI Quality Filter - Only luxury-grade images pass
Like Pinterest's quality control
"""

from PIL import Image, ImageStat
import numpy as np
import cv2

class QualityFilter:
    """
    Filters out low-quality images automatically
    """
    
    def __init__(self, config):
        self.min_resolution = config['min_resolution']
        self.min_aesthetic_score = config['min_aesthetic_score']
        self.max_blur_score = config['max_blur_score']
        self.min_contrast = config['min_contrast']
    
    def check_quality(self, image_path):
        """
        Returns: (passed: bool, scores: dict, reason: str)
        """
        try:
            image = Image.open(image_path)
            
            # Check 1: Resolution
            width, height = image.size
            if width < self.min_resolution or height < self.min_resolution:
                return False, {'resolution': 'failed'}, f"Too small: {width}x{height}"
            
            # Check 2: Aspect ratio (avoid weird crops)
            aspect_ratio = width / height
            if aspect_ratio > 3 or aspect_ratio < 0.33:
                return False, {'aspect_ratio': 'failed'}, "Weird aspect ratio"
            
            # Check 3: Blur detection
            blur_score = self._detect_blur(image_path)
            if blur_score > self.max_blur_score:
                return False, {'blur': blur_score}, "Image too blurry"
            
            # Check 4: Contrast (avoid washed out images)
            contrast_score = self._calculate_contrast(image)
            if contrast_score < self.min_contrast:
                return False, {'contrast': contrast_score}, "Low contrast"
            
            # Passed all checks!
            scores = {
                'resolution': f"{width}x{height}",
                'aspect_ratio': round(aspect_ratio, 2),
                'blur_score': round(blur_score, 3),
                'contrast_score': round(contrast_score, 3)
            }
            
            return True, scores, "Quality check passed"
            
        except Exception as e:
            return False, {}, f"Error: {str(e)}"
    
    def _detect_blur(self, image_path):
        """Laplacian blur detection"""
        try:
            img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
            if img is None:
                return 1.0  # Assume blurry if can't read
            
            laplacian = cv2.Laplacian(img, cv2.CV_64F)
            variance = laplacian.var()
            
            # Normalize (higher = sharper)
            # Invert so high score = blurry
            blur_score = 1.0 / (1.0 + variance / 100)
            return blur_score
            
        except:
            return 1.0
    
    def _calculate_contrast(self, image):
        """Calculate image contrast"""
        try:
            # Convert to grayscale
            grayscale = image.convert('L')
            stat = ImageStat.Stat(grayscale)
            
            # Standard deviation / mean
            contrast = stat.stddev[0] / (stat.mean[0] + 1e-5)
            return contrast
            
        except:
            return 0.0
