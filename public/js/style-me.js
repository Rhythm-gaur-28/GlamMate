/**
 * Style Me Frontend - AI Outfit Generator
 */

let currentOutfits = [];

// Generate outfits based on user prompt
async function generateOutfits() {
    const promptInput = document.getElementById('promptInput');
    const prompt = promptInput.value.trim();

    // Validation
    if (!prompt) {
        showError('Please enter where you\'re going!', 'Tell us about the occasion so we can style you perfectly.');
        return;
    }

    // Show loading state
    showLoading();

    try {
        console.log('🎨 Requesting outfits for:', prompt);

        const response = await fetch('/api/closet/generate-outfits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                maxOutfits: 5
            })
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.message || 'Failed to generate outfits');
        }

        console.log('✅ Received', data.outfits.length, 'outfits');

        currentOutfits = data.outfits;

        if (currentOutfits.length === 0) {
            showError(
                'Not enough items in your closet',
                'Add more clothing items to your closet to get outfit suggestions. You need at least a top, bottom, and shoes.'
            );
            return;
        }

        // Display outfits
        displayOutfits(currentOutfits, prompt);

    } catch (error) {
        console.error('❌ Error generating outfits:', error);
        showError(
            'Something went wrong',
            error.message || 'Please try again or refresh the page.'
        );
    }
}

// Display outfits in the grid
function displayOutfits(outfits, prompt) {
    const outfitsSection = document.getElementById('outfitsSection');
    const outfitsGrid = document.getElementById('outfitsGrid');
    const outfitCount = document.getElementById('outfitCount');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');

    // Hide other states
    loadingState.style.display = 'none';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';

    // Show outfits section
    outfitsSection.style.display = 'block';

    // Update count
    outfitCount.textContent = `Found ${outfits.length} perfect ${outfits.length === 1 ? 'outfit' : 'outfits'} for "${prompt}"`;

    // Clear previous outfits
    outfitsGrid.innerHTML = '';

    // Render each outfit
    outfits.forEach((outfit, index) => {
        const card = createOutfitCard(outfit, index + 1);
        outfitsGrid.appendChild(card);
    });

    // Smooth scroll to outfits
    setTimeout(() => {
        outfitsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Create outfit card HTML element
function createOutfitCard(outfit, number) {
    const card = document.createElement('div');
    card.className = 'outfit-card';
    card.style.animationDelay = `${(number - 1) * 0.1}s`;

    const score = Math.round(outfit.score * 100);

    // Collect all colors from items
    const allColors = new Set();
    outfit.items.forEach(item => {
        if (item.colors) {
            item.colors.forEach(color => allColors.add(color.toLowerCase()));
        }
    });

    // Create items grid
    const itemsHTML = outfit.items.map(item => `
        <div class="outfit-item">
            <img src="${item.imagePath}" alt="${item.name}" loading="lazy">
            <div class="item-label">
                ${item.name}
                <span class="item-category">${item.category}</span>
            </div>
        </div>
    `).join('');

    // Create color dots
    const colorDotsHTML = Array.from(allColors).slice(0, 5).map(color => {
        const colorHex = getColorHex(color);
        return `<div class="color-dot" style="background-color: ${colorHex};" title="${color}"></div>`;
    }).join('');

    card.innerHTML = `
        <div class="outfit-header">
            <div class="outfit-number">Outfit ${number}</div>
            <div class="outfit-score">${score}% Match</div>
        </div>
        <div class="outfit-items">
            ${itemsHTML}
        </div>
        <div class="outfit-footer">
            <div class="outfit-colors">
                <span>Colors:</span>
                ${colorDotsHTML}
            </div>
            <button class="btn-save-outfit" onclick="saveOutfit(${number - 1})">
                Save ❤️
            </button>
        </div>
    `;

    return card;
}

// Get hex color code from color name
function getColorHex(colorName) {
    const colorMap = {
        'red': '#e74c3c', 'blue': '#3498db', 'green': '#2ecc71',
        'yellow': '#f1c40f', 'orange': '#e67e22', 'purple': '#9b59b6',
        'pink': '#ff69b4', 'brown': '#8b4513', 'black': '#000000',
        'white': '#ffffff', 'gray': '#95a5a6', 'grey': '#95a5a6',
        'beige': '#f5f5dc', 'navy': '#000080', 'teal': '#008080',
        'gold': '#ffd700', 'silver': '#c0c0c0', 'maroon': '#800000'
    };

    return colorMap[colorName] || '#d4af37';
}

// Save outfit (placeholder - implement later)
function saveOutfit(index) {
    const outfit = currentOutfits[index];
    console.log('Saving outfit:', outfit);
    
    // TODO: Implement save to favorites
    alert('Outfit saved to favorites! (Feature coming soon)');
}

// Set prompt from quick button
function setPrompt(text) {
    document.getElementById('promptInput').value = text;
    generateOutfits();
}

// Clear prompt
function clearPrompt() {
    document.getElementById('promptInput').value = '';
    document.getElementById('promptInput').focus();
}

// Show loading state
function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('outfitsSection').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
}

// Show error state
function showError(title, message) {
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const errorDetails = document.getElementById('errorDetails');

    errorMessage.textContent = title;
    errorDetails.textContent = message;

    errorState.style.display = 'block';
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('outfitsSection').style.display = 'none';
}

// Enter key to generate
document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('promptInput');
    
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateOutfits();
        }
    });
});
