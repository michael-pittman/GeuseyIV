import React, { useEffect, useRef, useContext } from 'react';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DSprite } from 'three/addons/renderers/CSS3DRenderer.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import TWEEN from 'three/addons/libs/tween.module.js';
import { ThemeContext, Theme, LayoutContext } from '../types';

// Separate TWEEN group for camera - won't be affected by particle TWEEN.removeAll()
const cameraTweenGroup = new TWEEN.Group();

export const Scene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const objectsRef = useRef<CSS3DSprite[]>([]); // Store objects in ref to access across hooks
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null); // Ref for camera
  const isInitializedRef = useRef(false); // Track if scene has been initialized
  const { theme } = useContext(ThemeContext);
  const { isChatOpen } = useContext(LayoutContext);
  const themeRef = useRef(theme);

  // 1. Handle Theme Changes for Non-Reactive parts (Animation Loop & Opacity)
  useEffect(() => {
    themeRef.current = theme;

    // Update opacity when theme changes
    const opacity = theme === Theme.DARK ? '0.9' : '1';

    objectsRef.current.forEach((obj) => {
        const element = obj.element as HTMLElement;
        const img = element.querySelector('img');
        if (img) {
            img.style.opacity = opacity;
        }
    });
  }, [theme]);

  // Camera Zoom based on Chat State - uses separate TWEEN group
  useEffect(() => {
    if (!cameraRef.current) return;

    const targetZ = isChatOpen ? 4500 : 2500;

    // Clear previous camera tweens only
    cameraTweenGroup.removeAll();

    new TWEEN.Tween(cameraRef.current.position, cameraTweenGroup)
      .to({ z: targetZ }, 2000)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();

  }, [isChatOpen]);

  // 2. Initialize Scene (Run once)
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Prevent double initialization in React StrictMode
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let camera: THREE.PerspectiveCamera;
    let scene: THREE.Scene;
    let renderer: CSS3DRenderer;
    let controls: TrackballControls;
    let animationId: number;

    // Clear existing objects
    objectsRef.current = []; 

    const targets: { [key: string]: THREE.Object3D[] } = {
        plane: [],
        cube: [],
        sphere: [],
        random: [],
        spiral: [],
        fibonacci: []
    };
    
    // State for transitions
    let currentLayoutIndex = -1;
    const transitionDuration = 2000;
    const displayDuration = 16000;

    // Animation Timing State
    let lastTime = Date.now();
    let elapsed = 0;
    let needsRender = true; // Track if render is needed
    let frameSkip = 0; // Frame skipping for performance
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;

    const init = () => {
      const container = containerRef.current;
      if (!container) return;

      // 1. Camera - Adjusted to match production view
      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
      // Position camera closer and slightly angled to match production scene
      camera.position.set(0, 200, 2500);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera; // Store in ref for zooming

      scene = new THREE.Scene();

      // 2. Objects (Sprites)
      const image = document.createElement('img');
      
      // Fixed Particle Count (Reverted from mobile logic)
      const particleCount = 512;
      
      // Track if sprites have been created to prevent double initialization
      let spritesCreated = false;

      image.onload = () => {
        // Prevent double initialization in React StrictMode
        if (spritesCreated || objectsRef.current.length > 0) {
          console.log('Sprites already created, skipping initialization');
          return;
        }
        spritesCreated = true;
        
        console.log(`Creating ${particleCount} sprites...`);
        for (let i = 0; i < particleCount; i++) {
          const domElement = document.createElement('div');
          domElement.style.width = '120px'; 
          domElement.style.height = '120px';
          
          // Performance optimizations for smooth animations
          domElement.style.willChange = 'transform';
          domElement.style.backfaceVisibility = 'hidden';
          domElement.style.transformStyle = 'preserve-3d';
          
          const imgElement = image.cloneNode() as HTMLImageElement;
          imgElement.style.width = '100%';
          imgElement.style.height = '100%';
          
          imgElement.style.opacity = themeRef.current === Theme.DARK ? '0.9' : '1';
          
          domElement.appendChild(imgElement);

          const object = new CSS3DSprite(domElement);
          
          // Start at Random positions
          object.position.x = Math.random() * 4000 - 2000;
          object.position.y = Math.random() * 4000 - 2000;
          object.position.z = Math.random() * 4000 - 2000;
          
          // Add random offset for animation variation
          object.userData = { randomOffset: Math.random() * Math.PI * 2 };
          
          scene.add(object);
          objectsRef.current.push(object);
        }

        // 3. Define Layouts
        createTargets();
        
        // 4. Start Animation Loop
        transition();
        animate();
      };
      
      image.onerror = () => {
        console.error('🖼️ Failed to load sprite image');
        // Create sprites with a fallback colored div if image fails
        if (spritesCreated) return;
        spritesCreated = true;
        
        for (let i = 0; i < particleCount; i++) {
          const domElement = document.createElement('div');
          domElement.style.width = '120px'; 
          domElement.style.height = '120px';
          domElement.style.backgroundColor = themeRef.current === Theme.DARK ? '#9999bb' : '#cccccc';
          domElement.style.borderRadius = '50%';
          domElement.style.opacity = themeRef.current === Theme.DARK ? '0.9' : '1';
          
          // Performance optimizations for smooth animations
          domElement.style.willChange = 'transform';
          domElement.style.backfaceVisibility = 'hidden';
          domElement.style.transformStyle = 'preserve-3d';
          
          const object = new CSS3DSprite(domElement);
          
          object.position.x = Math.random() * 4000 - 2000;
          object.position.y = Math.random() * 4000 - 2000;
          object.position.z = Math.random() * 4000 - 2000;
          
          object.userData = { randomOffset: Math.random() * Math.PI * 2 };
          
          scene.add(object);
          objectsRef.current.push(object);
        }
        
        createTargets();
        transition();
        animate();
      };
      
      // Start loading the image
      image.src = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprite.png';

      // 5. Renderer
      renderer = new CSS3DRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Enable pointer events for smooth interaction
      renderer.domElement.style.pointerEvents = 'auto';
      renderer.domElement.style.touchAction = 'none'; // Prevent default touch gestures for better control
      
      container.appendChild(renderer.domElement);

      // 6. Controls - Optimized for smooth pointer/touch interaction
      controls = new TrackballControls(camera, renderer.domElement);
      controls.minDistance = 500;
      controls.maxDistance = 6000;
      controls.rotateSpeed = 2.0;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 0.8;
      controls.dynamicDampingFactor = 0.2;
      
      // Enhanced touch/pointer responsiveness
      controls.noRotate = false;
      controls.noZoom = false;
      controls.noPan = false;
      controls.staticMoving = false; // Enable smooth momentum
      controls.enabled = true;

      window.addEventListener('resize', onWindowResize);
    };

    const createTargets = () => {
        const l = objectsRef.current.length;
        
        // --- Plane ---
        const amountX = 16;
        const amountZ = 32;
        const separationPlane = 150;
        const offsetX = ((amountX - 1) * separationPlane) / 2;
        const offsetZ = ((amountZ - 1) * separationPlane) / 2;

        for (let i = 0; i < l; i++) {
            const object = new THREE.Object3D();
            
            const xRaw = (i % amountX) * separationPlane;
            const zRaw = Math.floor(i / amountX) * separationPlane;
            
            const y = (Math.sin(xRaw * 0.5) + Math.sin(zRaw * 0.5)) * 200;
            
            const x = xRaw - offsetX;
            const z = zRaw - offsetZ;
            
            object.position.set(x, y, z);
            object.lookAt(new THREE.Vector3(0, 0, 0)); 
            targets.plane.push(object);
        }

        // --- Cube ---
        for (let i = 0; i < l; i++) {
            const object = new THREE.Object3D();
            
            // 8x8x8 Grid (Fixed)
            const x = (i % 8) * 150 - 525;
            const y = (Math.floor(i / 8) % 8) * 150 - 525;
            const z = (Math.floor(i / 64)) * 150 - 525;
            
            object.position.set(x, y, z);
            object.rotation.set(0, 0, 0);
            targets.cube.push(object);
        }

        // --- Sphere ---
        const vector = new THREE.Vector3();
        for (let i = 0; i < l; i++) {
            const phi = Math.acos(-1 + (2 * i) / l);
            const theta = Math.sqrt(l * Math.PI) * phi;
            const object = new THREE.Object3D();
            
            object.position.setFromSphericalCoords(1750, phi, theta);
            
            vector.copy(object.position).multiplyScalar(2);
            object.lookAt(vector);
            targets.sphere.push(object);
        }

        // --- Random ---
        for (let i = 0; i < l; i++) {
            const object = new THREE.Object3D();
            object.position.x = Math.random() * 4000 - 2000;
            object.position.y = Math.random() * 4000 - 2000;
            object.position.z = Math.random() * 4000 - 2000;
            targets.random.push(object);
        }

        // --- Spiral ---
        const separationSpiral = 150;
        const spiralTurns = 15;
        const maxRadius = separationSpiral * 8;

        for (let i = 0; i < l; i++) {
            const object = new THREE.Object3D();
            
            const fraction = i / (l - 1);
            const angle = fraction * spiralTurns * Math.PI * 4;
            const radius = fraction * maxRadius;
            
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const y = radius * Math.sin(angle);

            object.position.set(x, y, z);
            
            vector.copy(object.position).multiplyScalar(2);
            object.lookAt(vector);
            
            targets.spiral.push(object);
        }

        // --- Fibonacci ---
        const phi_fib = Math.PI * (3 - Math.sqrt(5)); 
        for (let i = 0; i < l; i++) {
             const object = new THREE.Object3D();
             
             const y = 1 - (i / (l - 1)) * 2;
             const radius = Math.sqrt(1 - y * y);
             
             const theta = phi_fib * i;
             
             const r = 600;
             
             object.position.x = Math.cos(theta) * radius * r;
             object.position.y = y * r;
             object.position.z = Math.sin(theta) * radius * r;
             
             vector.copy(object.position).multiplyScalar(2);
             object.lookAt(vector);
             targets.fibonacci.push(object);
        }
    };

    const transition = () => {
        const keys = Object.keys(targets);
        let nextIndex = Math.floor(Math.random() * keys.length);

        if (keys.length > 1) {
            while(nextIndex === currentLayoutIndex) {
                nextIndex = Math.floor(Math.random() * keys.length);
            }
        }
        currentLayoutIndex = nextIndex;

        const key = keys[currentLayoutIndex];
        const currentTargets = targets[key];
        const objects = objectsRef.current;

        TWEEN.removeAll();
        needsRender = true; // Force render during transitions

        // Calculate center of mass for distance-based stagger
        let centerX = 0, centerY = 0, centerZ = 0;
        const objectCount = objects.length;
        for (let i = 0; i < objectCount; i++) {
            centerX += objects[i].position.x;
            centerY += objects[i].position.y;
            centerZ += objects[i].position.z;
        }
        centerX /= objectCount;
        centerY /= objectCount;
        centerZ /= objectCount;

        // Find max distance for normalization
        let maxDistance = 0;
        const distances: number[] = [];
        for (let i = 0; i < objectCount; i++) {
            const dx = objects[i].position.x - centerX;
            const dy = objects[i].position.y - centerY;
            const dz = objects[i].position.z - centerZ;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            distances[i] = dist;
            if (dist > maxDistance) maxDistance = dist;
        }

        // Maximum stagger delay (creates radial wave effect)
        const maxStaggerDelay = 600;

        for (let i = 0; i < objectCount; i++) {
            const object = objects[i];
            const target = currentTargets[i];

            if (!object || !target) continue;

            // Distance-based stagger: particles closer to center start first
            const normalizedDistance = maxDistance > 0 ? distances[i] / maxDistance : 0;
            const staggerDelay = normalizedDistance * maxStaggerDelay;

            // Reduced random variation for more predictable motion
            const duration = transitionDuration + (Math.random() * transitionDuration * 0.2);

            new TWEEN.Tween(object.position)
                .to({ x: target.position.x, y: target.position.y, z: target.position.z }, duration)
                .easing(TWEEN.Easing.Cubic.Out) // Smooth deceleration without overshoot
                .delay(staggerDelay)
                .onUpdate(() => { needsRender = true; })
                .start();

            new TWEEN.Tween(object.rotation)
                .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, duration)
                .easing(TWEEN.Easing.Cubic.Out)
                .delay(staggerDelay)
                .onUpdate(() => { needsRender = true; })
                .start();
        }

        new TWEEN.Tween({})
            .to({}, displayDuration + transitionDuration * 2 + maxStaggerDelay)
            .onComplete(transition)
            .start();
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    // Breathing animation - synchronized wave pattern based on distance from center
    const updateObjectScales = (objects: CSS3DSprite[], elapsedTime: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const object = objects[i];
        if (object && object.scale && object.position) {
          // Distance from center creates radial wave pattern
          const distance = Math.sqrt(
            object.position.x * object.position.x +
            object.position.y * object.position.y +
            object.position.z * object.position.z
          );

          // Phase based on distance - creates expanding/contracting rings
          const phase = distance * 0.002;

          // Single frequency wave - all particles in sync based on their distance
          const wave = Math.sin(elapsedTime * 1.2 - phase) * 0.25;
          const targetScale = 1.0 + wave;

          if (object.userData.currentScale === undefined) {
            object.userData.currentScale = 1.0;
          }

          object.userData.currentScale += (targetScale - object.userData.currentScale) * 0.15;
          object.scale.setScalar(object.userData.currentScale);
        }
      }
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const now = performance.now();
      const delta = now - lastTime;
      
      // Cap delta to prevent large jumps (e.g., tab switching)
      const cappedDelta = Math.min(delta, 100);
      lastTime = now;
      const deltaSeconds = cappedDelta / 1000;

      // Update controls (always needed for smooth interaction)
      controls.update();
      
      // Update all tweens (particles + camera)
      TWEEN.update();
      cameraTweenGroup.update();

      // Check if we need to render
      const hasActiveTweens = TWEEN.getAll().length > 0 || cameraTweenGroup.getAll().length > 0;
      needsRender = hasActiveTweens;

      elapsed += deltaSeconds;

      // Optimize scale calculations - update every frame but batch operations
      frameSkip++;
      const objects = objectsRef.current;
      const objectCount = objects.length;
      
      if (objectCount > 0) {
        updateObjectScales(objects, elapsed, objectCount);
      }

      // Always render for smooth animation, but optimize when possible
      renderer.render(scene, camera);
    };

    init();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      TWEEN.removeAll();
      cameraTweenGroup.removeAll();
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      // Only cleanup if we're actually unmounting (not just StrictMode re-run)
      // Don't reset isInitializedRef here to prevent double initialization
      if (containerRef.current && containerRef.current.parentNode) {
          // Only clear if container still exists and has parent
          const rendererElement = containerRef.current.querySelector('div[style*="overflow: hidden"]');
          if (rendererElement && rendererElement.parentNode === containerRef.current) {
            containerRef.current.removeChild(rendererElement);
          }
      }
      // Clear scene objects
      if (scene) {
        while(scene.children.length > 0) {
          scene.remove(scene.children[0]);
        }
      }
      objectsRef.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      id="css3d-container"
    />
  );
};