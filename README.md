# Photo Puzzle Game

A mobile-friendly photo puzzle game.

## Features
- **Retina Ready**: High-resolution images.
- **Touch Support**: Optimized for mobile drag-and-drop.
- **Confetti**: Visual celebration on win.

## How to Run

Because this project uses `fetch` to get images, it is recommended to run it on a local web server rather than opening `index.html` directly (to avoid CORS/file protocol restrictions in some browsers).

### Option 1: VS Code Live Server
If you are using VS Code, install the "Live Server" extension and click "Go Live".

### Option 2: Python
Run the following command in the project directory:

```bash
python3 -m http.server
```

Then open `http://localhost:8000` in your browser.

### Option 3: Node.js
If you have `npx` installed:

```bash
npx serve
```
