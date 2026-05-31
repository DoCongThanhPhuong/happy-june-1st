/* ==========================================
   STATE MANAGEMENT & CONSTANTS
   ========================================== */
const CONFIG = {
  images: [
    {
      url: "images/photo1.jpg",
      caption: "Xinh nhứt hệ mặt trời lun❤️",
    },
    {
      url: "images/photo2.jpg",
      caption: "Đi bảo tàng lè! 💕",
    },
    {
      url: "images/photo3.jpg",
      caption: "Hun miếng nè! hẹ 😝",
    },
    {
      url: "images/photo4.jpg",
      caption: "Tiêm mũi 2 rùi lè! 💞",
    },
    {
      url: "images/photo5.jpg",
      caption: "Cho hun miếng đi mò! 😗",
    },
    {
      url: "images/photo6.jpg",
      caption: "Hự nè nưỡi với người ta 😖",
    },
    {
      url: "images/photo7.jpg",
      caption: "Hì chu che ghê! 😚",
    },
    {
      url: "images/photo8.jpg",
      caption: "Hải ngố! hẹ hẹ 😜",
    },
    {
      url: "images/photo9.jpg",
      caption: "Đẹp đôi thía! 😍",
    },
  ],
  greetingText: `Gửi iu... ❤️\n\nChúc iu một ngày Quốc tế Thiếu nhi thật nhìu niềm vui! \n\nDù em bao nhiêu tuổi đi chăng nữa, em vẫn mãi là "em bé đáng iu nhứt" cụa anh.\n\n Thương em nhắm lun! 💕✨`,
  carouselRadius: 4.2,
};

// Global Scene Objects
let scene, camera, renderer;
let heartMesh, particleSystem, backgroundParticles, twinklingParticles;
let carouselGroup;
const carouselPlanes = [];
let pointLightInside;

// Animation & Interaction variables
let hasExploded = false;
let isDragging = false;
let startPointerX = 0;
let currentRotation = 0;
let targetRotation = 0;
let rotationVelocity = 0;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;
let activeModalImg = null;

// Sound System (Audio Files & Web Audio API Synth)
let audioCtx = null;
let synthInterval = null;
let isMusicPlaying = false;
let localAudio = null;

/* ==========================================
   INITIALIZATION
   ========================================== */
window.addEventListener("DOMContentLoaded", () => {
  initThree();
  createStarfield();
  setupEventListeners();
  animate();
});

function initThree() {
  // 1. Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x140e28, 0.04); // Lighter, warm dark violet-pink fog

  // 2. Camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  adjustCameraForViewport();

  // 3. Renderer
  const canvas = document.getElementById("webgl-canvas");
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  }); // Enable transparency
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Completely transparent canvas clear color
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // 4. Lighting
  const ambientLight = new THREE.AmbientLight(0xffe3eb, 0.6);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xff7da0, 1.2);
  dirLight1.position.set(5, 10, 7);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x7da8ff, 0.8);
  dirLight2.position.set(-5, -5, 5);
  scene.add(dirLight2);

  pointLightInside = new THREE.PointLight(0xff3b6f, 2.5, 8);
  pointLightInside.position.set(0, 0, 0.5);
  scene.add(pointLightInside);
}

// Dynamically scale camera FOV and distance to prevent mobile portrait cropping
function adjustCameraForViewport() {
  const aspect = window.innerWidth / window.innerHeight;
  if (aspect < 1) {
    // Mobile portrait mode
    camera.fov = 72;
    if (!hasExploded) {
      camera.position.set(0, 0, 6.2);
    } else {
      camera.position.set(0, 0.0, 9.2); // Centered camera target Y
    }
  } else {
    // Desktop landscape mode
    camera.fov = 58;
    if (!hasExploded) {
      camera.position.set(0, 0, 5.3);
    } else {
      camera.position.set(0, 0.0, 7.2); // Centered camera target Y
    }
  }
  camera.updateProjectionMatrix();
}

/* ==========================================
   CREATING 3D ASSETS
   ========================================== */

// 1. Create a Starry Background (Static Dust)
// 1. Create a Starry Background (Twinkling Galaxies)
function createStarfield() {
  // A. Dense small background stars
  const starCount = 450;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 8 + Math.random() * 22;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    colors[i * 3] = 0.85 + Math.random() * 0.15;
    colors[i * 3 + 1] = 0.75 + Math.random() * 0.25;
    colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const starMaterial = new THREE.PointsMaterial({
    size: 0.13,
    map: createCircleTexture("rgba(255,255,255,1)", "rgba(255,150,200,0)"),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
  });

  backgroundParticles = new THREE.Points(geometry, starMaterial);
  scene.add(backgroundParticles);

  // B. Bright twinkling foreground stars
  const twinkleCount = 80;
  const twinkleGeo = new THREE.BufferGeometry();
  const twinklePos = new Float32Array(twinkleCount * 3);

  for (let i = 0; i < twinkleCount; i++) {
    twinklePos[i * 3] = (Math.random() - 0.5) * 22;
    twinklePos[i * 3 + 1] = (Math.random() - 0.5) * 22;
    twinklePos[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }

  twinkleGeo.setAttribute("position", new THREE.BufferAttribute(twinklePos, 3));

  const twinkleMat = new THREE.PointsMaterial({
    size: 0.24,
    map: createCircleTexture("rgba(255,255,255,1)", "rgba(255,94,140,0)"),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  twinklingParticles = new THREE.Points(twinkleGeo, twinkleMat);
  scene.add(twinklingParticles);
}

// Helper to draw clean circular glowing particles programmatically
function createCircleTexture(color1, color2) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, color1);
  grad.addColorStop(0.3, "rgba(255, 120, 160, 0.7)");
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 2. Extrude a beautiful 3D Heart Geometry
function create3DHeart() {
  const heartShape = new THREE.Shape();
  const x = 0,
    y = 0;

  // Heart bezier math (beautifully balanced)
  heartShape.moveTo(x, y + 0.6);
  heartShape.bezierCurveTo(
    x + 0.6,
    y + 1.3,
    x + 1.6,
    y + 1.3,
    x + 1.6,
    y + 0.35,
  );
  heartShape.bezierCurveTo(x + 1.6, y - 0.5, x + 0.8, y - 1.1, x, y - 1.7);
  heartShape.bezierCurveTo(
    x - 0.8,
    y - 1.1,
    x - 1.6,
    y - 0.5,
    x - 1.6,
    y + 0.35,
  );
  heartShape.bezierCurveTo(x - 1.6, y + 1.3, x - 0.6, y + 1.3, x, y + 0.6);

  const extrudeSettings = {
    depth: 0.5,
    bevelEnabled: true,
    bevelSegments: 10,
    steps: 2,
    bevelSize: 0.15,
    bevelThickness: 0.15,
  };

  const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  geometry.center(); // Perfect pivot centering

  // Sparkling glossy candy-coated material (highly stable, 100% visible on all GPU drivers)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xff2b66, // Vibrant ruby pink-red
    metalness: 0.1,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    emissive: 0x3d0012, // Beautiful warm glowing core
    transparent: false,
    side: THREE.DoubleSide,
    depthWrite: true,
  });

  heartMesh = new THREE.Mesh(geometry, material);
  heartMesh.name = "glowing-heart";
  scene.add(heartMesh);

  // Initial scale bounce
  gsap.from(heartMesh.scale, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1.5,
    ease: "elastic.out(1, 0.4)",
  });
}

// 3. Create Fallback Card Texture for pictures (in case photo load fails)
function createFallbackTexture(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");

  // Soft pink gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, 320);
  grad.addColorStop(0, "#ffe8ef");
  grad.addColorStop(1, "#ffc7d7");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 320);

  // Cute border
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#ff5e8c";
  ctx.strokeRect(5, 5, 246, 310);

  // Heart icon
  ctx.font = "70px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("❤️", 128, 110);

  // Caption
  ctx.fillStyle = "#cc2b5e";
  ctx.font = "bold 20px Quicksand, Arial";
  ctx.fillText("iu", 128, 200);

  ctx.fillStyle = "#ff5e8c";
  ctx.font = "16px Quicksand, Arial";
  ctx.fillText(text, 128, 240);

  return new THREE.CanvasTexture(canvas);
}

// 4. Create 3D Revolving Photo Carousel
function buildPhotoCarousel() {
  carouselGroup = new THREE.Group();
  // Center the carousel group vertically at y = 0
  carouselGroup.position.set(0, 0, 0);
  scene.add(carouselGroup);

  const textureLoader = new THREE.TextureLoader();
  const planeGeo = new THREE.PlaneGeometry(1.0, 1.31); // Shrunk for compact, elegant polaroids

  CONFIG.images.forEach((imgData, i) => {
    // Create 3D container for Polaroid frame
    const frameGroup = new THREE.Group();

    // Polaroid White Boarding
    const boardGeo = new THREE.PlaneGeometry(1.1, 1.43);
    const boardMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
      clearcoat: 0.5,
      side: THREE.DoubleSide,
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.set(0, 0, -0.01); // Slightly behind image
    frameGroup.add(boardMesh);

    // Actual Image Texture loading with bulletproof error safety
    let pictureMat;
    textureLoader.load(
      imgData.url,
      // Success
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        pictureMat = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0, // Will fade-in smoothly
        });
        const pictureMesh = new THREE.Mesh(planeGeo, pictureMat);
        pictureMesh.name = `photo-${i}`;
        frameGroup.add(pictureMesh);

        // Fade in texture material
        gsap.to(pictureMat, { opacity: 1, duration: 1.5, delay: i * 0.2 });
      },
      // Progress (ignore)
      undefined,
      // Failure (load custom designed crystalline texture instead!)
      () => {
        const fallbackTex = createFallbackTexture(`Bức ảnh số ${i + 1}`);
        pictureMat = new THREE.MeshBasicMaterial({
          map: fallbackTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0,
        });
        const pictureMesh = new THREE.Mesh(planeGeo, pictureMat);
        pictureMesh.name = `photo-${i}`;
        frameGroup.add(pictureMesh);

        gsap.to(pictureMat, { opacity: 1, duration: 1.5, delay: i * 0.2 });
      },
    );

    // Position on 3D circle
    const angle = i * ((Math.PI * 2) / CONFIG.images.length);
    frameGroup.position.x = Math.sin(angle) * CONFIG.carouselRadius;
    frameGroup.position.z = Math.cos(angle) * CONFIG.carouselRadius;
    frameGroup.position.y = (Math.random() - 0.5) * 0.2; // Tiny romantic organic height differences
    frameGroup.rotation.y = angle; // Face outwards from circle center

    frameGroup.name = `frame-${i}`;
    carouselGroup.add(frameGroup);
    carouselPlanes.push(frameGroup);

    // Animate entering
    frameGroup.scale.set(0, 0, 0);
    gsap.to(frameGroup.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 2.0,
      delay: i * 0.2,
      ease: "elastic.out(1, 0.6)",
    });
  });

  // Make camera smoothly zoom out and shift to frame the carousel perfectly
  const aspect = window.innerWidth / window.innerHeight;
  const targetZ = aspect < 1 ? 9.2 : 7.2;
  const targetY = 0.0; // Centered camera target Y looking straight ahead
  gsap.to(camera.position, {
    z: targetZ,
    y: targetY,
    duration: 2.5,
    ease: "power2.out",
  });
}

// 5. Sparkle Particle Explosion when Heart popped
function triggerHeartExplosion(origin) {
  const particleCount = 120;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];

  for (let i = 0; i < particleCount; i++) {
    // Spawn at heart coordinate
    positions[i * 3] = origin.x;
    positions[i * 3 + 1] = origin.y;
    positions[i * 3 + 2] = origin.z;

    // Spherical explosion velocity vectors
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const speed = 0.08 + Math.random() * 0.15;

    velocities.push(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.sin(phi) * Math.sin(theta) * speed,
      Math.cos(phi) * speed,
    );
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const glowTex = createCircleTexture(
    "rgba(255, 94, 140, 1)",
    "rgba(255, 255, 255, 0)",
  );
  const mat = new THREE.PointsMaterial({
    size: 0.35,
    map: glowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, mat);
  scene.add(particles);

  // Custom animation for explosion particles directly in JS frame
  const starTimer = { val: 1.0 };
  gsap.to(starTimer, {
    val: 0,
    duration: 2.0,
    ease: "power2.out",
    onUpdate: () => {
      const posAttr = particles.geometry.attributes.position;
      const arr = posAttr.array;
      for (let i = 0; i < particleCount; i++) {
        // Apply velocities with drag
        arr[i * 3] += velocities[i * 3] * starTimer.val;
        arr[i * 3 + 1] += velocities[i * 3 + 1] * starTimer.val;
        arr[i * 3 + 2] += velocities[i * 3 + 2] * starTimer.val;

        // Add minor gravity gravity
        arr[i * 3 + 1] -= 0.003;
      }
      posAttr.needsUpdate = true;
      mat.opacity = starTimer.val; // Fade out
      mat.size = starTimer.val * 0.45;
    },
    onComplete: () => {
      scene.remove(particles);
      geometry.dispose();
      mat.dispose();
    },
  });
}

/* ==========================================
   OFFLINE MUSIC BOX (WEB AUDIO API)
   ========================================== */
function playSparkleSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Sparkling magic wind arpeggio notes
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Triangle/Sine wave makes it soft like a chime
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      // Sparkling reverb-like decay envelope
      gainNode.gain.setValueAtTime(0, now + index * 0.08);
      gainNode.gain.linearRampToValueAtTime(0.3, now + index * 0.08 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        now + index * 0.08 + 0.6,
      );

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.6);
    });
  } catch (e) {
    console.warn("Lỗi tạo âm thanh Chime: ", e);
  }
}

let localAudioFailed = false;

function startLullabyMusic() {
  isMusicPlaying = true;

  // Unblock and resume AudioContext synchronously inside user interaction callstack
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
  } catch (e) {
    console.warn("Lỗi đồng bộ AudioContext: ", e);
  }

  // Show equalizer UI immediately
  document.getElementById("music-waves").classList.remove("hidden");
  document.getElementById("music-icon").className = "fa-solid fa-volume-high";
  document
    .getElementById("music-toggle-btn")
    .querySelector(".btn-text").textContent = "Tắt Nhạc";

  // 1. Try to play custom local file 'music.mp3' from DOM
  if (!localAudio) {
    localAudio = document.getElementById("bg-music");
    if (localAudio) {
      localAudio.volume = 0.45; // Smooth romantic background volume
      // Instant load error listener (fires if file is missing/404)
      localAudio.addEventListener("error", () => {
        localAudioFailed = true;
        if (isMusicPlaying) {
          console.warn(
            "Lỗi tải tệp music.mp3, chuyển ngay sang Hộp nhạc tự tổng hợp.",
          );
          startSynthesizedLullaby();
        }
      });
    }
  }

  let hasPlayedCustom = false;

  if (localAudio && !localAudioFailed) {
    localAudio
      .play()
      .then(() => {
        hasPlayedCustom = true;
      })
      .catch((err) => {
        console.warn(
          "Không thể phát music.mp3 hoặc bị chặn, chuyển sang Hộp nhạc: ",
          err,
        );
        startSynthesizedLullaby();
      });

    // SAFETY NET TIMEOUT: If after 350ms the custom audio is not playing (due to stalled network,
    // iOS Safari delay, or missing file that hasn't fired the error event yet), we instantly
    // kick off our gorgeous music box synthesizer to guarantee there is never dead silence!
    setTimeout(() => {
      if (isMusicPlaying && !hasPlayedCustom) {
        console.warn(
          "Safety net triggered: music.mp3 bị đơ hoặc thiếu, kích hoạt Hộp nhạc tự tổng hợp.",
        );
        startSynthesizedLullaby();
      }
    }, 350);
  } else {
    startSynthesizedLullaby();
  }
}

function stopLullabyMusic() {
  isMusicPlaying = false;

  // Hide equalizer UI immediately
  document.getElementById("music-waves").classList.add("hidden");
  document.getElementById("music-icon").className = "fa-solid fa-volume-xmark";
  document
    .getElementById("music-toggle-btn")
    .querySelector(".btn-text").textContent = "Bật Nhạc";

  // Pause local file if playing
  if (localAudio) {
    localAudio.pause();
  }

  // Stop synthesizer just in case
  stopSynthesizedLullaby();
}

function startSynthesizedLullaby() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Warm cozy music box melody
    const melody = [
      261.63, 261.63, 392.0, 392.0, 440.0, 440.0, 392.0, 349.23, 349.23, 329.63,
      329.63, 293.66, 293.66, 261.63, 392.0, 392.0, 349.23, 349.23, 329.63,
      329.63, 293.66, 392.0, 392.0, 349.23, 349.23, 329.63, 329.63, 293.66,
    ];
    const noteDurations = [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1,
      1, 1, 2,
    ];

    let beatIdx = 0;
    const tempo = 140; // BPM
    const beatLength = 60 / tempo;

    function playNextNote() {
      if (!isMusicPlaying) return;

      const freq = melody[beatIdx];
      const duration = noteDurations[beatIdx] * beatLength;

      const osc = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      oscHarmonic.type = "triangle";
      oscHarmonic.frequency.setValueAtTime(freq * 2, ctx.currentTime);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + duration - 0.05,
      );

      osc.connect(gainNode);
      oscHarmonic.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      oscHarmonic.start();
      osc.stop(ctx.currentTime + duration);
      oscHarmonic.stop(ctx.currentTime + duration);

      beatIdx = (beatIdx + 1) % melody.length;

      synthInterval = setTimeout(playNextNote, duration * 1000);
    }

    playNextNote();
  } catch (e) {
    console.warn("Lỗi nhạc nền synth: ", e);
  }
}

function stopSynthesizedLullaby() {
  if (synthInterval) {
    clearTimeout(synthInterval);
    synthInterval = null;
  }
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/* ==========================================
   INTERACTION LOGIC
   ========================================== */

function handleHeartClicked() {
  if (hasExploded) return;
  hasExploded = true;

  // 1. Play magical audio popping
  playSparkleSound();

  // Play audio tag click fallback just in case
  const clickAud = document.getElementById("click-sound");
  if (clickAud) {
    clickAud.volume = 0.5;
    clickAud.play().catch(() => {});
  }

  // 2. Explode Particle effect from center (or heart origin if present)
  const origin = heartMesh ? heartMesh.position : new THREE.Vector3(0, 0, 0);
  triggerHeartExplosion(origin);

  // 3. Pop heart scaling down to zero if present
  if (heartMesh) {
    gsap.to(heartMesh.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.6,
      ease: "back.in(1.7)",
      onComplete: () => {
        scene.remove(heartMesh);
        if (heartMesh.geometry) heartMesh.geometry.dispose();
        if (heartMesh.material) heartMesh.material.dispose();
      },
    });
  }

  // 4. Shrink internal lighting source
  gsap.to(pointLightInside, { intensity: 0, duration: 0.6 });

  // 5. Fade out landing welcome UI
  document.getElementById("landing-overlay").classList.remove("active");
  document.getElementById("landing-overlay").classList.add("hidden");

  // 6. Build the gorgeous 3D Photo Carousel
  setTimeout(() => {
    buildPhotoCarousel();

    // Show Music and Greeting Card
    document.getElementById("music-toggle-btn").classList.remove("hidden");
    document.getElementById("greeting-card").classList.remove("hidden");

    // Auto-play the romantic music synth
    startLullabyMusic();

    // Start the beautiful typewriter greetings letter
    startTypewriter();
  }, 600);
}

function startTypewriter() {
  const container = document.getElementById("greeting-message");
  const text = CONFIG.greetingText;
  let i = 0;

  container.innerHTML = "";

  function type() {
    if (i < text.length) {
      container.innerHTML += text.charAt(i);
      i++;
      // Soft random scroll typing feel
      setTimeout(type, 15 + Math.random() * 20);

      // Scroll automatically to keep up with typing
      const body = document.querySelector(".card-body");
      body.scrollTop = body.scrollHeight;
    }
  }

  setTimeout(type, 800);
}

// Mobile audio unlock helper (pre-unlocks elements & context on very first tap anywhere)
function unlockMobileAudio() {
  // 1. Unlock Web Audio API context
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
  } catch (e) {}

  // 2. Unlock HTML5 audio tags by playing and pausing them instantly
  const clickAud = document.getElementById("click-sound");
  const bgAud = document.getElementById("bg-music");
  if (clickAud) {
    clickAud
      .play()
      .then(() => clickAud.pause())
      .catch(() => {});
  }
  if (bgAud) {
    bgAud
      .play()
      .then(() => bgAud.pause())
      .catch(() => {});
  }

  // Remove first-tap listeners completely
  window.removeEventListener("pointerdown", unlockMobileAudio);
  window.removeEventListener("touchstart", unlockMobileAudio);
}

function setupEventListeners() {
  // Gift Button click to open details
  const giftBtn = document.getElementById("open-gift-btn");
  if (giftBtn) {
    giftBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleHeartClicked(); // Triggers transition explosion & carousel
    });
  }

  // First touch/tap anywhere unlocks audio on strict mobile browsers
  window.addEventListener("pointerdown", unlockMobileAudio);
  window.addEventListener("touchstart", unlockMobileAudio);

  // Resize
  window.addEventListener("resize", onWindowResize);

  // Click/Touch Detection
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  // Music button toggle
  document.getElementById("music-toggle-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    if (isMusicPlaying) {
      stopLullabyMusic();
    } else {
      startLullabyMusic();
    }
  });

  // Close button greeting card
  document.getElementById("close-card-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("greeting-card").classList.add("hidden");
  });

  // Image Zoom modal closing
  document.getElementById("close-modal-btn").addEventListener("click", () => {
    document.getElementById("image-modal").classList.add("hidden");
  });

  document.getElementById("image-modal").addEventListener("click", () => {
    document.getElementById("image-modal").classList.add("hidden");
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  adjustCameraForViewport();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ==========================================
   POINTER DRAGGING & RAYCASTING INTERACTION
   ========================================== */

function onPointerDown(e) {
  if (
    document.getElementById("image-modal").classList.contains("hidden") ===
    false
  )
    return;

  isDragging = true;
  startPointerX = e.clientX;
  rotationVelocity = 0;

  // Track standard normalized coordinates for Three.js click Raycaster
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (!hasExploded && heartMesh) {
    // Intersect heart
    const intersects = raycaster.intersectObject(heartMesh);
    if (intersects.length > 0) {
      handleHeartClicked();
    }
  } else if (carouselGroup) {
    // Intersect photo carousel planes
    const intersects = raycaster.intersectObjects(carouselGroup.children, true);
    if (intersects.length > 0) {
      // Find parent group that holds board and picture
      let obj = intersects[0].object;
      while (obj.parent && obj.parent !== carouselGroup) {
        obj = obj.parent;
      }
      // Save as target clicked object to open modal on mouseup (if not dragged heavily)
      activeModalImg = obj;
    }
  }
}

function onPointerMove(e) {
  // Raycasting for Hover effects (Cursor pointers, heart squeeze)
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (!hasExploded && heartMesh) {
    const intersects = raycaster.intersectObject(heartMesh);
    if (intersects.length > 0) {
      document.body.style.cursor = "pointer";
      if (hoveredObject !== heartMesh) {
        hoveredObject = heartMesh;
        gsap.to(heartMesh.scale, {
          x: 1.15,
          y: 1.15,
          z: 1.15,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    } else {
      document.body.style.cursor = "default";
      if (hoveredObject === heartMesh) {
        hoveredObject = null;
        gsap.to(heartMesh.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }
  } else if (hasExploded && carouselGroup) {
    const intersects = raycaster.intersectObjects(carouselGroup.children, true);
    if (intersects.length > 0) {
      document.body.style.cursor = "pointer";
      let obj = intersects[0].object;
      while (obj.parent && obj.parent !== carouselGroup) {
        obj = obj.parent;
      }
      if (hoveredObject !== obj) {
        if (hoveredObject) resetFrameHoverState(hoveredObject);
        hoveredObject = obj;
        // Gently tilt and elevate hovered picture frame
        gsap.to(obj.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.3 });
        gsap.to(obj.position, { y: 0.15, duration: 0.3 });
      }
    } else {
      document.body.style.cursor = "default";
      if (hoveredObject) {
        resetFrameHoverState(hoveredObject);
        hoveredObject = null;
      }
    }
  }

  // Drag-to-spin physics calculation
  if (!isDragging || !hasExploded) return;
  const deltaX = e.clientX - startPointerX;
  startPointerX = e.clientX;

  // Convert mouse movement to radial velocity
  rotationVelocity = deltaX * 0.004;
  targetRotation += rotationVelocity;

  // Prevent zoom opening if dragging occurred
  if (Math.abs(deltaX) > 2) {
    activeModalImg = null;
  }
}

function resetFrameHoverState(frame) {
  gsap.to(frame.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
  gsap.to(frame.position, { y: 0, duration: 0.3 });
}

function onPointerUp(e) {
  isDragging = false;

  // Trigger detailed zoom modal
  if (hasExploded && activeModalImg) {
    const frameIdx = parseInt(activeModalImg.name.split("-")[1]);
    const imgData = CONFIG.images[frameIdx];

    // Open Glassmorphic Modal
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");
    const modalCap = document.getElementById("modal-caption");

    modalImg.src = imgData.url;
    modalCap.textContent = imgData.caption;
    modal.classList.remove("hidden");

    // Reset hover state immediately
    resetFrameHoverState(activeModalImg);
    activeModalImg = null;
  }
}

/* ==========================================
   MAIN RENDER LOOP
   ========================================== */
function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.001;

  // 1. Initial Heart animations
  if (!hasExploded && heartMesh) {
    // Floating heartbeat oscillations
    heartMesh.rotation.y = time * 0.5;
    heartMesh.rotation.x = Math.sin(time) * 0.15;
    heartMesh.position.y = Math.sin(time * 2.0) * 0.15;

    // Subtle core lighting pulse inside heart mesh
    pointLightInside.intensity = 2.0 + Math.sin(time * 4) * 0.6;
  }

  // 2. Background particle drift & individual star twinkling
  if (backgroundParticles) {
    const positions = backgroundParticles.geometry.attributes.position.array;
    const count = positions.length / 3;
    for (let i = 0; i < count; i++) {
      // Drift stars gently down-left
      positions[i * 3 + 1] -= 0.005; // Y axis drift
      if (positions[i * 3 + 1] < -15) {
        positions[i * 3 + 1] = 15; // Reset star at top
      }
    }
    backgroundParticles.geometry.attributes.position.needsUpdate = true;
    backgroundParticles.rotation.y = time * 0.02;
  }

  if (twinklingParticles) {
    // Star size organic twinkling pulsation
    twinklingParticles.material.size =
      0.22 + Math.sin(time * 5.0) * 0.09 + Math.cos(time * 8.0) * 0.04;
    twinklingParticles.rotation.y = -time * 0.03;
  }

  // 3. Photo Carousel Inertia rotation & Hover floating
  if (hasExploded && carouselGroup) {
    // Apply smooth inertia friction dampening
    if (!isDragging) {
      rotationVelocity *= 0.95; // Drag friction
      targetRotation += rotationVelocity;

      // Smooth, romantic auto-rotation when user is idle (optimized sweet spot)
      if (Math.abs(rotationVelocity) < 0.0005) {
        targetRotation += 0.0018;
      }
    }

    // Lerp rotation angle for absolute premium smoothness
    currentRotation += (targetRotation - currentRotation) * 0.08;
    carouselGroup.rotation.y = currentRotation;

    // Individual picture floating oscillations
    carouselPlanes.forEach((plane, i) => {
      const indexTime = time + i * 2.0;
      // Float individually unless hovered
      if (hoveredObject !== plane) {
        plane.position.y = Math.sin(indexTime * 1.5) * 0.07;
      }
    });
  }

  renderer.render(scene, camera);
}
