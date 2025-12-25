"""
AI PROCESSING SCRIPT
Standalone - only does AI analysis and MongoDB storage
Reads from 2-enhanced folder
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from services.image_ingestion import ProductionImagePipeline

def main():
    """
    Process enhanced images with AI
    """
    print("\n" + "="*70)
    print("🤖 AI PROCESSING & DATABASE STORAGE")
    print("="*70)
    
    # Initialize AI pipeline
    pipeline = ProductionImagePipeline()
    
    # Path to enhanced images
    enhanced_folder = Path("../curated-outfits/1-downloaded")
    
    # Check if folder exists
    if not enhanced_folder.exists():
        print("\n❌ Enhanced images folder not found!")
        print(f"   Expected: {enhanced_folder}")
        print("\n💡 Run enhancement first:")
        print("   python enhance_images.py")
        return
    
    # Check if has images
    image_files = list(enhanced_folder.glob('*.jpg')) + \
                  list(enhanced_folder.glob('*.jpeg')) + \
                  list(enhanced_folder.glob('*.png'))
    
    if not image_files:
        print("\n❌ No images found in enhanced folder!")
        print(f"   Path: {enhanced_folder}")
        print("\n💡 Run enhancement first:")
        print("   python enhance_images.py")
        return
    
    print(f"\n✅ Found {len(image_files)} original images")
    print(f"🚀 Starting AI processing...\n")
    
    # Process all enhanced images
    pipeline.process_folder(str(enhanced_folder))
    
    print("\n✨ AI processing complete!")
    print("💾 Check MongoDB 'luxury_outfits' collection\n")

if __name__ == "__main__":
    main()
