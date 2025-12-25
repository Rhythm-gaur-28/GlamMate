const fs = require('fs-extra');
const colors = require('colors');
const path = require('path');

class SetupTester {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.warnings = 0;
    }

    async runAllTests() {
        console.log('🧪 GLAMMATE AI - SETUP VERIFICATION'.cyan.bold);
        console.log('===================================='.cyan);
        console.log(`📅 ${new Date().toLocaleString()}`.gray);

        await this.testMainProjectStructure();
        await this.testAIFolders();
        await this.testEnvironment();
        await this.testDependencies();
        await this.testDataset();

        this.showResults();
    }

    async testMainProjectStructure() {
        console.log('\n📁 Testing Main Project Structure...'.yellow);
        
        const mainFolders = ['./models', './routes', './views', './public'];
        
        for (const folder of mainFolders) {
            if (await fs.pathExists(folder)) {
                console.log(`  ✅ ${folder}`.green);
                this.passed++;
            } else {
                console.log(`  ⚠️  Main project folder missing: ${folder}`.yellow);
                this.warnings++;
            }
        }
    }

    async testAIFolders() {
        console.log('\n📁 Testing AI System Structure...'.yellow);
        
        const aiFolders = [
            './ai-system', 
            './ai-system/data', 
            './ai-system/data/raw', 
            './ai-system/data/processed', 
            './ai-system/scripts', 
            './ai-system/services'
        ];

        for (const folder of aiFolders) {
            if (await fs.pathExists(folder)) {
                console.log(`  ✅ ${folder}`.green);
                this.passed++;
            } else {
                console.log(`  ❌ Missing: ${folder}`.red);
                await fs.ensureDir(folder);
                console.log(`    🔧 Created: ${folder}`.blue);
                this.passed++;
            }
        }
    }

    async testEnvironment() {
        console.log('\n🔧 Testing Environment Variables...'.yellow);
        
        require('dotenv').config();
        
        // Test Hugging Face token
        if (process.env.HUGGINGFACE_TOKEN && 
            process.env.HUGGINGFACE_TOKEN !== 'hf_your_token_here' &&
            process.env.HUGGINGFACE_TOKEN.startsWith('hf_')) {
            console.log('  ✅ Hugging Face token is set correctly'.green);
            console.log(`  🔑 Token: hf_****${process.env.HUGGINGFACE_TOKEN.slice(-4)}`.gray);
            this.passed++;
        } else {
            console.log('  ❌ Hugging Face token missing or invalid'.red);
            console.log('  💡 Get token: https://huggingface.co/settings/tokens'.blue);
            this.failed++;
        }

        // Test MongoDB URI
        if (process.env.MONGODB_URI) {
            console.log('  ✅ MongoDB URI is set'.green);
            console.log(`  🗄️  URI: ${process.env.MONGODB_URI}`.gray);
            this.passed++;
        } else {
            console.log('  ❌ MONGODB_URI not set'.red);
            this.failed++;
        }

        // Test AI dataset paths
        const aiPaths = ['AI_DATASET_RAW_PATH', 'AI_DATASET_PROCESSED_PATH'];
        aiPaths.forEach(pathVar => {
            if (process.env[pathVar]) {
                console.log(`  ✅ ${pathVar}: ${process.env[pathVar]}`.green);
            } else {
                console.log(`  ⚠️  ${pathVar} not set (using defaults)`.yellow);
                this.warnings++;
            }
        });
    }

    async testDependencies() {
        console.log('\n📦 Testing Dependencies...'.yellow);
        
        const deps = ['fs-extra', 'colors', 'dotenv', 'mongoose'];
        
        for (const dep of deps) {
            try {
                require(dep);
                console.log(`  ✅ ${dep}`.green);
                this.passed++;
            } catch (error) {
                console.log(`  ❌ ${dep} missing - run npm install`.red);
                this.failed++;
            }
        }

        // Test AI-specific dependencies
        const aiDeps = ['sharp', '@huggingface/inference'];
        for (const dep of aiDeps) {
            try {
                require(dep);
                console.log(`  ✅ ${dep} (AI)`.green);
                this.passed++;
            } catch (error) {
                console.log(`  ❌ ${dep} missing - run npm install ${dep}`.red);
                this.failed++;
            }
        }
    }

    async testDataset() {
        console.log('\n📊 Testing Dataset...'.yellow);
        
        const rawPath = process.env.AI_DATASET_RAW_PATH || './ai-system/data/raw';
        
        if (await fs.pathExists(rawPath)) {
            const items = await fs.readdir(rawPath);
            console.log(`  ✅ Dataset folder exists: ${rawPath}`.green);
            console.log(`  📁 Contains ${items.length} items`.blue);
            
            if (items.length > 0) {
                console.log('  📄 Current contents:'.gray);
                items.slice(0, 5).forEach(item => {
                    console.log(`    - ${item}`.gray);
                });
                if (items.length > 5) {
                    console.log(`    ... and ${items.length - 5} more`.gray);
                }

                // Check for DeepFashion2 folder
                const deepFashionPath = items.find(item => item.includes('DeepFashion2'));
                if (deepFashionPath) {
                    console.log(`  ✅ Found DeepFashion2 dataset: ${deepFashionPath}`.green);
                    this.passed++;
                    
                    // Check for resized folder structure
                    const resizedPath = path.join(rawPath, deepFashionPath, 'resized');
                    if (await fs.pathExists(resizedPath)) {
                        console.log('  ✅ Found resized dataset structure'.green);
                        this.passed++;
                    }
                } else {
                    console.log('  ⚠️  DeepFashion2 dataset not found'.yellow);
                    this.warnings++;
                }

                // Check for ZIP files
                const zipFiles = items.filter(item => item.endsWith('.zip'));
                if (zipFiles.length > 0) {
                    console.log(`  📦 Found ${zipFiles.length} ZIP files - Extract them!`.blue);
                    this.warnings++;
                }
            } else {
                console.log('  ⚠️  Dataset folder empty'.yellow);
                console.log('  💡 Copy dataset from ai-outfit-system/data/raw/'.blue);
                this.warnings++;
            }
        } else {
            console.log('  ❌ Dataset folder not found'.red);
            this.failed++;
        }
    }

    showResults() {
        console.log('\n📊 SETUP RESULTS'.cyan.bold);
        console.log('================='.cyan);
        console.log(`✅ Passed: ${this.passed}`.green);
        console.log(`❌ Failed: ${this.failed}`.red);
        console.log(`⚠️  Warnings: ${this.warnings}`.yellow);

        if (this.failed === 0) {
            console.log('\n🎉 SETUP IS READY!'.green.bold);
            
            console.log('\n📋 NEXT STEPS:'.cyan.bold);
            if (this.warnings === 0) {
                console.log('1. ✅ Everything looks perfect!'.green);
                console.log('2. 🚀 Run: npm run ai:analyze-dataset'.white);
                console.log('3. 🤖 Then: npm run ai:process-embeddings'.white);
            } else {
                console.log('1. ⚠️  Fix warnings if needed'.yellow);
                console.log('2. 🚀 Run: npm run ai:analyze-dataset'.white);
            }
            
        } else {
            console.log('\n❌ Fix these issues first:'.red.bold);
            console.log('1. Run: npm install (for missing dependencies)'.white);
            console.log('2. Update .env file with required variables'.white);
            console.log('3. Run: npm run ai:test-setup again'.white);
        }

        console.log('\n💡 All AI components are integrated into main GlamMate project!'.blue);
    }
}

new SetupTester().runAllTests().catch(console.error);
