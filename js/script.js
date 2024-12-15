//region Variables
const controls = document.querySelector('.controls');
const imageInput = document.getElementById('imageInput');
const tileSizeSlider = document.getElementById('tileSize');
const pixelatedToggle = document.getElementById('pixelated');
const previewContainer = document.getElementById('previewContainer');
const darkModeToggle = document.getElementById('darkMode');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const imageSizeSlider = document.getElementById('imageSize');
const multiplierModeToggle = document.getElementById('multiplierMode');
const colourSensitivitySlider = document.getElementById('colourSensitivity');
const showHideToggle = document.getElementById('hidebar');

let currentImage = null;

let currentImageDimensions = {
    width: 0,
    height: 0,
};

const fileInputContainer = document.querySelector('.file-input-container');
const contextMenu = document.querySelector('.context-menu');
const pasteImageButton = document.getElementById('pasteImage');

const primaryColorInput = document.getElementById('colour1');
const secondaryColorInput = document.getElementById('colour2');
const accentColorInput = document.getElementById('colour3');

const targetPrimaryColorInput = document.getElementById('targetColour1');
const targetSecondaryColorInput = document.getElementById('targetColour2');
const targetAccentColorInput = document.getElementById('targetColour3');
//endregion

//region Functions
function handleFile(file) {
    if (file && file.type.startsWith('image/')) {
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImage = e.target.result;
            const image = new Image();
            image.src = currentImage;
            image.onload = () => {
                currentImageDimensions.width = image.width;
                currentImageDimensions.height = image.height;
                recolourImage();
            };
        };
        reader.readAsDataURL(file);
    }
}

function updatePixelated() {
    if (pixelatedToggle.checked) {
        previewContainer.classList.add('pixelated');
    } else {
        previewContainer.classList.remove('pixelated');
    }
}

function updateTheme() {
    document.documentElement.setAttribute(
        'data-theme',
        darkModeToggle.checked ? 'dark' : 'light'
    );
}

function recolourImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.src = currentImage;

    const primaryColorTarget = hexToRgb(targetPrimaryColorInput.value);
    const secondaryColorTarget = hexToRgb(targetSecondaryColorInput.value);
    const accentColorTarget = hexToRgb(targetAccentColorInput.value);

    image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const primaryColor = hexToRgb(primaryColorInput.value);
        let secondaryColor = hexToRgb(secondaryColorInput.value);
        const accentColor = hexToRgb(accentColorInput.value);

        if (multiplierModeToggle.checked) {
            secondaryColor = primaryColor.map(value => Math.round(value * 0.85));
        }

        const sensitivity = colourSensitivitySlider.value;

        for (let i = 0; i < data.length; i += 4) {
            if (isTargetColor(data, i, primaryColorTarget, sensitivity)) {
                setColor(data, i, primaryColor);
            } else if (isTargetColor(data, i, secondaryColorTarget, sensitivity)) {
                setColor(data, i, secondaryColor);
            } else if (isTargetColor(data, i, accentColorTarget, sensitivity)) {
                setColor(data, i, accentColor);
            }
        }

        ctx.putImageData(imageData, 0, 0);

        const originalImageWrapper = document.createElement('div');
        originalImageWrapper.classList.add('image-wrapper', 'original');
        const originalImage = new Image();
        originalImage.src = currentImage;
        originalImageWrapper.appendChild(originalImage);

        const recolouredImageWrapper = document.createElement('div');
        recolouredImageWrapper.classList.add('image-wrapper', 'recoloured');
        const recolouredImage = new Image();
        recolouredImage.src = canvas.toDataURL();
        recolouredImageWrapper.appendChild(recolouredImage);

        previewContainer.innerHTML = '';
        previewContainer.appendChild(originalImageWrapper);
        previewContainer.appendChild(recolouredImageWrapper);
    };
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function isTargetColor(data, index, targetColor, sensitivity) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];

    return (
        Math.abs(r - targetColor[0]) <= sensitivity &&
        Math.abs(g - targetColor[1]) <= sensitivity &&
        Math.abs(b - targetColor[2]) <= sensitivity
    );
}

function setColor(data, index, color) {
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
}

function updateMultiplierMode() {
    secondaryColorInput.disabled = multiplierModeToggle.checked;
    recolourImage();
}

function defaultImageSize() {
    // document.getElementById("imageSize").value = (window.innerWidth / 2) * 0.45;
    imageSizeSlider.value = window.innerWidth / 2 * 0.45;
    updateImageSize();
}

function updateImageSize() {
    const scale = imageSizeSlider.value / 100;
    document.documentElement.style.setProperty('--image-scale', scale);
}
//endregion

//region Event Listeners
// Load saved preferences
darkModeToggle.checked = localStorage.getItem('darkMode') === 'true';
pixelatedToggle.checked = localStorage.getItem('pixelated') === 'true';
updateTheme();
updatePixelated();

darkModeToggle.addEventListener('change', () => {
    localStorage.setItem('darkMode', darkModeToggle.checked);
    updateTheme();
});

pixelatedToggle.addEventListener('change', () => {
    localStorage.setItem('pixelated', pixelatedToggle.checked);
    updatePixelated();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    } else {
        fileNameDisplay.textContent = 'Choose Image';
    }
});

// Add drag and drop event listeners
fileInputContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileInputContainer.classList.add('drag-over');
});

fileInputContainer.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileInputContainer.classList.remove('drag-over');
});

fileInputContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    fileInputContainer.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
        handleFile(file);
    }
});

// Prevent default context menu and show custom menu
fileInputContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
});

// Hide context menu when clicking outside
document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
});

// Handle paste from context menu
pasteImageButton.addEventListener('click', async () => {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    const file = new File([blob], 'pasted-image.png', { type });
                    handleFile(file);
                    break;
                }
            }
        }
    } catch (err) {
        console.error('Failed to paste image:', err);
    }
});

// Add keyboard shortcut for paste
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'v') {
        pasteImageButton.click();
    }
});

// tileSizeSlider.addEventListener('input', updateTileSize);
pixelatedToggle.addEventListener('change', updatePixelated);
primaryColorInput.addEventListener('input', recolourImage);
secondaryColorInput.addEventListener('input', recolourImage);
accentColorInput.addEventListener('input', recolourImage);
targetPrimaryColorInput.addEventListener('input', recolourImage);
targetSecondaryColorInput.addEventListener('input', recolourImage);
targetAccentColorInput.addEventListener('input', recolourImage);
multiplierModeToggle.addEventListener('change', updateMultiplierMode);
colourSensitivitySlider.addEventListener('input', recolourImage);
// window.addEventListener('resize', updateTileImage);

imageSizeSlider.addEventListener('input', updateImageSize);
defaultImageSize();

showHideToggle.addEventListener('click', () => {
    // add/remove .hidden class from the controls
    controls.classList.toggle('folded');
    // update the data-tooltip attribute
    showHideToggle.setAttribute('data-tooltip', controls.classList.contains('folded') ? 'Show Controls' : 'Hide Controls');
});

previewContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    imageSizeSlider.value = Math.min(Math.max(parseInt(imageSizeSlider.value) - delta * 10, 10), 2000);
    updateImageSize();
});
//endregion
