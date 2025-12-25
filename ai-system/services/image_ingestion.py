"""
PRODUCTION IMAGE INGESTION PIPELINE
Luxury-grade, fully automated, zero manual work
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from models.clip_processor import CLIPProcessorService
from services.quality_filter import QualityFilter
from services.aesthetic_scorer import AestheticScorer
from services.auto_categorizer import AutoCategorizer
from config.settings import *

from PIL import Image
import pymongo
from datetime import datetime
import hashlib

class ProductionImagePipeline:
    """
    Professional image processing pipeline
    Like Pinterest/ASOS backend
    """
    
    def __init__(self):
        print("\n" + "="*60)
        print("🚀 INITIALIZING PRODUCTION AI PIPELINE")
        print("="*60)
        
        # Load CLIP
        print("📦 Loading CLIP model...")
        self.clip_service = CLIPProcessorService()
        print("✅ CLIP loaded")
        
        # Initialize services
        print("🔧 Initializing AI services...")
        self.quality_filter = QualityFilter(QUALITY_CONFIG)
        self.aesthetic_scorer = AestheticScorer(
            self.clip_service.model,
            self.clip_service.processor
        )
        self.categorizer = AutoCategorizer(
            self.clip_service.model,
            self.clip_service.processor,
            CATEGORIZATION_CONFIG
        )
        print("✅ All services ready")
        
        # MongoDB
        print("🗄️  Connecting to MongoDB...")
        self.client = pymongo.MongoClient("mongodb://localhost:27017/")
        self.db = self.client["glammate"]
        self.collection = self.db["luxury_outfits"]
        print("✅ Database connected")
        
        print("="*60)
        print("🎉 PIPELINE READY - ZERO MANUAL WORK NEEDED")
        print("="*60 + "\n")
    
    def process_image(self, image_path):
        """
        Process single image through full pipeline
        Returns: (success: bool, result: dict)
        """
        try:
            print(f"📸 Processing: {image_path.name}")
            
            # Step 1: Quality Filter
            passed, quality_scores, reason = self.quality_filter.check_quality(image_path)
            if not passed:
                print(f"   ❌ Quality check failed: {reason}")
                return False, {'reason': reason, 'stage': 'quality_filter'}
            
            print(f"   ✅ Quality check passed")
            
            # Step 2: Load image
            image = Image.open(image_path).convert('RGB')
            
            # Step 3: Aesthetic scoring
            aesthetic_score = self.aesthetic_scorer.score_aesthetics(image)
            if aesthetic_score < QUALITY_CONFIG['min_aesthetic_score']:
                print(f"   ❌ Aesthetic score too low: {aesthetic_score}")
                return False, {'reason': 'low_aesthetic', 'score': aesthetic_score}
            
            print(f"   ✅ Aesthetic score: {aesthetic_score}")
            
            # Step 4: Auto-categorization
            categorization = self.categorizer.categorize(image)
            print(f"   🏷️  Category: {categorization['primary_category']} ({categorization['confidence']:.2f})")
            print(f"   ✨ Style: {categorization['style']} ({categorization['style_confidence']:.2f})")
            
            # Step 5: Generate CLIP embedding
            embedding = self.clip_service.get_image_embedding(image)
            print(f"   🧠 Embedding generated: {len(embedding)} dimensions")
            
            # Step 6: Advanced attribute detection
            attributes = self.clip_service.classify_fashion_attributes(image)
            print(f"   🎨 Colors: {', '.join(attributes['colors'][:3])}")
            print(f"   📅 Occasions: {', '.join(attributes['occasions'][:3])}")
            
            # Step 7: Create unique ID
            # UPDATED: Now uses 2-enhanced folder path
            relative_path = f"curated-outfits/1-downloaded/{image_path.name}"
            outfit_id = hashlib.md5(relative_path.encode()).hexdigest()
            
            # Step 8: Check if already exists (smart deduplication)
            existing = self.collection.find_one({"outfit_id": outfit_id})
            if existing:
                print(f"   ⏭️  Already in database (skipping)")
                return False, {'reason': 'already_exists'}
            
            # Step 9: Build document (ALL AI-GENERATED!)
            document = {
                "outfit_id": outfit_id,
                "filename": image_path.name,
                "image_path": relative_path,
                
                # Quality metrics (AI-scored)
                "quality": {
                    "aesthetic_score": aesthetic_score,
                    **quality_scores
                },
                
                # Categorization (AI-decided)
                "category": {
                    "primary": categorization['primary_category'],
                    "confidence": categorization['confidence'],
                    "multi": categorization.get('multi_categories', {})
                },
                
                # Style (AI-detected)
                "style": {
                    "primary": categorization['style'],
                    "confidence": categorization['style_confidence'],
                    "all_scores": categorization.get('all_styles', {})
                },
                
                # AI embedding
                "embedding_vector": embedding.tolist(),
                
                # Attributes (AI-detected)
                "attributes": {
                    "occasions": attributes['occasions'],
                    "colors": attributes['colors'],
                    "season": attributes['season'],
                    "formality": attributes['formality'],
                    "confidence": attributes['confidence_scores']
                },
                
                # Search optimization
                "search_tags": list(set(
                    [categorization['primary_category']] +
                    attributes['occasions'] +
                    [categorization['style']]
                )),
                
                # Recommendation engine data
                "recommendation": {
                    "feature_vector": embedding.tolist()[:128],  # Compressed
                    "style_signature": {
                        "styles": categorization.get('all_styles', {}),
                        "categories": categorization.get('all_categories', {})
                    }
                },
                
                # Engagement (for future personalization)
                "engagement": {
                    "views": 0,
                    "likes": 0,
                    "saves": 0,
                    "clicks": 0,
                    "shares": 0
                },
                
                # Metadata
                "source": "curated_luxury",
                "processed_date": datetime.now(),
                "pipeline_version": "1.0_production"
            }
            
            # Step 10: Save to MongoDB
            self.collection.insert_one(document)
            
            print(f"   💾 Saved to database")
            print(f"   ✅ SUCCESS\n")
            
            return True, document
            
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}\n")
            return False, {'error': str(e)}
    
    def process_folder(self, folder_path):
        """Process all images in a folder"""
        folder = Path(folder_path)
        
        if not folder.exists():
            print(f"❌ Folder not found: {folder}")
            return
        
        # Get all images (multiple extensions)
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
        image_files = []
        for ext in image_extensions:
            image_files.extend(folder.glob(ext))
        
        if not image_files:
            print(f"⚠️  No images found in {folder}")
            return
        
        print(f"\n📂 Found {len(image_files)} images in {folder.name}")
        print(f"🚀 Starting AI processing...\n")
        
        stats = {
            'total': len(image_files),
            'success': 0,
            'skipped': 0,
            'failed': 0,
            'reasons': {}
        }
        
        for img_path in image_files:
            success, result = self.process_image(img_path)
            
            if success:
                stats['success'] += 1
            else:
                reason = result.get('reason', 'unknown')
                
                if reason == 'already_exists':
                    stats['skipped'] += 1
                else:
                    stats['failed'] += 1
                
                stats['reasons'][reason] = stats['reasons'].get(reason, 0) + 1
        
        # Summary
        print("\n" + "="*60)
        print("🎉 PROCESSING COMPLETE")
        print("="*60)
        print(f"📊 Total images: {stats['total']}")
        print(f"✅ Successfully processed: {stats['success']}")
        print(f"⏭️  Already in database: {stats['skipped']}")
        print(f"❌ Failed quality checks: {stats['failed']}")
        
        if stats['reasons']:
            print("\n📋 Breakdown:")
            for reason, count in sorted(stats['reasons'].items()):
                emoji = "✅" if reason == "already_exists" else "❌"
                print(f"   {emoji} {reason}: {count}")
        
        print("\n💾 Database stats:")
        total_in_db = self.collection.count_documents({})
        print(f"   Total luxury outfits: {total_in_db}")
        
        # Category breakdown
        pipeline = [
            {"$group": {"_id": "$category.primary", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        category_counts = list(self.collection.aggregate(pipeline))
        
        if category_counts:
            print(f"\n   📊 By category:")
            for cat in category_counts:
                print(f"      {cat['_id']}: {cat['count']}")
        
        print("="*60 + "\n")
