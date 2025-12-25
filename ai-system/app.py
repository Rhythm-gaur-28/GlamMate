"""
GlamMate AI Service - Flask API
Exposes CLIP model to Node.js via REST endpoints
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from models.clip_processor import CLIPProcessorService
from PIL import Image
import base64
from io import BytesIO
import traceback

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow Node.js (port 3000) to call this service (port 5000)

# Initialize CLIP model once when server starts (stays in memory)
print("🚀 Initializing GlamMate AI Service...")
clip_processor = CLIPProcessorService()
print("✅ AI Service ready!\n")

# ============================================================
# Health Check Endpoint
# ============================================================
@app.route('/health', methods=['GET'])
def health_check():
    """
    Check if AI service is running
    Node.js can call this to verify service is available
    """
    return jsonify({
        "status": "healthy",
        "service": "GlamMate AI",
        "model": "CLIP (openai/clip-vit-base-patch32)",
        "version": "1.0.0"
    })

# ============================================================
# Generate Image Embedding
# ============================================================
@app.route('/generate-embedding', methods=['POST'])
def generate_embedding():
    """
    Generate CLIP embedding from image
    
    Request body:
    {
        "image": "base64_encoded_image_string"
    }
    
    Response:
    {
        "success": true,
        "embedding": [0.123, -0.456, ...],  # 512 dimensions
        "dimension": 512
    }
    """
    try:
        # Get image from request
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'image' field in request"
            }), 400
        
        # Decode base64 image
        image_data = data['image']
        
        # Handle data URL format (data:image/jpeg;base64,...)
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes)).convert('RGB')
        
        # Generate embedding using CLIP
        embedding = clip_processor.get_image_embedding(image)
        
        return jsonify({
            "success": True,
            "embedding": embedding.tolist(),
            "dimension": len(embedding)
        })
        
    except Exception as e:
        print(f"❌ Error in generate-embedding: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ============================================================
# Auto-Classify Fashion Attributes
# ============================================================
@app.route('/classify-attributes', methods=['POST'])
def classify_attributes():
    """
    Automatically extract fashion metadata from image
    NO MANUAL TAGGING REQUIRED!
    
    Request body:
    {
        "image": "base64_encoded_image_string"
    }
    
    Response:
    {
        "success": true,
        "attributes": {
            "occasions": ["casual", "party"],
            "style": "trendy",
            "colors": ["blue", "white"],
            "season": ["summer", "spring"],
            "formality": "casual",
            "confidence_scores": {...}
        }
    }
    """
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'image' field in request"
            }), 400
        
        # Decode image
        image_data = data['image']
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes)).convert('RGB')
        
        # Auto-classify using CLIP
        attributes = clip_processor.classify_fashion_attributes(image)
        
        return jsonify({
            "success": True,
            "attributes": attributes
        })
        
    except Exception as e:
        print(f"❌ Error in classify-attributes: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ============================================================
# Generate Text Query Embedding
# ============================================================
@app.route('/text-embedding', methods=['POST'])
def text_embedding():
    """
    Generate embedding from text query
    Used for semantic search: "casual party outfit for summer"
    
    Request body:
    {
        "text": "casual summer dress"
    }
    
    Response:
    {
        "success": true,
        "embedding": [0.123, -0.456, ...],  # 512 dimensions
        "dimension": 512
    }
    """
    try:
        data = request.get_json()
        
        if 'text' not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'text' field in request"
            }), 400
        
        text_query = data['text']
        
        # Generate text embedding
        embedding = clip_processor.get_text_embedding(text_query)
        
        return jsonify({
            "success": True,
            "embedding": embedding.tolist(),
            "dimension": len(embedding),
            "query": text_query
        })
        
    except Exception as e:
        print(f"❌ Error in text-embedding: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ============================================================
# Batch Processing (Optional - for dataset processing)
# ============================================================
@app.route('/batch-classify', methods=['POST'])
def batch_classify():
    """
    Process multiple images at once (more efficient)
    Used when processing dataset
    """
    try:
        data = request.get_json()
        
        if 'images' not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'images' field"
            }), 400
        
        results = []
        
        for idx, image_data in enumerate(data['images']):
            try:
                if 'base64,' in image_data:
                    image_data = image_data.split('base64,')[1]
                
                image_bytes = base64.b64decode(image_data)
                image = Image.open(BytesIO(image_bytes)).convert('RGB')
                
                # Generate both embedding and attributes
                embedding = clip_processor.get_image_embedding(image)
                attributes = clip_processor.classify_fashion_attributes(image)
                
                results.append({
                    "index": idx,
                    "success": True,
                    "embedding": embedding.tolist(),
                    "attributes": attributes
                })
                
            except Exception as e:
                results.append({
                    "index": idx,
                    "success": False,
                    "error": str(e)
                })
        
        return jsonify({
            "success": True,
            "results": results,
            "total": len(data['images']),
            "processed": sum(1 for r in results if r['success'])
        })
        
    except Exception as e:
        print(f"❌ Error in batch-classify: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ============================================================
# Start Flask Server
# ============================================================
if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🚀 GLAMMATE AI SERVICE STARTING")
    print("=" * 60)
    print("📍 Server: http://localhost:5000")
    print("🤖 Model: CLIP (openai/clip-vit-base-patch32)")
    print("🔗 Ready to accept requests from Node.js")
    print("\n💡 Available endpoints:")
    print("   GET  /health                  - Health check")
    print("   POST /generate-embedding      - Image → embedding")
    print("   POST /classify-attributes     - Image → metadata")
    print("   POST /text-embedding          - Text → embedding")
    print("   POST /batch-classify          - Multiple images")
    print("\n" + "=" * 60)
    print("Press CTRL+C to stop\n")
    
    # Run Flask server
    app.run(
        host='0.0.0.0',  # Accept connections from Node.js
        port=5000,
        debug=True,       # Show detailed errors
        use_reloader=False  # Don't reload (CLIP already in memory)
    )
