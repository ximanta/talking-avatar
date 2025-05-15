# Speaking Avatar App

A web-based speaking avatar application that uses Three.js for rendering and Web Speech API for text-to-speech with lip synchronization.

## Features

- 3D avatar with lip-sync animation
- Text-to-speech using Web Speech API
- Phoneme-based mouth animations
- Interactive controls (zoom, pan, rotate)
- Random smile expressions for natural feel

## Prerequisites

- Node.js and npm installed
- Modern web browser that supports Web Speech API

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/speaking-avatar-app.git
cd speaking-avatar-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Click the "Start Conversation" button to begin
2. The avatar will speak the text with synchronized lip movements
3. Use mouse/touch to:
   - Rotate: Click and drag
   - Zoom: Scroll wheel
   - Pan: Right click and drag

## Project Structure

```
speaking-avatar-app/
├── image/              # Avatar image assets
│   ├── closed.png     # Closed mouth
│   ├── small.png      # Small open mouth
│   ├── medium.png     # Medium open mouth
│   ├── round.png      # Round mouth
│   └── smile.png      # Smiling expression
├── index.html         # Main HTML file
├── main.js           # Application logic
└── package.json      # Project configuration
```

## Technologies Used

- Three.js - 3D rendering
- Web Speech API - Text-to-speech
- Vite - Development and building
- ES6+ JavaScript

## License

MIT License - See LICENSE file for details
