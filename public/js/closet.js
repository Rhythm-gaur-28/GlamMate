let currentFilters = {};
let currentEditingItem = null;

// Load items on page load
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    setupEventListeners();
});

function setupEventListeners() {
    // Search input with debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = e.target.value.trim();
            loadItems();
        }, 500);
    });

    // Filter dropdowns
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
        loadItems();
    });

    document.getElementById('seasonFilter').addEventListener('change', (e) => {
        currentFilters.season = e.target.value;
        loadItems();
    });

    // Add form submit
    document.getElementById('addItemForm').addEventListener('submit', handleAddItem);
}
// Image upload preview
const uploadBox = document.getElementById('uploadBox');
const imageInput = document.getElementById('imageInput');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const imagePreview = document.getElementById('imagePreview');

if (uploadBox && imageInput) {
    // Click to upload
    uploadBox.addEventListener('click', () => {
        imageInput.click();
    });

    // File input change
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            previewImage(file);
        }
    });

    // Drag and drop
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('drag-over');
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('drag-over');
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            imageInput.files = e.dataTransfer.files;
            previewImage(file);
        }
    });
}

function previewImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function resetUploadPreview() {
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    uploadPlaceholder.style.display = 'flex';
    imageInput.value = '';
}

async function loadItems() {
    const grid = document.getElementById('itemsGrid');
    const emptyState = document.getElementById('emptyState');
    
    grid.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
        const params = new URLSearchParams();
        Object.keys(currentFilters).forEach(key => {
            if (currentFilters[key] && currentFilters[key] !== 'all') {
                params.append(key, currentFilters[key]);
            }
        });

        const response = await fetch(`/api/closet/items?${params}`);
        const data = await response.json();

        if (!data.ok) throw new Error(data.message);

        if (data.items.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        grid.innerHTML = data.items.map(item => createItemCard(item)).join('');
    } catch (error) {
        console.error('Load items error:', error);
        grid.innerHTML = '<div class="error">Failed to load items</div>';
    }
}

function createItemCard(item) {
    const colors = item.colors && item.colors.length > 0 ? item.colors.join(', ') : 'N/A';
    const occasions = item.occasion && item.occasion.length > 0 ? item.occasion.join(', ') : 'N/A';
    
    return `
        <div class="item-card" data-id="${item._id}">
            <div class="item-image">
                <img src="${item.imagePath}" alt="${item.name}" loading="lazy">
            </div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <p class="item-meta">
                    <span class="category">${item.category}</span>
                    ${item.brand ? `<span class="brand">${item.brand}</span>` : ''}
                </p>
                <p class="item-details">
                    <span>🎨 ${colors}</span>
                    <span>📅 ${occasions}</span>
                </p>
                ${item.price ? `<p class="item-price">₹${item.price}</p>` : ''}
                <div class="item-actions">
                    <button class="btn-edit" onclick="openEditModal('${item._id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteItem('${item._id}')">Delete</button>
                </div>
            </div>
        </div>
    `;
}

async function handleAddItem(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
        const response = await fetch('/api/closet/items', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!data.ok) throw new Error(data.message);

        closeAddModal();
        form.reset();
        loadItems();
        showNotification('Item added successfully!', 'success');
    } catch (error) {
        console.error('Add item error:', error);
        showNotification(error.message || 'Failed to add item', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add to Closet';
    }
}

async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const response = await fetch(`/api/closet/items/${itemId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!data.ok) throw new Error(data.message);

        loadItems();
        showNotification('Item deleted', 'success');
    } catch (error) {
        console.error('Delete error:', error);
        showNotification(error.message || 'Failed to delete item', 'error');
    }
}

function openAddModal() {
    document.getElementById('addModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAddModal() {
    document.getElementById('addModal').classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('addItemForm').reset();
    resetUploadPreview(); // Add this line
}


function openEditModal(itemId) {
    // Implement edit functionality
    alert('Edit modal coming soon! For now, delete and re-add the item.');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    document.body.style.overflow = '';
}

function resetFilters() {
    currentFilters = {};
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('seasonFilter').value = 'all';
    loadItems();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
