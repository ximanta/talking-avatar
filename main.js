import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Setup scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lighting
const light = new THREE.AmbientLight(0xffffff); // soft white light
scene.add(light);

// Load and create avatar from images
const textureLoader = new THREE.TextureLoader();
const mouthTextures = {
  closed: textureLoader.load('image/closed.png'),
  small: textureLoader.load('image/small.png'),
  medium: textureLoader.load('image/medium.png'),
  round: textureLoader.load('image/round.png'),
  smile: textureLoader.load('image/smile.png')
};

const avatarGeometry = new THREE.PlaneGeometry(2, 2); // Adjust size as needed
const avatarMaterial = new THREE.MeshBasicMaterial({ 
    map: mouthTextures.closed,
    transparent: true
});
const avatar = new THREE.Mesh(avatarGeometry, avatarMaterial);
scene.add(avatar);

camera.position.z = 3;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.enablePan = true;

// Animate loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Trigger LLM + TTS + Mouth animation
async function speak(text) {
  console.log('Starting speech:', text);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Map phonemes to mouth positions
  const getPhonemeTexture = (text) => {
    // Simple phoneme detection based on characters
    const char = text.toLowerCase();
    if ('aeiou'.includes(char)) {
      if ('ao'.includes(char)) return mouthTextures.round;  // Round mouth for O and A sounds
      if ('i'.includes(char)) return mouthTextures.small;   // Small mouth for I sounds
      if ('eu'.includes(char)) return mouthTextures.medium; // Medium mouth for E and U sounds
    }
    return mouthTextures.closed;  // Default to closed mouth for consonants
  };

  let animationTimer = null;
  let isSpeaking = false;

  // Track current character for lip sync
  let currentCharIndex = 0;
  const updateMouth = () => {
    if (!isSpeaking) {
      avatarMaterial.map = mouthTextures.closed;
      return;
    }

    if (currentCharIndex < text.length) {
      const texture = getPhonemeTexture(text[currentCharIndex]);
      avatarMaterial.map = texture;
      currentCharIndex++;
      animationTimer = setTimeout(updateMouth, 100); // Update every 100ms
    } else {
      avatarMaterial.map = mouthTextures.closed;
    }
  };

  utterance.onstart = () => {
    console.log('Speech started');
    isSpeaking = true;
    currentCharIndex = 0;
    updateMouth();
  };

  utterance.onend = () => {
    console.log('Speech ended');
    isSpeaking = false;
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
    avatarMaterial.map = mouthTextures.closed;
  };

  utterance.onboundary = (event) => {
    console.log('Speech boundary:', event.name, event);
    if (event.name === 'word') {
      // Smile occasionally at the end of words
      if (Math.random() < 0.2) { // 20% chance to smile
        avatarMaterial.map = mouthTextures.smile;
        setTimeout(() => {
          avatarMaterial.map = mouthTextures.closed;
        }, 200);
      }
    }
  };

  utterance.onerror = (event) => {
    console.error('Speech error:', event);
  };

  speechSynthesis.cancel(); // Cancel any ongoing speech
  speechSynthesis.speak(utterance);
}

// Example: get LLM response and speak
async function startConversation() {
  console.log('Starting conversation...');
  const llmResponse = "There is also historical mention of a different entity named 1Mind (a social discovery app) having raised $500K in 2013 from investors like 10X Venture Partners and eCoast Angels Network, but this appears unrelated to the current AI-focused 1mind platform.";
  speak(llmResponse);
}

// Wait for everything to load before starting
window.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded');
  const startButton = document.getElementById('startButton');
  startButton.addEventListener('click', () => {
    console.log('Button clicked, starting conversation...');
    startConversation();
  });
});
