import React, { useEffect, useRef, useContext } from 'react';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DSprite } from 'three/addons/renderers/CSS3DRenderer.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import TWEEN from 'three/addons/libs/tween.module.js';
import { ThemeContext, Theme, LayoutContext } from '../types';

export const Scene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const objectsRef = useRef<CSS3DSprite[]>([]); // Store objects in ref to access across hooks
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null); // Ref for camera
  const { theme } = useContext(ThemeContext);
  const { isChatOpen } = useContext(LayoutContext);
  const themeRef = useRef(theme);

  // 1. Handle Theme Changes for Non-Reactive parts (Animation Loop & Opacity)
  useEffect(() => {
    themeRef.current = theme;

    // Dynamically update opacity of existing sprites when theme changes
    const opacity = theme === Theme.LIGHT ? '1' : '0.75';
    objectsRef.current.forEach((obj) => {
        const element = obj.element as HTMLElement;
        const img = element.querySelector('img');
        if (img) {
            img.style.opacity = opacity;
        }
    });
  }, [theme]);

  // New Effect for Camera Zoom based on Chat State
  useEffect(() => {
    if (!cameraRef.current) return;

    // Zoom out to 5000 if chat is open, zoom back to 3000 if closed
    const targetZ = isChatOpen ? 5000 : 3000;

    new TWEEN.Tween(cameraRef.current.position)
      .to({ z: targetZ }, 1500) // 1.5 second duration
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();

  }, [isChatOpen]);

  // 2. Initialize Scene (Run once)
  useEffect(() => {
    if (!containerRef.current) return;

    let camera: THREE.PerspectiveCamera;
    let scene: THREE.Scene;
    let renderer: CSS3DRenderer;
    let controls: TrackballControls;

    // Clear existing objects if re-running (though StrictMode might trigger this, we want to persist ref)
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

    const init = () => {
      const container = containerRef.current;
      if (!container) return;

      // 1. Camera
      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.z = 3000;
      cameraRef.current = camera; // Store in ref for zooming

      scene = new THREE.Scene();

      // 2. Objects (Sprites)
      const image = document.createElement('img');
      image.src = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprite.png';
      
      // Responsive Particle Count
      const isMobile = window.innerWidth < 768;
      const particleCount = isMobile ? 256 : 512;

      image.onload = () => {
        for (let i = 0; i < particleCount; i++) {
          const domElement = document.createElement('div');
          domElement.style.width = '80px'; 
          domElement.style.height = '80px';
          
          const imgElement = image.cloneNode() as HTMLImageElement;
          imgElement.style.width = '100%';
          imgElement.style.height = '100%';
          
          // Set initial opacity based on current theme ref
          // Light Mode = 1 (Full opacity), Dark Mode = 0.75 (Slightly transparent)
          imgElement.style.opacity = themeRef.current === Theme.LIGHT ? '1' : '0.75';
          
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
        createTargets(isMobile);
        
        // 4. Start Animation Loop
        transition();
        animate();
      };

      // 5. Renderer
      renderer = new CSS3DRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      // 6. Controls
      controls = new TrackballControls(camera, renderer.domElement);
      controls.minDistance = 500;
      controls.maxDistance = 6000;
      controls.rotateSpeed = 0.5;
      
      window.addEventListener('resize', onWindowResize);
    };

    const createTargets = (isMobile: boolean) => {
        const l = objectsRef.current.length;
        
        // --- Plane ---
        const amountX = isMobile ? 8 : 16; // Reduced width for mobile (8*32=256 vs 16*32=512)
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
            
            // 8x8 base grid.
            // For 512 (Desktop): 8x8x8. Z layers = 8.
            // For 256 (Mobile): 8x8x4. Z layers = 4.
            
            const x = (i % 8) * 150 - 525;
            const y = (Math.floor(i / 8) % 8) * 150 - 525;
            
            // Calculate Z centering offset based on layer count
            const zLayers = isMobile ? 4 : 8;
            const zOffset = ((zLayers - 1) * 150) / 2;
            
            const z = (Math.floor(i / 64)) * 150 - zOffset;
            
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

        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            const target = currentTargets[i];

            new TWEEN.Tween(object.position)
                .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * transitionDuration + transitionDuration)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start();

            new TWEEN.Tween(object.rotation)
                .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * transitionDuration + transitionDuration)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start();
        }

        new TWEEN.Tween({})
            .to({}, displayDuration + transitionDuration * 2)
            .onComplete(transition)
            .start();
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
      requestAnimationFrame(animate);
      TWEEN.update();
      controls.update();
      
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const isDark = themeRef.current === Theme.DARK;
      // Speed Adjustment: Light = 1.0, Dark = 0.7
      const themeSpeedMultiplier = isDark ? 0.7 : 1.0; 
      
      elapsed += delta * themeSpeedMultiplier;

      const objects = objectsRef.current;
      for (let i = 0; i < objects.length; i++) {
         const object = objects[i];
         if (object && object.scale && object.position) {
             const positionFactor = (object.position.x + object.position.z) * 0.001;
 
             const timeFactor = elapsed * 1.0;
             const baseAnimation = Math.sin(positionFactor + timeFactor) * 0.3 + 1.0;
 
             const randomOffset = object.userData.randomOffset || 0;
             const variation = Math.sin(elapsed * 0.8 + randomOffset) * 0.1;
 
             const finalScale = baseAnimation + variation;
             object.scale.setScalar(finalScale);
         }
      }

      renderer.render(scene, camera);
    };

    init();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      TWEEN.removeAll();
      if (containerRef.current) {
          containerRef.current.innerHTML = '';
      }
      objectsRef.current = [];
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-auto" id="css3d-container" />;
};