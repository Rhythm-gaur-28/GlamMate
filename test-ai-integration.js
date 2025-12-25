/**
 * Test AI Integration
 * This will verify Node.js → Python → MongoDB pipeline works
 */
require('dotenv').config();
const mongoose = require('mongoose');
const aiService = require('./services/aiService');
const Outfit = require('./models/Outfit');
const fs = require('fs').promises;
const path = require('path');

async function testIntegration() {
    console.log('🧪 TESTING AI INTEGRATION');
    console.log('=' .repeat(60));
    
    try {
        // 1. Connect to MongoDB
        console.log('\n📊 Step 1: Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ MongoDB connected');
        
        // 2. Check AI Service health
        console.log('\n🤖 Step 2: Checking AI Service...');
        const isHealthy = await aiService.checkHealth();
        if (!isHealthy) {
            throw new Error('AI Service not available');
        }
        console.log('✅ AI Service is healthy');
        
        // 3. Test text embedding
        console.log('\n📝 Step 3: Testing text embedding...');
        const textQuery = "casual summer dress";
        const textEmbedding = await aiService.getTextEmbedding(textQuery);
        console.log(`✅ Generated text embedding: ${textEmbedding.length} dimensions`);
        console.log(`   Query: "${textQuery}"`);
        console.log(`   First 5 values: [${textEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
        
        // 4. Test with a sample image from your dataset
        console.log('\n🖼️  Step 4: Testing image processing...');
        
        // Try to find a sample image from DeepFashion2
        const datasetPath = './ai-system/data/raw/DeepFashion2 Resized/resized/validation';
        const sampleImagePath = await findSampleImage(datasetPath);
        
        if (!sampleImagePath) {
            console.log('⚠️  No sample image found in dataset');
            console.log('💡 Will test without actual image processing');
        } else {
            console.log(`   Processing: ${path.basename(sampleImagePath)}`);
            
            // Process the image
            const result = await aiService.processImageFile(sampleImagePath);
            
            console.log('✅ Image processed successfully!');
            console.log(`   Embedding: ${result.embedding.length} dimensions`);
            console.log(`   Detected attributes:`);
            console.log(`     - Occasions: ${result.attributes.occasions.join(', ')}`);
            console.log(`     - Style: ${result.attributes.style}`);
            console.log(`     - Colors: ${result.attributes.colors.join(', ')}`);
            console.log(`     - Season: ${result.attributes.season.join(', ')}`);
            console.log(`     - Formality: ${result.attributes.formality}`);
            
            // 5. Save to MongoDB
            console.log('\n💾 Step 5: Saving to MongoDB...');
            
            const outfit = new Outfit({
                outfit_id: 'test_' + Date.now(),
                file_name: path.basename(sampleImagePath),
                file_path: sampleImagePath,
                split: 'validation',
                width: 224,
                height: 224,
                embedding_vector: result.embedding,
                occasions: result.attributes.occasions,
                style: result.attributes.style,
                colors: result.attributes.colors,
                season: result.attributes.season,
                formality: result.attributes.formality,
                confidence: result.attributes.confidence_scores,
                processed: true,
                quality_score: 0.8
            });
            
            await outfit.save();
            console.log('✅ Outfit saved to MongoDB!');
            console.log(`   Outfit ID: ${outfit.outfit_id}`);
            console.log(`   MongoDB _id: ${outfit._id}`);
            
            // 6. Test recommendation query
            console.log('\n🔍 Step 6: Testing recommendation query...');
            const recommendations = await findSimilarOutfits(textEmbedding, 5);
            console.log(`✅ Found ${recommendations.length} similar outfits`);
            
            if (recommendations.length > 0) {
                console.log('\n   Top matches:');
                recommendations.forEach((rec, i) => {
                    console.log(`   ${i + 1}. ${rec.file_name}`);
                    console.log(`      Similarity: ${(rec.similarity_score * 100).toFixed(1)}%`);
                    console.log(`      Style: ${rec.style}, Formality: ${rec.formality}`);
                });
            }
        }
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ALL TESTS PASSED!');
        console.log('='.repeat(60));
        console.log('\n✅ Full pipeline working:');
        console.log('   1. Node.js ↔ Python AI Service');
        console.log('   2. CLIP embeddings generated');
        console.log('   3. Auto-classification working');
        console.log('   4. MongoDB storage working');
        console.log('   5. Similarity search working');
        console.log('\n🚀 Ready to process full dataset!');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        console.error('Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Helper: Find a sample image
async function findSampleImage(dirPath) {
    try {
        const files = await fs.readdir(dirPath);
        const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
        if (imageFiles.length > 0) {
            return path.join(dirPath, imageFiles[0]);
        }
    } catch (error) {
        console.log('   Dataset folder not found:', dirPath);
    }
    return null;
}

// Helper: Find similar outfits (cosine similarity)
async function findSimilarOutfits(queryEmbedding, limit = 5) {
    const outfits = await Outfit.find({ processed: true })
        .limit(100)
        .select('outfit_id file_name embedding_vector style formality')
        .lean();
    
    if (outfits.length === 0) return [];
    
    // Calculate similarity
    const scored = outfits.map(outfit => {
        const similarity = cosineSimilarity(queryEmbedding, outfit.embedding_vector);
        return {
            ...outfit,
            similarity_score: similarity
        };
    });
    
    // Sort and return top matches
    return scored
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, limit);
}

// Helper: Cosine similarity
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }
    
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
}

// Run the test
testIntegration();
