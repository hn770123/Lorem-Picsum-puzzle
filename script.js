const galleryView = document.getElementById('gallery-view');
const gameView = document.getElementById('game-view');
const galleryGrid = document.getElementById('gallery-grid');
const puzzleContainer = document.getElementById('puzzle-container');
const backBtn = document.getElementById('back-btn');
const refreshBtn = document.getElementById('refresh-btn');
const statusText = document.getElementById('status-text');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const hintImage = document.getElementById('hint-image');

let currentImage = '';
let isGameActive = false;
let COLS = 4;
let ROWS = 5;

const difficultySettings = {
    easy: { cols: 3, rows: 4 },
    normal: { cols: 4, rows: 5 },
    hard: { cols: 5, rows: 6 }
};

document.addEventListener('DOMContentLoaded', () => {
    fetchImages();

    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const difficulty = button.dataset.difficulty;
            COLS = difficultySettings[difficulty].cols;
            ROWS = difficultySettings[difficulty].rows;
            
            difficultyButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            
            galleryGrid.classList.remove('disabled');
        });
    });
    
    backBtn.addEventListener('click', showGallery);
    refreshBtn.addEventListener('click', fetchImages);
});

async function fetchImages() {
    try {
        galleryGrid.innerHTML = '<p>読み込み中...</p>';
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const response = await fetch(`https://picsum.photos/v2/list?page=${randomPage}&limit=100`);
        const data = await response.json();
        
        shuffleArray(data);
        const selectedImages = data.slice(0, 10);

        renderGallery(selectedImages);
    } catch (error) {
        console.error('Error fetching images:', error);
        galleryGrid.innerHTML = '<p>画像の読み込みに失敗しました。</p>';
    }
}

function renderGallery(images) {
    galleryGrid.innerHTML = '';
    images.forEach(img => {
        const item = document.createElement('div');
        item.classList.add('gallery-item');
        
        const thumbUrl = `https://picsum.photos/id/${img.id}/500/600`;
        
        item.style.backgroundImage = `url("${thumbUrl}")`;
        item.dataset.fullUrl = `https://picsum.photos/id/${img.id}/1200/1440`;
        
        item.addEventListener('click', () => {
            if (!document.querySelector('.difficulty-btn.selected')) {
                alert('最初に難易度を選択してください。');
                return;
            }
            startGame(item.dataset.fullUrl);
        });
        
        galleryGrid.appendChild(item);
    });
}

function showGallery() {
    isGameActive = false;
    galleryView.classList.add('active');
    galleryView.classList.remove('hidden');
    gameView.classList.add('hidden');
    gameView.classList.remove('active');
    puzzleContainer.innerHTML = '';
    puzzleContainer.classList.remove('solved');
}

function showGame() {
    galleryView.classList.add('hidden');
    galleryView.classList.remove('active');
    gameView.classList.add('active');
    gameView.classList.remove('hidden');
}

function startGame(imageUrl) {
    currentImage = imageUrl;
    isGameActive = true;
    hintImage.src = imageUrl;
    showGame();
    createPuzzle(imageUrl);
}

function createPuzzle(url) {
    puzzleContainer.innerHTML = '';
    puzzleContainer.classList.remove('solved');
    statusText.textContent = "ドラッグして入れ替え";
    puzzleContainer.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    puzzleContainer.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

    const totalPieces = COLS * ROWS;
    const pieces = [];

    for (let i = 0; i < totalPieces; i++) {
        pieces.push(i);
    }

    shuffleArray(pieces);

    pieces.forEach((correctIndex, currentIndex) => {
        const piece = document.createElement('div');
        piece.classList.add('puzzle-piece');
        piece.draggable = true;
        
        piece.dataset.correctIndex = correctIndex;

        piece.style.backgroundImage = `url("${url}")`;
        
        const row = Math.floor(correctIndex / COLS);
        const col = correctIndex % COLS;
        
        const xPct = col * (100 / (COLS - 1));
        const yPct = row * (100 / (ROWS - 1));
        
        piece.style.backgroundPosition = `${xPct}% ${yPct}%`;
        piece.style.backgroundSize = `${COLS * 100}% ${ROWS * 100}%`;

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

let draggedSource = null;

function addDragEvents(piece) {
    piece.addEventListener('dragstart', handleDragStart);
    piece.addEventListener('dragover', handleDragOver);
    piece.addEventListener('drop', handleDrop);
    piece.addEventListener('dragenter', handleDragEnter);
    piece.addEventListener('dragleave', handleDragLeave);
    piece.addEventListener('dragend', handleDragEnd);

    piece.addEventListener('touchstart', handleTouchStart, {passive: false});
    piece.addEventListener('touchmove', handleTouchMove, {passive: false});
    piece.addEventListener('touchend', handleTouchEnd);
}

function handleDragStart(e) {
    if (!isGameActive) return;
    draggedSource = this;
    
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
    const pieces = document.querySelectorAll('.puzzle-piece');
    pieces.forEach(p => p.classList.remove('over'));
    
    checkWin();
}

let touchStartElem = null;

function handleTouchStart(e) {
    if (!isGameActive) return;
    e.preventDefault(); 
    touchStartElem = this;
    this.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!isGameActive) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    
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

function swapPieces(elem1, elem2) {
    const parent = puzzleContainer;
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
        const currentCol = index % COLS;
        const currentRow = Math.floor(index / COLS);

        // Reset borders
        piece.classList.remove('no-border-right', 'no-border-bottom');

        // Set correct/incorrect status
        if (correctIndex === index) {
            piece.classList.add('correct');
            piece.classList.remove('incorrect');
        } else {
            piece.classList.add('incorrect');
            piece.classList.remove('correct');
        }

        // Check right neighbor
        if (currentCol < COLS - 1) {
            const rightNeighbor = pieces[index + 1];
            const rightNeighborCorrectIndex = parseInt(rightNeighbor.dataset.correctIndex);
            if (correctIndex + 1 === rightNeighborCorrectIndex && Math.floor(correctIndex / COLS) === Math.floor(rightNeighborCorrectIndex / COLS)) {
                piece.classList.add('no-border-right');
            }
        }

        // Check bottom neighbor
        if (currentRow < ROWS - 1) {
            const bottomNeighbor = pieces[index + COLS];
            const bottomNeighborCorrectIndex = parseInt(bottomNeighbor.dataset.correctIndex);
            if (correctIndex + COLS === bottomNeighborCorrectIndex) {
                piece.classList.add('no-border-bottom');
            }
        }
    });
}

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
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}
