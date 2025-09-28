// Global variables
let currentStep = 1;
let uploadedImages = [];
let currentImageIndex = 0;
let selectedFilter = '';
let imageFilters = {}; // Store filter for each image

// DOM elements
const fileInput = document.getElementById('fileInput');
const dragDropArea = document.getElementById('dragDropArea');
const imagesGrid = document.getElementById('imagesGrid');
const stepContents = document.querySelectorAll('.step-content');
const stepIndicators = document.querySelectorAll('.step');
const progressFill = document.querySelector('.progress-fill');
const backBtn = document.querySelector('.back-btn');
const nextBtn = document.querySelector('.next-btn');
const stepTitle = document.querySelector('.step-title');
const mainFilterImage = document.getElementById('mainFilterImage');
const finalPreviewImage = document.getElementById('finalPreviewImage');
const captionTextarea = document.getElementById('caption');
const charCount = document.querySelector('.char-count');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Step titles
const stepTitles = [
    'Create new post',
    'Choose filters', 
    'Write caption'
];

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing...');
    initializeEventListeners();
    updateUI();
});

function initializeEventListeners() {
    console.log('Initializing event listeners...');
    
    // File input
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
        console.log('File input listener added');
    }

    // Drag drop area click
    if (dragDropArea) {
        dragDropArea.addEventListener('click', function(e) {
            if (e.target === dragDropArea || e.target.closest('.upload-icon') || e.target.closest('h3') || e.target.closest('p')) {
                e.preventDefault();
                e.stopPropagation();
                selectFiles();
            }
        });
        
        dragDropArea.addEventListener('dragover', handleDragOver);
        dragDropArea.addEventListener('dragleave', handleDragLeave);
        dragDropArea.addEventListener('drop', handleFileDrop);
    }

    // Select button
    const selectBtn = document.querySelector('.select-btn');
    if (selectBtn) {
        selectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Select button clicked');
            selectFiles();
        });
        console.log('Select button listener added');
    }

    // Navigation buttons
    if (backBtn) {
        backBtn.addEventListener('click', goBack);
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', nextStep);
    }

    // FIXED: Image navigation arrows
    const prevImageBtn = document.querySelector('.prev-image');
    const nextImageBtn = document.querySelector('.next-image');
    
    if (prevImageBtn) {
        prevImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            previousImage();
        });
        console.log('Previous image button listener added');
    }
    
    if (nextImageBtn) {
        nextImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            nextImage();
        });
        console.log('Next image button listener added');
    }

    // Filter selection
    document.addEventListener('click', function (e) {
        if (e.target.closest('.filter-item')) {
            selectFilter(e.target.closest('.filter-item'));
        }
    });

    // Caption character count
    if (captionTextarea) {
        captionTextarea.addEventListener('input', updateCharCount);
    }

    // Form submission
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', handleFormSubmit);
    }

    // Prevent default drag behaviors
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
}

// File handling functions (unchanged)
function handleFileSelect(e) {
    console.log('File select triggered, files:', e.target.files.length);
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        processFiles(files);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    dragDropArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    if (!dragDropArea.contains(e.relatedTarget)) {
        dragDropArea.classList.remove('dragover');
    }
}

function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dragDropArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    console.log('Files dropped:', files.length);
    processFiles(files);
}

function processFiles(files) {
    console.log('Processing files:', files.length);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
        showToast('Please select only image files!');
        return;
    }

    // Limit to 10 images total
    const remainingSlots = 10 - uploadedImages.length;
    if (imageFiles.length > remainingSlots) {
        showToast(`You can only upload ${remainingSlots} more image(s). Maximum 10 images allowed.`);
        imageFiles.splice(remainingSlots);
    }

    let processedCount = 0;
    const totalFiles = imageFiles.length;

    imageFiles.forEach(file => {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            showToast('Each image must be less than 10MB');
            processedCount++;
            if (processedCount === totalFiles) {
                renderImagesGrid();
                updateUI();
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const imageId = Date.now() + Math.random();
            const imageData = {
                id: imageId,
                src: e.target.result,
                file: file
            };
            uploadedImages.push(imageData);
            // Initialize with no filter
            imageFilters[imageId] = '';
            processedCount++;
            
            console.log(`Processed ${processedCount}/${totalFiles} images`);
            
            if (processedCount === totalFiles) {
                renderImagesGrid();
                updateUI();
            }
        };
        reader.readAsDataURL(file);
    });

    // Clear the file input to allow re-selection of same files
    fileInput.value = '';
}

function renderImagesGrid() {
    console.log('Rendering images grid, total images:', uploadedImages.length);
    
    if (uploadedImages.length === 0) {
        imagesGrid.style.display = 'none';
        dragDropArea.style.display = 'flex';
        return;
    }

    dragDropArea.style.display = 'none';
    imagesGrid.style.display = 'grid';
    imagesGrid.innerHTML = '';

    uploadedImages.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = `
            <img src="${image.src}" alt="Upload ${index + 1}">
            <button type="button" class="remove-btn" onclick="removeImage(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        imagesGrid.appendChild(imageItem);
    });

    if (uploadedImages.length < 10) {
        const addMoreBtn = document.createElement('div');
        addMoreBtn.className = 'add-more-btn';
        addMoreBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addMoreBtn.onclick = selectFiles;
        imagesGrid.appendChild(addMoreBtn);
    }
}

function removeImage(index) {
    console.log('Removing image at index:', index);
    const removedImage = uploadedImages[index];
    
    // Remove from imageFilters as well
    if (removedImage && removedImage.id) {
        delete imageFilters[removedImage.id];
    }
    
    uploadedImages.splice(index, 1);

    if (uploadedImages.length === 0) {
        imagesGrid.style.display = 'none';
        dragDropArea.style.display = 'flex';
        imageFilters = {};
    } else {
        renderImagesGrid();
    }

    updateUI();

    // Adjust current image index if needed
    if (currentImageIndex >= uploadedImages.length && uploadedImages.length > 0) {
        currentImageIndex = uploadedImages.length - 1;
    }

    if (currentStep === 2 && uploadedImages.length > 0) {
        updateFilterPreview();
    }
}

function selectFiles() {
    console.log('selectFiles called');
    if (fileInput) {
        fileInput.value = '';
        fileInput.click();
        console.log('File input clicked');
    } else {
        console.error('File input not found!');
    }
}

// Navigation functions
function updateUI() {
    console.log('Updating UI for step:', currentStep);
    
    stepIndicators.forEach((step, index) => {
        step.classList.toggle('active', index + 1 <= currentStep);
    });

    progressFill.style.width = `${(currentStep / 3) * 100}%`;
    stepTitle.textContent = stepTitles[currentStep - 1];

    stepContents.forEach((content, index) => {
        const shouldShow = index + 1 === currentStep;
        content.classList.toggle('active', shouldShow);
        
        if (shouldShow) {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    });

    backBtn.disabled = currentStep === 1;

    if (currentStep === 1) {
        nextBtn.disabled = uploadedImages.length === 0;
        nextBtn.textContent = 'Next';
    } else if (currentStep === 2) {
        nextBtn.disabled = false;
        nextBtn.textContent = 'Next';
    } else if (currentStep === 3) {
        nextBtn.disabled = false;
        nextBtn.textContent = 'Share';
    }
}

function nextStep() {
    console.log('Next step called, current step:', currentStep);
    
    if (currentStep === 1) {
        if (uploadedImages.length === 0) {
            showToast('Please add at least one image before proceeding!');
            return;
        }
        currentStep = 2;
        console.log('Moving to step 2 (filters)');
        setupFilterStep();
        updateUI();
    } else if (currentStep === 2) {
        currentStep = 3;
        console.log('Moving to step 3 (caption)');
        setupCaptionStep();
        updateUI();
    } else if (currentStep === 3) {
        console.log('Submitting post');
        submitPost();
        return;
    }
}

function goBack() {
    if (currentStep > 1) {
        currentStep--;
        console.log('Going back to step:', currentStep);
        updateUI();
    }
}

// FIXED Filter step functions
function setupFilterStep() {
    console.log('Setting up filter step');
    if (uploadedImages.length === 0) return;

    currentImageIndex = 0;
    updateFilterPreview();
    updateImageNavigation();
}

function updateFilterPreview() {
    console.log('Updating filter preview for image index:', currentImageIndex);
    if (uploadedImages.length === 0) return;

    const currentImage = uploadedImages[currentImageIndex];
    if (mainFilterImage) {
        mainFilterImage.src = currentImage.src;
        // Apply the saved filter for this image
        const savedFilter = imageFilters[currentImage.id] || '';
        mainFilterImage.style.filter = savedFilter;
        selectedFilter = savedFilter;
    }

    // Update image counter
    const currentIndexEl = document.getElementById('currentImageIndex');
    const totalImagesEl = document.getElementById('totalImages');
    if (currentIndexEl) currentIndexEl.textContent = currentImageIndex + 1;
    if (totalImagesEl) totalImagesEl.textContent = uploadedImages.length;

    // Update filter previews
    const filterPreviews = document.querySelectorAll('.filter-preview');
    filterPreviews.forEach(preview => {
        preview.src = currentImage.src;
    });

    // Update filter selection UI
    updateFilterSelectionUI();

    // Update navigation visibility
    updateImageNavigation();
}

function updateFilterSelectionUI() {
    const currentImage = uploadedImages[currentImageIndex];
    const currentImageFilter = imageFilters[currentImage.id] || '';
    
    // Update active filter
    document.querySelectorAll('.filter-item').forEach(item => {
        const filterValue = item.dataset.filter || '';
        item.classList.toggle('active', filterValue === currentImageFilter);
    });
}

function updateImageNavigation() {
    const prevBtn = document.querySelector('.prev-image');
    const nextBtn = document.querySelector('.next-image');
    const imagePreviewContainer = document.querySelector('.image-preview-container');

    if (uploadedImages.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (imagePreviewContainer) imagePreviewContainer.classList.remove('multiple-images');
    } else {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
        if (imagePreviewContainer) imagePreviewContainer.classList.add('multiple-images');
    }
}

// FIXED: Image navigation functions
function previousImage() {
    console.log('Previous image clicked, current index:', currentImageIndex);
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updateFilterPreview();
        console.log('Moved to image index:', currentImageIndex);
    }
}

function nextImage() {
    console.log('Next image clicked, current index:', currentImageIndex);
    if (currentImageIndex < uploadedImages.length - 1) {
        currentImageIndex++;
        updateFilterPreview();
        console.log('Moved to image index:', currentImageIndex);
    }
}

// FIXED: Filter selection with per-image storage
function selectFilter(filterElement) {
    const filterValue = filterElement.dataset.filter || '';
    console.log('Filter selected:', filterValue, 'for image index:', currentImageIndex);
    
    // Remove active class from all filters
    document.querySelectorAll('.filter-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to selected filter
    filterElement.classList.add('active');

    // Update selected filter
    selectedFilter = filterValue;

    // Store filter for current image
    const currentImage = uploadedImages[currentImageIndex];
    if (currentImage) {
        imageFilters[currentImage.id] = filterValue;
        console.log('Saved filter for image:', currentImage.id, 'filter:', filterValue);
    }

    // Apply filter to main image
    if (mainFilterImage) {
        mainFilterImage.style.filter = filterValue;
    }

    // Update hidden input with current filter (for backward compatibility)
    const selectedFilterInput = document.getElementById('selectedFilter');
    if (selectedFilterInput) {
        selectedFilterInput.value = filterValue;
    }
}

// Caption step functions
function setupCaptionStep() {
    console.log('Setting up caption step');
    if (uploadedImages.length === 0) return;

    // Show first image with applied filter
    const firstImage = uploadedImages[0];
    if (finalPreviewImage && firstImage) {
        finalPreviewImage.src = firstImage.src;
        const firstImageFilter = imageFilters[firstImage.id] || '';
        finalPreviewImage.style.filter = firstImageFilter;
    }
}

function updateCharCount() {
    if (!captionTextarea || !charCount) return;
    
    const current = captionTextarea.value.length;
    const max = 2200;
    charCount.textContent = `${current}/${max}`;

    if (current > max * 0.9) {
        charCount.style.color = '#ff4757';
    } else {
        charCount.style.color = '#666';
    }
}

// Form submission
function handleFormSubmit(e) {
    e.preventDefault();
    submitPost();
}

// FIXED: Submit post with individual image filters
function submitPost() {
    console.log('Submitting post with filters:', imageFilters);
    if (uploadedImages.length === 0) {
        showToast('Please add at least one image!');
        return;
    }

    // Show loading state
    nextBtn.innerHTML = '<span class="loading"></span> Sharing...';
    nextBtn.disabled = true;

    // Create hidden inputs for images with filters applied
    const hiddenInputs = document.getElementById('hiddenInputs');
    if (hiddenInputs) {
        hiddenInputs.innerHTML = '';

        uploadedImages.forEach((image, index) => {
            // For each image, apply its filter and create canvas to get filtered image data
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Apply filter to canvas context
                const filter = imageFilters[image.id] || '';
                if (filter) {
                    ctx.filter = filter;
                }
                
                ctx.drawImage(img, 0, 0);
                
                // Get filtered image data
                const filteredImageData = canvas.toDataURL('image/jpeg', 0.9);
                
                // Create hidden input
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'images';
                input.value = filteredImageData;
                hiddenInputs.appendChild(input);
                
                // Check if all images are processed
                if (hiddenInputs.children.length === uploadedImages.length) {
                    // Submit the form
                    const postForm = document.getElementById('postForm');
                    if (postForm) {
                        postForm.submit();
                    }
                }
            };
            
            img.src = image.src;
        });
    }
}

// Utility functions
function showToast(message) {
    if (toastMessage) {
        toastMessage.textContent = message;
    }
    if (toast) {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
window.selectFiles = selectFiles;
window.removeImage = removeImage;
window.goBack = goBack;
window.nextStep = nextStep;
window.previousImage = previousImage;
window.nextImage = nextImage;

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' && currentStep === 2) {
        previousImage();
    } else if (e.key === 'ArrowRight' && currentStep === 2) {
        nextImage();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && currentStep === 3) {
        submitPost();
    }
});

// Debug function
window.debugAddPost = function() {
    console.log('=== DEBUG INFO ===');
    console.log('Current step:', currentStep);
    console.log('Uploaded images:', uploadedImages.length);
    console.log('Current image index:', currentImageIndex);
    console.log('Image filters:', imageFilters);
    console.log('File input exists:', !!fileInput);
    console.log('Navigation buttons exist:', {
        prev: !!document.querySelector('.prev-image'),
        next: !!document.querySelector('.next-image')
    });
    console.log('==================');
};
