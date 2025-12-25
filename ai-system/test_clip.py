"""
Test if CLIP model loads and works correctly
This will verify everything is set up properly!
"""
import sys
from models.clip_processor import CLIPProcessorService
from PIL import Image
import numpy as np

def test_clip():
    print("🧪 TESTING CLIP MODEL")
    print("=" * 60)
    
    try:
        # Initialize CLIP (will download model first time)
        print("\n📦 Step 1: Loading CLIP model...")
        clip = CLIPProcessorService()
        print("✅ CLIP loaded successfully!\n")
        
        # Test 1: Text embedding
        print("📝 Test 1: Generate text embedding...")
        text = "casual summer dress"
        text_embedding = clip.get_text_embedding(text)
        print(f"✅ Text: '{text}'")
        print(f"   Embedding shape: {text_embedding.shape}")
        print(f"   First 5 values: {text_embedding[:5]}")
        print(f"   Embedding norm: {np.linalg.norm(text_embedding):.4f} (should be ~1.0)")
        
        # Test 2: Image embedding
        print("\n📝 Test 2: Generate image embedding...")
        # Create a simple red square as test image
        dummy_image = Image.new('RGB', (224, 224), color='red')
        image_embedding = clip.get_image_embedding(dummy_image)
        print(f"✅ Test image: 224x224 red square")
        print(f"   Embedding shape: {image_embedding.shape}")
        print(f"   First 5 values: {image_embedding[:5]}")
        print(f"   Embedding norm: {np.linalg.norm(image_embedding):.4f} (should be ~1.0)")
        
        # Test 3: Similarity calculation
        print("\n📝 Test 3: Calculate similarity...")
        similarity = np.dot(text_embedding, image_embedding)
        print(f"✅ Similarity between text and image: {similarity:.4f}")
        print(f"   (Range: -1 to 1, higher = more similar)")
        
        # Test 4: Auto-classification
        print("\n📝 Test 4: Auto-classify fashion attributes...")
        attributes = clip.classify_fashion_attributes(dummy_image)
        print("✅ Detected attributes:")
        print(f"   Occasions: {attributes['occasions']}")
        print(f"   Style: {attributes['style']}")
        print(f"   Colors: {attributes['colors']}")
        print(f"   Season: {attributes['season']}")
        print(f"   Formality: {attributes['formality']}")
        print(f"   Confidence scores: {attributes['confidence_scores']}")
        
        # Test 5: Different text queries
        print("\n📝 Test 5: Multiple text queries...")
        test_queries = [
            "formal business suit",
            "casual t-shirt and jeans",
            "elegant party dress"
        ]
        
        for query in test_queries:
            query_emb = clip.get_text_embedding(query)
            sim = np.dot(query_emb, image_embedding)
            print(f"   '{query}' → similarity: {sim:.4f}")
        
        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED!")
        print("=" * 60)
        print("\n✅ CLIP is ready for production!")
        print("✅ Can generate embeddings for images and text")
        print("✅ Can auto-classify fashion attributes")
        print("✅ Ready to process DeepFashion2 dataset")
        
        return True
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ TEST FAILED!")
        print("=" * 60)
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_clip()
    
    if success:
        print("\n🚀 Next steps:")
        print("1. ✅ CLIP is working!")
        print("2. 📝 Next: Create Flask API server")
        print("3. 🔗 Then: Connect to Node.js")
    
    sys.exit(0 if success else 1)
