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

// Global state
let isSpeaking = false;

// Load and create avatar from images
const textureLoader = new THREE.TextureLoader();
const mouthTextures = {
  // Base positions
  closed: textureLoader.load('image/closed.png'),
  small: textureLoader.load('image/small.png'),
  medium: textureLoader.load('image/medium.png'),
  round: textureLoader.load('image/round.png'),
  wide: textureLoader.load('image/wide.png'),

  // Expressions
  smile: textureLoader.load('image/smile.png'),
  smile_open: textureLoader.load('image/smile_open.png'),
  pressed: textureLoader.load('image/pressed.png'),
  teeth: textureLoader.load('image/teeth.png'),
  tongue: textureLoader.load('image/tongue.png')
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

  // Enhanced phoneme detection and mapping
  const getPhonemeTexture = (text, prevChar = '', nextChar = '') => {
    const char = text.toLowerCase();
    const combo = (prevChar + char + nextChar).toLowerCase();
    const isEndOfWord = nextChar === ' ' || nextChar === '' || '.!?,;'.includes(nextChar);
    
    // Common phoneme combinations with context
    if (combo.includes('th')) return mouthTextures.tongue;
    if (combo.includes('ch') || combo.includes('sh')) return mouthTextures.small;
    if (combo.includes('ee') || combo.includes('ea')) return mouthTextures.teeth;
    if (combo.includes('oo')) return mouthTextures.round;
    if (combo.includes('oh')) return mouthTextures.round;
    if (combo.includes('ah')) return mouthTextures.wide;
    if (combo.includes('ay')) return mouthTextures.medium;
    
    // Emotion-aware phonemes
    const isHappyWord = /\b(happy|love|nice|good)\b/i.test(combo);
    
    // Single phonemes with context
    if ('aeiou'.includes(char)) {
      if (isHappyWord) return mouthTextures.smile_open;
      if ('a'.includes(char)) return mouthTextures.wide;
      if ('o'.includes(char)) return mouthTextures.round;
      if ('i'.includes(char)) return mouthTextures.teeth;
      if ('e'.includes(char)) return mouthTextures.small;
      if ('u'.includes(char)) return mouthTextures.round;
    }
    
    // Consonant groups with natural movement
    if ('pbm'.includes(char)) return mouthTextures.pressed;
    if ('fv'.includes(char)) return mouthTextures.teeth;
    if ('tdnl'.includes(char)) return mouthTextures.tongue;
    if ('ws'.includes(char)) return mouthTextures.round;
    if ('r'.includes(char)) return mouthTextures.medium;
    
    return mouthTextures.closed;
  };

  let animationTimer = null;
  let lastTexture = mouthTextures.closed;

  // Track current character for lip sync with natural timing
  let currentCharIndex = 0;
  const updateMouth = () => {
    if (!isSpeaking) {
      avatarMaterial.map = mouthTextures.closed;
      return;
    }

    if (currentCharIndex < text.length) {
      const prevChar = currentCharIndex > 0 ? text[currentCharIndex - 1] : '';
      const nextChar = currentCharIndex < text.length - 1 ? text[currentCharIndex + 1] : '';
      const texture = getPhonemeTexture(text[currentCharIndex], prevChar, nextChar);
      
      // Natural pauses for punctuation
      const char = text[currentCharIndex];
      let delay = 100; // Base timing
      
      if (',.:;!?'.includes(char)) {
        avatarMaterial.map = mouthTextures.closed;
        delay = char === '.' || char === '!' || char === '?' ? 300 : 200;
      } else {
        // Smooth transition between mouth positions
        if (texture !== lastTexture) {
          avatarMaterial.map = texture;
          lastTexture = texture;
        }
      }

      currentCharIndex++;
      // Vary the timing based on character type
      const speedVariation = Math.random() * 50 - 25; // ±25ms variation for natural effect
      animationTimer = setTimeout(updateMouth, delay + speedVariation);
    } else {
      avatarMaterial.map = mouthTextures.closed;
    }
  };

  utterance.onstart = () => {
    console.log('Speech started');
    isSpeaking = true;
    currentCharIndex = 0;
    lastTexture = mouthTextures.closed;
    updateMouth();
  };

  utterance.onend = () => {
    console.log('Speech ended');
    isSpeaking = false;
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
    // Gradual close
    avatarMaterial.map = mouthTextures.small;
    setTimeout(() => {
      avatarMaterial.map = mouthTextures.closed;
    }, 100);
  };

  utterance.onboundary = (event) => {
    console.log('Speech boundary:', event.name, event);
    if (event.name === 'word') {
      // Natural expressions at word boundaries
      const wordEnd = text.substr(event.charIndex, event.charLength);
      
      // Smile more often at the end of sentences or happy words
      const isEndOfSentence = '.!?'.includes(wordEnd[wordEnd.length - 1]);
      const isHappyWord = /\b(happy|great|good|nice|love|wonderful)\b/i.test(wordEnd);
      
      if (isEndOfSentence || isHappyWord || Math.random() < 0.1) { // 10% random chance
        avatarMaterial.map = mouthTextures.smile;
        setTimeout(() => {
          if (isSpeaking) {
            avatarMaterial.map = lastTexture;
          } else {
            avatarMaterial.map = mouthTextures.closed;
          }
        }, isEndOfSentence ? 400 : 200);
      }
    }
  };

  utterance.onerror = (event) => {
    console.error('Speech error:', event);
  };

  speechSynthesis.cancel(); // Cancel any ongoing speech
  speechSynthesis.speak(utterance);
}

// Add subtle head movement
function addNaturalMovement() {
  const baseRotation = avatar.rotation.z;
  const basePosition = avatar.position.y;
  
  // Subtle random movement
  setInterval(() => {
    if (!isSpeaking) return;
    
    const rotationVariation = (Math.random() - 0.5) * 0.05;
    const positionVariation = (Math.random() - 0.5) * 0.02;
    
    gsap.to(avatar.rotation, {
      z: baseRotation + rotationVariation,
      duration: 2,
      ease: "power1.inOut"
    });
    
    gsap.to(avatar.position, {
      y: basePosition + positionVariation,
      duration: 2,
      ease: "power1.inOut"
    });
  }, 2000);

  // Random blinking
  const blink = () => {
    if (Math.random() < 0.1) { // 10% chance to blink when checked
      const currentTexture = avatarMaterial.map;
      avatarMaterial.map = mouthTextures.closed;
      setTimeout(() => {
        if (isSpeaking) {
          avatarMaterial.map = currentTexture;
        }
      }, 150);
    }
  };

  setInterval(blink, 1000); // Check for blink every second
}

// Start natural movements
addNaturalMovement();

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
