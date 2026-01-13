const galleryView = document.getElementById('gallery-view');
const gameView = document.getElementById('game-view');
const galleryGrid = document.getElementById('gallery-grid');
const puzzleContainer = document.getElementById('puzzle-container');
const backBtn = document.getElementById('back-btn');
const refreshBtn = document.getElementById('refresh-btn');
const statusText = document.getElementById('status-text');

let currentImage = '';
let isGameActive = false;

// Config
const COLS = 5;
const ROWS = 6;

// Init
document.addEventListener('DOMContentLoaded', () => {
    fetchImages();
    
    backBtn.addEventListener('click', showGallery);
    refreshBtn.addEventListener('click', fetchImages);
});

// Fetch Images from Lorem Picsum
async function fetchImages() {
    try {
        galleryGrid.innerHTML = '<p>読み込み中...</p>';
        // Fetch list of 100 images from a random page to ensure variety
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const response = await fetch(`https://picsum.photos/v2/list?page=${randomPage}&limit=100`);
        const data = await response.json();
        
        // Shuffle and select 10
        shuffleArray(data);
        const selectedImages = data.slice(0, 10);

        renderGallery(selectedImages);
    } catch (error) {
        console.error('Error fetching images:', error);
        galleryGrid.innerHTML = '<p>画像の読み込みに失敗しました。</p>';
    }
}

// Render Gallery
function renderGallery(images) {
    galleryGrid.innerHTML = '';
    images.forEach(img => {
        const item = document.createElement('div');
        item.classList.add('gallery-item');
        
        // Use a high-res url with correct aspect ratio
        // Original images can be any size, we force 500x600 for thumbnails to match ratio
        // IDs are reliable from Lorem Picsum
        const thumbUrl = `https://picsum.photos/id/${img.id}/500/600`;
        
        item.style.backgroundImage = `url("${thumbUrl}")`;
        item.dataset.fullUrl = `https://picsum.photos/id/${img.id}/1200/1440`; // Retina ready (2x for 600px width)
        
        item.addEventListener('click', () => {
            startGame(item.dataset.fullUrl);
        });
        
        galleryGrid.appendChild(item);
    });
}

// Switch Views
function showGallery() {
    isGameActive = false;
    galleryView.classList.add('active');
    galleryView.classList.remove('hidden');
    gameView.classList.add('hidden');
    gameView.classList.remove('active');
    puzzleContainer.innerHTML = ''; // Cleanup
    puzzleContainer.classList.remove('solved');
}

function showGame() {
    galleryView.classList.add('hidden');
    galleryView.classList.remove('active');
    gameView.classList.add('active');
    gameView.classList.remove('hidden');
}

// Start Game
function startGame(imageUrl) {
    currentImage = imageUrl;
    isGameActive = true;
    showGame();
    createPuzzle(imageUrl);
}

// Create Puzzle
function createPuzzle(url) {
    puzzleContainer.innerHTML = '';
    puzzleContainer.classList.remove('solved');
    statusText.textContent = "ドラッグして入れ替え";

    const totalPieces = COLS * ROWS;
    const pieces = [];

    // Create indices
    for (let i = 0; i < totalPieces; i++) {
        pieces.push(i);
    }

    // Shuffle
    shuffleArray(pieces);

    // Create DOM elements
    pieces.forEach((correctIndex, currentIndex) => {
        const piece = document.createElement('div');
        piece.classList.add('puzzle-piece');
        piece.draggable = true;
        
        // Store data
        piece.dataset.correctIndex = correctIndex;
        // The current visual position is implied by DOM order, 
        // but for checking logic we might just read the DOM children order.

        // Set Image
        piece.style.backgroundImage = `url("${url}")`;
        
        // Calculate Background Position based on CORRECT index
        const row = Math.floor(correctIndex / COLS);
        const col = correctIndex % COLS;
        
        const xPct = col * (100 / (COLS - 1));
        const yPct = row * (100 / (ROWS - 1));
        
        piece.style.backgroundPosition = `${xPct}% ${yPct}%`;

        // Add Events
        addDragEvents(piece);

        puzzleContainer.appendChild(piece);
    });

    updatePieceStates();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Drag & Drop Logic
let draggedSource = null;

function addDragEvents(piece) {
    // Desktop Drag Events
    piece.addEventListener('dragstart', handleDragStart);
    piece.addEventListener('dragover', handleDragOver);
    piece.addEventListener('drop', handleDrop);
    piece.addEventListener('dragenter', handleDragEnter);
    piece.addEventListener('dragleave', handleDragLeave);
    piece.addEventListener('dragend', handleDragEnd);

    // Touch Events
    piece.addEventListener('touchstart', handleTouchStart, {passive: false});
    piece.addEventListener('touchmove', handleTouchMove, {passive: false});
    piece.addEventListener('touchend', handleTouchEnd);
}

// --- Mouse Drag Handlers ---
function handleDragStart(e) {
    if (!isGameActive) return;
    draggedSource = this;
    
    // Defer adding the class so the browser takes a snapshot of the element 
    // BEFORE it becomes semi-transparent/styled as 'dragging'.
    setTimeout(() => {
        this.classList.add('dragging');
    }, 0);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (!isGameActive) return;
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedSource) {
        this.classList.add('over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('over');
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (draggedSource !== this && isGameActive) {
        swapPieces(draggedSource, this);
    }
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    // Cleanup 'over' class from all pieces
    const pieces = document.querySelectorAll('.puzzle-piece');
    pieces.forEach(p => p.classList.remove('over'));
    
    checkWin();
}

// --- Touch Handlers (Custom implementation) ---
let touchStartElem = null;

function handleTouchStart(e) {
    if (!isGameActive) return;
    // Prevent scrolling
    e.preventDefault(); 
    touchStartElem = this;
    this.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!isGameActive) return;
    e.preventDefault();
    
    // Optional: Visual feedback of dragging could be improved here by moving a clone,
    // but for now we rely on the 'dragging' class styling.
    
    // Highlight element under finger
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Clear previous 'over' states
    document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('over'));
    
    if (target && target.classList.contains('puzzle-piece') && target !== touchStartElem) {
        target.classList.add('over');
    }
}

function handleTouchEnd(e) {
    if (!isGameActive) return;
    
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    
    touchStartElem.classList.remove('dragging');
    document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('over'));

    if (target && target.classList.contains('puzzle-piece') && target !== touchStartElem) {
        swapPieces(touchStartElem, target);
        checkWin();
    }
    
    touchStartElem = null;
}

// Swap Logic
function swapPieces(elem1, elem2) {
    // Visual swap in DOM
    // We can swap by inserting elem1 before elem2, or using a placeholder
    
    const parent = puzzleContainer;
    const idx1 = Array.from(parent.children).indexOf(elem1);
    const idx2 = Array.from(parent.children).indexOf(elem2);
    
    // Simplest way to swap two nodes in a grid without messing up layout flow too much:
    // Clone them? No, we need references.
    // Use a temp marker.
    
    const temp = document.createTextNode('');
    elem1.parentNode.insertBefore(temp, elem1);
    elem2.parentNode.insertBefore(elem1, elem2);
    temp.parentNode.insertBefore(elem2, temp);
    temp.parentNode.removeChild(temp);

    updatePieceStates();
}

function updatePieceStates() {
    const pieces = Array.from(puzzleContainer.children);
    pieces.forEach((piece, index) => {
        const correctIndex = parseInt(piece.dataset.correctIndex);
        if (correctIndex === index) {
            piece.classList.add('correct');
            piece.classList.remove('incorrect');
        } else {
            piece.classList.add('incorrect');
            piece.classList.remove('correct');
        }
    });
}

// Check Win
function checkWin() {
    const pieces = Array.from(puzzleContainer.children);
    let isSolved = true;
    
    for (let i = 0; i < pieces.length; i++) {
        if (parseInt(pieces[i].dataset.correctIndex) !== i) {
            isSolved = false;
            break;
        }
    }
    
    if (isSolved) {
        gameWon();
    }
}

function gameWon() {
    isGameActive = false;
    puzzleContainer.classList.add('solved');
    statusText.textContent = "完成！おめでとう！";
    
    // Confetti
    triggerConfetti();
}

function triggerConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}
