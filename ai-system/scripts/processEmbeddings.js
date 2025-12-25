require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const colors = require('colors');

const Outfit = require('../../models/Outfit');
const embeddingService = require('../services/embeddingService');

// SMART LIMITS - Process only best images
const SMART_LIMITS = {
    validation: 2000,  // Instead of 32K
    test: 3000,        // Instead of 62K  
    train: 5000       // Instead of 191K
};

const DATASET_ROOT = path.join(
    process.env.AI_DATASET_RAW_PATH || './ai-system/data/raw', 
    'DeepFashion2 Resized', 
    'resized'
);

class SmartEmbeddingProcessor {
    constructor() {
        this.stats = {
            processed: 0,
            skipped: 0,
            failed: 0,
            total: 0
        };
    }

    generateOutfitId(filePath) {
        return crypto.createHash('md5').update(filePath).digest('hex');
    }

    async connectToDatabase() {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB'.green);
            await Outfit.init();
            console.log('✅ Outfit collection ready'.green);
        } catch (error) {
            console.error('❌ Database connection failed:'.red, error.message);
            throw error;
        }
    }

    async getTopQualityImages(splitPath, limit) {
        const files = await fs.readdir(splitPath);
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
        
        // Sort by filename (DeepFashion2 has better quality images with certain patterns)
        const sortedFiles = imageFiles.sort().slice(0, limit);
        
        console.log(`  📸 Selected ${sortedFiles.length} best images from ${imageFiles.length} total`.blue);
        return sortedFiles;
    }

    async processImage(filePath, fileName, split) {
        const outfitId = this.generateOutfitId(filePath);
        
        try {
            // Check if already processed
            const existing = await Outfit.findOne({ outfit_id: outfitId });
            if (existing) {
                this.stats.skipped++;
                return { success: true, skipped: true };
            }

            // Read and resize image
            const imageBuffer = await sharp(filePath)
                .resize(224, 224, { fit: 'cover' })
                .jpeg({ quality: 90 })
                .toBuffer();

            // Generate embedding
            const embedding = await embeddingService.generateEmbedding(imageBuffer);

            // Get image metadata
            const metadata = await sharp(filePath).metadata();

            // Create outfit record with basic attributes
            const outfit = new Outfit({
                outfit_id: outfitId,
                split: split,
                file_name: fileName,
                file_path: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
                width: metadata.width,
                height: metadata.height,
                embedding_vector: embedding,
                
                // Basic fashion attributes (we'll enhance these)
                category: this.inferCategory(fileName),
                occasions: this.inferOccasions(fileName),
                formality: this.inferFormality(fileName),
                
                processed: true
            });

            await outfit.save();
            this.stats.processed++;
            
            return { success: true, skipped: false };

        } catch (error) {
            this.stats.failed++;
            console.error(`  ❌ Failed: ${fileName}`.red, error.message);
            return { success: false, error: error.message };
        }
    }

    // Simple inference based on filename patterns (we'll improve this)
    inferCategory(fileName) {
        const name = fileName.toLowerCase();
        if (name.includes('dress')) return 'dress';
        if (name.includes('shirt') || name.includes('top')) return 'top';
        if (name.includes('pant') || name.includes('jean')) return 'bottom';
        if (name.includes('skirt')) return 'skirt';
        return 'unknown';
    }

    inferOccasions(fileName) {
        const name = fileName.toLowerCase();
        const occasions = [];
        if (name.includes('formal')) occasions.push('work', 'formal');
        if (name.includes('casual')) occasions.push('casual', 'weekend');
        if (name.includes('party')) occasions.push('party', 'night-out');
        return occasions.length > 0 ? occasions : ['casual'];
    }

    inferFormality(fileName) {
        const name = fileName.toLowerCase();
        if (name.includes('formal') || name.includes('suit')) return 'formal';
        if (name.includes('party') || name.includes('dress')) return 'semi-formal';
        return 'casual';
    }

    async processSplit(split) {
        const splitPath = path.join(DATASET_ROOT, split);
        
        if (!await fs.pathExists(splitPath)) {
            console.warn(`⚠️  Split not found: ${splitPath}`.yellow);
            return;
        }

        const limit = SMART_LIMITS[split];
        const imageFiles = await this.getTopQualityImages(splitPath, limit);
        
        console.log(`\n📂 Processing split: ${split}`.cyan);
        console.log(`📸 Processing ${imageFiles.length} images (limited for smart start)`.blue);

        this.stats.total += imageFiles.length;

        for (let i = 0; i < imageFiles.length; i++) {
            const fileName = imageFiles[i];
            const filePath = path.join(splitPath, fileName);
            
            await this.processImage(filePath, fileName, split);

            // Progress indicator
            if ((i + 1) % 50 === 0 || (i + 1) === imageFiles.length) {
                const progress = ((i + 1) / imageFiles.length * 100).toFixed(1);
                console.log(`    📊 ${split}: ${i + 1}/${imageFiles.length} (${progress}%) | ✅${this.stats.processed} 📄${this.stats.skipped} ❌${this.stats.failed}`.gray);
            }
        }
    }

    async run() {
        console.log('🚀 SMART AI PROCESSOR - MVP VERSION'.cyan.bold);
        console.log('====================================='.cyan);
        console.log('🎯 Processing 10,000 best images for quick start'.blue);
        console.log(`📂 Dataset: ${DATASET_ROOT}`.blue);

        try {
            await this.connectToDatabase();
            
            const connectionOk = await embeddingService.testConnection();
            if (!connectionOk) {
                throw new Error('Embedding service failed');
            }

            // Process splits in order of size (smallest first)
            for (const split of ['validation', 'test', 'train']) {
                await this.processSplit(split);
            }

            console.log('\n🎉 SMART PROCESSING COMPLETE!'.green.bold);
            console.log('=============================='.green);
            console.log(`📊 Results:`.cyan);
            console.log(`  ✅ Processed: ${this.stats.processed}`.green);
            console.log(`  📄 Skipped: ${this.stats.skipped}`.yellow);
            console.log(`  ❌ Failed: ${this.stats.failed}`.red);
            
            const successRate = ((this.stats.processed / (this.stats.processed + this.stats.failed)) * 100).toFixed(1);
            console.log(`  📈 Success Rate: ${successRate}%`.cyan);

            console.log('\n🚀 NEXT STEPS:'.cyan.bold);
            console.log('1. ✅ Check MongoDB for outfit documents'.white);
            console.log('2. 🎨 Build the beautiful UI/UX'.white);
            console.log('3. 🛒 Add shopping links integration'.white);
            console.log('4. 📈 Scale up with more images later'.white);

        } catch (error) {
            console.error('💥 Processing failed:'.red.bold, error.message);
            process.exit(1);
        } finally {
            await mongoose.disconnect();
            console.log('👋 Disconnected from database'.blue);
        }
    }
}

if (require.main === module) {
    const processor = new SmartEmbeddingProcessor();
    processor.run().catch(console.error);
}

module.exports = SmartEmbeddingProcessor;
