const axios = require('axios');
const fs = require('fs').promises;

class AIService {
    constructor() {
        this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
        this.isHealthy = false;
        
        // Test connection on startup
        this.checkHealth();
    }
    
    /**
     * Check if Python AI service is running
     */
    async checkHealth() {
        try {
            const response = await axios.get(`${this.baseURL}/health`, {
                timeout: 5000
            });
            
            if (response.data.status === 'healthy') {
                this.isHealthy = true;
                console.log('✅ AI Service connected:', response.data.model);
                return true;
            }
        } catch (error) {
            this.isHealthy = false;
            console.error('❌ AI Service not available:', error.message);
            console.log('💡 Make sure Python Flask server is running on port 5000');
            return false;
        }
    }
    
    /**
     * Generate CLIP embedding from image buffer
     * @param {Buffer} imageBuffer - Image file buffer
     * @returns {Array} 512-dimensional embedding
     */
    async generateEmbedding(imageBuffer) {
        try {
            if (!this.isHealthy) {
                await this.checkHealth();
                if (!this.isHealthy) {
                    throw new Error('AI Service not available');
                }
            }
            
            // Convert buffer to base64
            const base64Image = imageBuffer.toString('base64');
            
            const response = await axios.post(
                `${this.baseURL}/generate-embedding`,
                { image: base64Image },
                { timeout: 30000 }  // 30 seconds timeout
            );
            
            if (response.data.success) {
                console.log(`✅ Generated embedding: ${response.data.dimension}d`);
                return response.data.embedding;
            } else {
                throw new Error(response.data.error || 'Failed to generate embedding');
            }
            
        } catch (error) {
            console.error('❌ Error generating embedding:', error.message);
            throw error;
        }
    }
    
    /**
     * Auto-classify fashion attributes from image
     * @param {Buffer} imageBuffer - Image file buffer
     * @returns {Object} Fashion attributes (occasions, style, colors, etc.)
     */
    async classifyAttributes(imageBuffer) {
        try {
            if (!this.isHealthy) {
                await this.checkHealth();
            }
            
            const base64Image = imageBuffer.toString('base64');
            
            const response = await axios.post(
                `${this.baseURL}/classify-attributes`,
                { image: base64Image },
                { timeout: 30000 }
            );
            
            if (response.data.success) {
                console.log('✅ Classified attributes:', response.data.attributes);
                return response.data.attributes;
            } else {
                throw new Error(response.data.error || 'Failed to classify');
            }
            
        } catch (error) {
            console.error('❌ Error classifying attributes:', error.message);
            throw error;
        }
    }
    
    /**
     * Generate text embedding for search query
     * @param {String} text - Search query like "casual summer dress"
     * @returns {Array} 512-dimensional embedding
     */
    async getTextEmbedding(text) {
        try {
            if (!this.isHealthy) {
                await this.checkHealth();
            }
            
            const response = await axios.post(
                `${this.baseURL}/text-embedding`,
                { text },
                { timeout: 10000 }
            );
            
            if (response.data.success) {
                console.log(`✅ Generated text embedding for: "${text}"`);
                return response.data.embedding;
            } else {
                throw new Error(response.data.error || 'Failed to generate text embedding');
            }
            
        } catch (error) {
            console.error('❌ Error generating text embedding:', error.message);
            throw error;
        }
    }
    
    /**
     * Process image file and get both embedding + attributes
     * @param {String} imagePath - Path to image file
     * @returns {Object} { embedding, attributes }
     */
    async processImageFile(imagePath) {
        try {
            // Read image file
            const imageBuffer = await fs.readFile(imagePath);
            
            // Get both embedding and attributes (parallel for speed)
            const [embedding, attributes] = await Promise.all([
                this.generateEmbedding(imageBuffer),
                this.classifyAttributes(imageBuffer)
            ]);
            
            return { embedding, attributes };
            
        } catch (error) {
            console.error(`❌ Error processing ${imagePath}:`, error.message);
            throw error;
        }
    }
}

// Singleton instance
module.exports = new AIService();
