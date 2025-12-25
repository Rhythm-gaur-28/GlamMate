const fs = require('fs-extra');
const path = require('path');
const colors = require('colors');

class DatasetAnalyzer {
    constructor() {
        this.stats = {
            totalImages: 0,
            totalSize: 0,
            categories: {},
            fileTypes: {},
            sampleImages: [],
            errors: []
        };
        // Updated path for integrated structure
        this.datasetPath = process.env.AI_DATASET_RAW_PATH || './ai-system/data/raw';
    }

    async analyzeDataset() {
        console.log('🔍 GLAMMATE AI - DATASET ANALYSIS'.cyan.bold);
        console.log('=================================='.cyan);
        console.log(`📅 ${new Date().toLocaleString()}`.gray);
        console.log(`📂 Analyzing: ${this.datasetPath}`.blue);

        try {
            await this.scanDirectory(this.datasetPath);
            await this.generateReport();
            await this.saveReport();
        } catch (error) {
            console.error('❌ Analysis failed:'.red, error.message);
        }
    }

    async scanDirectory(dirPath, parentCategory = '') {
        console.log(`\n📁 Scanning: ${dirPath}`.yellow);
        
        try {
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = await fs.stat(itemPath);
                
                if (stats.isDirectory()) {
                    console.log(`  📂 Found directory: ${item}`.blue);
                    
                    // Recursively scan subdirectories
                    const category = parentCategory ? `${parentCategory}/${item}` : item;
                    await this.scanDirectory(itemPath, category);
                    
                } else if (this.isImageFile(item)) {
                    // Process image file
                    await this.processImageFile(itemPath, item, parentCategory, stats);
                } else {
                    // Process other files (JSON, CSV, etc.)
                    await this.processOtherFile(itemPath, item, stats);
                }
            }
        } catch (error) {
            this.stats.errors.push(`Error scanning ${dirPath}: ${error.message}`);
            console.error(`  ❌ Error: ${error.message}`.red);
        }
    }

    async processImageFile(filePath, fileName, category, stats) {
        try {
            // Count image
            this.stats.totalImages++;
            this.stats.totalSize += stats.size;
            
            // Track by category
            const cat = category || 'root';
            this.stats.categories[cat] = (this.stats.categories[cat] || 0) + 1;
            
            // Track by file type
            const ext = path.extname(fileName).toLowerCase();
            this.stats.fileTypes[ext] = (this.stats.fileTypes[ext] || 0) + 1;
            
            // Store sample images (first 10)
            if (this.stats.sampleImages.length < 10) {
                this.stats.sampleImages.push({
                    name: fileName,
                    path: filePath,
                    category: cat,
                    size: this.formatFileSize(stats.size),
                    extension: ext
                });
            }
            
            // Progress indicator
            if (this.stats.totalImages % 1000 === 0) {
                console.log(`  📊 Processed ${this.stats.totalImages} images...`.gray);
            }
            
        } catch (error) {
            this.stats.errors.push(`Error processing ${fileName}: ${error.message}`);
        }
    }

    async processOtherFile(filePath, fileName, stats) {
        const ext = path.extname(fileName).toLowerCase();
        
        // Track metadata files
        if (['.json', '.csv', '.txt', '.md'].includes(ext)) {
            console.log(`  📄 Metadata file: ${fileName} (${this.formatFileSize(stats.size)})`.gray);
            
            // Try to read and analyze metadata files
            if (ext === '.json' && stats.size < 10 * 1024 * 1024) { // Under 10MB
                try {
                    const content = await fs.readJson(filePath);
                    console.log(`    📋 JSON keys: ${Object.keys(content).slice(0, 5).join(', ')}`.gray);
                } catch (e) {
                    // Ignore read errors for now
                }
            }
        }
    }

    isImageFile(fileName) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'];
        return imageExtensions.includes(path.extname(fileName).toLowerCase());
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async generateReport() {
        console.log('\n📊 ANALYSIS RESULTS'.cyan.bold);
        console.log('==================='.cyan);
        
        // Basic stats
        console.log(`📸 Total Images: ${this.stats.totalImages.toLocaleString()}`.green);
        console.log(`💾 Total Size: ${this.formatFileSize(this.stats.totalSize)}`.green);
        console.log(`📂 Categories Found: ${Object.keys(this.stats.categories).length}`.green);
        
        // Categories breakdown
        if (Object.keys(this.stats.categories).length > 0) {
            console.log('\n📂 Images by Category:'.yellow);
            const sortedCategories = Object.entries(this.stats.categories)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);
                
            sortedCategories.forEach(([category, count]) => {
                const percentage = ((count / this.stats.totalImages) * 100).toFixed(1);
                console.log(`  ${category}: ${count.toLocaleString()} (${percentage}%)`.white);
            });
        }
        
        // File types
        if (Object.keys(this.stats.fileTypes).length > 0) {
            console.log('\n📄 File Types:'.yellow);
            Object.entries(this.stats.fileTypes).forEach(([type, count]) => {
                console.log(`  ${type}: ${count.toLocaleString()}`.white);
            });
        }
        
        // Sample images
        if (this.stats.sampleImages.length > 0) {
            console.log('\n🖼️  Sample Images:'.yellow);
            this.stats.sampleImages.slice(0, 5).forEach(img => {
                console.log(`  ${img.name} - ${img.category} - ${img.size}`.gray);
            });
        }
        
        // Errors
        if (this.stats.errors.length > 0) {
            console.log('\n⚠️  Errors Encountered:'.red);
            this.stats.errors.slice(0, 5).forEach(error => {
                console.log(`  ${error}`.red);
            });
            if (this.stats.errors.length > 5) {
                console.log(`  ... and ${this.stats.errors.length - 5} more errors`.red);
            }
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:'.cyan.bold);
        
        if (this.stats.totalImages > 10000) {
            console.log('✅ Large dataset detected - perfect for AI training'.green);
        } else if (this.stats.totalImages > 1000) {
            console.log('✅ Good dataset size for development'.green);
        } else {
            console.log('⚠️  Small dataset - may need more data for production'.yellow);
        }
        
        if (Object.keys(this.stats.categories).length > 5) {
            console.log('✅ Good category diversity detected'.green);
        }
        
        if (this.stats.errors.length === 0) {
            console.log('✅ No errors found - clean dataset'.green);
        }
    }

    async saveReport() {
        const reportPath = './ai-system/data/dataset_analysis_report.json';
        
        const report = {
            timestamp: new Date().toISOString(),
            dataset_path: this.datasetPath,
            stats: this.stats,
            summary: {
                total_images: this.stats.totalImages,
                total_size_mb: Math.round(this.stats.totalSize / 1024 / 1024),
                categories_count: Object.keys(this.stats.categories).length,
                file_types: Object.keys(this.stats.fileTypes),
                has_errors: this.stats.errors.length > 0,
                ready_for_processing: this.stats.totalImages > 100 && this.stats.errors.length === 0
            }
        };
        
        await fs.writeJson(reportPath, report, { spaces: 2 });
        console.log(`\n📄 Report saved to: ${reportPath}`.blue);
        
        // Next steps
        console.log('\n🚀 NEXT STEPS:'.cyan.bold);
        if (report.summary.ready_for_processing) {
            console.log('1. ✅ Dataset is ready for processing!'.green);
            console.log('2. 🤖 Next: Run npm run ai:process-embeddings'.white);
            console.log('3. 🗄️  Monitor progress in MongoDB Compass'.white);
        } else {
            console.log('1. ⚠️  Dataset needs more preparation'.yellow);
            console.log('2. 📋 Check the report for issues to fix'.white);
        }
    }
}

// Run the analyzer
if (require.main === module) {
    require('dotenv').config();
    const analyzer = new DatasetAnalyzer();
    analyzer.analyzeDataset().catch(console.error);
}

module.exports = DatasetAnalyzer;
