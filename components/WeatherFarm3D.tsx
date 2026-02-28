"use client";

import React, { useEffect, useRef } from 'react';

interface WeatherFarm3DProps {
    season: 'kharif' | 'rabi' | 'zaid' | 'winter';
    weather: 'rain' | 'sunny' | 'cloudy' | 'snow';
}

declare global {
    interface Window {
        THREE: any;
    }
}

export default function WeatherFarm3D({ season, weather }: WeatherFarm3DProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<any>(null);
    const sceneRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const particlesRef = useRef<any>(null);
    const cropsRef = useRef<any>([]);
    const requestRef = useRef<number | undefined>(undefined);
    const isInitialized = useRef<boolean>(false);

    // Controls state
    const controlsRef = useRef({
        isMouseDown: false,
        previousMousePosition: { x: 0, y: 0 },
        spherical: { theta: 0.6, phi: 0.8, radius: 18 }
    });

    useEffect(() => {
        if (!window.THREE) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.async = true;
            script.onload = () => {
                if (!isInitialized.current) initThree();
            };
            document.head.appendChild(script);
        } else {
            if (!isInitialized.current) initThree();
        }

        return () => {
            isInitialized.current = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (rendererRef.current && containerRef.current && rendererRef.current.domElement) {
                if (containerRef.current.contains(rendererRef.current.domElement)) {
                    containerRef.current.removeChild(rendererRef.current.domElement);
                }
            }
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (sceneRef.current && isInitialized.current) {
            updateEnvironment();
            updateCrops();
        }
    }, [season, weather]);

    const handleMouseDown = (e: any) => {
        controlsRef.current.isMouseDown = true;
        controlsRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        controlsRef.current.isMouseDown = false;
    };

    const handleMouseMove = (e: any) => {
        if (!controlsRef.current.isMouseDown) return;
        const deltaX = e.clientX - controlsRef.current.previousMousePosition.x;
        const deltaY = e.clientY - controlsRef.current.previousMousePosition.y;

        controlsRef.current.spherical.theta -= deltaX * 0.008;
        controlsRef.current.spherical.phi = Math.max(0.1, Math.min(1.5, controlsRef.current.spherical.phi - deltaY * 0.008));

        controlsRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
        updateCamera();
    };

    const handleWheel = (e: any) => {
        controlsRef.current.spherical.radius = Math.max(8, Math.min(30, controlsRef.current.spherical.radius + e.deltaY * 0.02));
        updateCamera();
    };

    const handleKeyDown = (e: any) => {
        const s = controlsRef.current.spherical;
        switch (e.key) {
            case 'ArrowLeft': s.theta -= 0.1; break;
            case 'ArrowRight': s.theta += 0.1; break;
            case 'ArrowUp': s.phi = Math.max(0.1, s.phi - 0.1); break;
            case 'ArrowDown': s.phi = Math.min(1.5, s.phi + 0.1); break;
            case '+': s.radius = Math.max(8, s.radius - 1); break;
            case '-': s.radius = Math.min(30, s.radius + 1); break;
        }
        updateCamera();
    };

    const updateCamera = () => {
        if (!cameraRef.current) return;
        const s = controlsRef.current.spherical;
        cameraRef.current.position.set(
            s.radius * Math.sin(s.theta) * Math.sin(s.phi),
            s.radius * Math.cos(s.phi),
            s.radius * Math.cos(s.theta) * Math.sin(s.phi)
        );
        cameraRef.current.lookAt(0, 1, 0);
    };

    const initThree = () => {
        const THREE = window.THREE;
        if (!containerRef.current || isInitialized.current) return;
        isInitialized.current = true;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        cameraRef.current = camera;
        updateCamera();

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Ground Construction
        const groundGroup = new THREE.Group();

        // Proper brown soil ground
        const soilGeo = new THREE.PlaneGeometry(30, 30);
        const soilMat = new THREE.MeshPhongMaterial({ color: 0x4d3319 });
        const soil = new THREE.Mesh(soilGeo, soilMat);
        soil.rotation.x = -Math.PI / 2;
        groundGroup.add(soil);

        // Dirt path through the middle
        const pathGeo = new THREE.PlaneGeometry(4, 30);
        const pathMat = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
        const path = new THREE.Mesh(pathGeo, pathMat);
        path.rotation.x = -Math.PI / 2;
        path.position.y = 0.05;
        groundGroup.add(path);

        // Fence
        const fenceMat = new THREE.MeshPhongMaterial({ color: 0x5d4037 });
        for (let i = -15; i <= 15; i += 3) {
            const postGeo = new THREE.BoxGeometry(0.2, 1.2, 0.2);
            const postPos = [[i, 15], [i, -15], [15, i], [-15, i]];
            postPos.forEach(([px, pz]) => {
                const post = new THREE.Mesh(postGeo, fenceMat);
                post.position.set(px, 0.6, pz);
                groundGroup.add(post);
            });
        }

        // Farmhouse/Hut
        const building = new THREE.Group();
        const baseGeo = new THREE.BoxGeometry(4, 3, 4);
        const baseMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 1.5;
        building.add(base);

        const roofGeo = new THREE.ConeGeometry(3.5, 2.5, 4);
        const roofMat = new THREE.MeshPhongMaterial({ color: 0xa52a2a });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 4.25;
        roof.rotation.y = Math.PI / 4;
        building.add(roof);

        building.position.set(-10, 0, -10);
        groundGroup.add(building);

        scene.add(groundGroup);

        updateEnvironment();
        updateCrops();

        const animate = () => {
            if (!isInitialized.current) return;
            requestRef.current = requestAnimationFrame(animate);

            const time = Date.now() * 0.002;
            cropsRef.current.forEach((crop: any, i: number) => {
                crop.rotation.z = Math.sin(time + i) * 0.05;
                crop.rotation.x = Math.cos(time * 0.5 + i) * 0.03;
            });

            if (particlesRef.current) {
                const positions = particlesRef.current.geometry.attributes.position.array;
                if (weather === 'rain') {
                    for (let i = 0; i < positions.length; i += 6) {
                        positions[i + 1] -= 0.8; // y1 (Faster fall)
                        positions[i + 4] -= 0.8; // y2
                        positions[i] -= 0.07;    // x1 (Wind angle)
                        positions[i + 3] -= 0.07; // x2

                        if (positions[i + 1] < 0) {
                            const x = Math.random() * 40 - 20;
                            const z = Math.random() * 40 - 20;
                            const y = 40;
                            const dropLen = 0.8 + Math.random() * 0.4; // Real streak length
                            positions[i] = x;
                            positions[i + 1] = y;
                            positions[i + 2] = z;
                            positions[i + 3] = x;
                            positions[i + 4] = y - dropLen;
                            positions[i + 5] = z;
                        }
                    }
                } else if (weather === 'snow') {
                    for (let i = 0; i < positions.length; i += 3) {
                        positions[i + 1] -= 0.12;
                        positions[i] += Math.sin(time + i) * 0.03;

                        if (positions[i + 1] < 0) {
                            positions[i + 1] = 40;
                        }
                    }
                }
                particlesRef.current.geometry.attributes.position.needsUpdate = true;
            }

            renderer.render(scene, camera);
        };

        animate();

        const container = containerRef.current;
        container.addEventListener('mousedown', handleMouseDown);
        container.addEventListener('wheel', handleWheel);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('keydown', handleKeyDown);

        window.addEventListener('resize', () => {
            if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
            cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        });
    };

    const updateEnvironment = () => {
        const THREE = window.THREE;
        const scene = sceneRef.current;
        if (!scene || !rendererRef.current) return;

        // Clear existing lights and effects properly
        const toRemove: any[] = [];
        scene.traverse((object: any) => {
            if (object.isLight || object.isPoints || object.isLineSegments || (object.name === 'sun')) {
                toRemove.push(object);
            }
        });
        toRemove.forEach(obj => scene.remove(obj));

        particlesRef.current = null;

        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, weather === 'cloudy' ? 0.3 : 0.6);
        scene.add(ambientLight);

        // Sky and Weather Logic
        let skyColor = 0x87ceeb;
        if (weather === 'rain') skyColor = 0x2C3E50;
        if (weather === 'cloudy') skyColor = 0x6D7B8D;
        if (weather === 'snow') skyColor = 0xB0C4DE;
        rendererRef.current.setClearColor(skyColor, 1);

        if (weather === 'sunny') {
            const sunGeo = new THREE.SphereGeometry(1.2, 32, 32); // Slightly bigger sun
            const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
            const sun = new THREE.Mesh(sunGeo, sunMat);
            sun.name = 'sun';
            sun.position.set(12, 18, -12);
            scene.add(sun);

            const sunLight = new THREE.PointLight(0xFFE88A, 1.8, 120);
            sunLight.position.set(12, 18, -12);
            scene.add(sunLight);
        } else {
            const dirLight = new THREE.DirectionalLight(0xffffff, weather === 'rain' ? 0.2 : 0.6);
            dirLight.position.set(10, 20, 10);
            scene.add(dirLight);
        }

        // Particle System: RAIN (Optimized & Realistic)
        if (weather === 'rain') {
            const count = 1200; // Optimal count for performance
            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            for (let i = 0; i < count; i++) {
                const x = Math.random() * 40 - 20;
                const y = Math.random() * 40;
                const z = Math.random() * 40 - 20;
                const dropLen = 0.8 + Math.random() * 0.4;
                vertices.push(x, y, z, x, y - dropLen, z);
            }
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            const material = new THREE.LineBasicMaterial({
                color: 0xAACCFF,
                transparent: true,
                opacity: 0.6,
                linewidth: 1 // Only works in some drivers, but good to have
            });
            const rain = new THREE.LineSegments(geometry, material);
            scene.add(rain);
            particlesRef.current = rain;
        } else if (weather === 'snow') {
            const count = 600;
            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            for (let i = 0; i < count; i++) {
                vertices.push(Math.random() * 40 - 20, Math.random() * 40, Math.random() * 40 - 20);
            }
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, transparent: true, opacity: 0.9 });
            const snow = new THREE.Points(geometry, material);
            scene.add(snow);
            particlesRef.current = snow;
        }
    };

    const updateCrops = () => {
        const THREE = window.THREE;
        const scene = sceneRef.current;
        if (!scene) return;

        cropsRef.current.forEach((crop: any) => scene.remove(crop));
        cropsRef.current = [];

        const rows = 10;
        const cols = 10;
        const spacing = 1.8;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (Math.abs((i - rows / 2) * spacing) < 2.5) continue;
                if (i < 4 && j < 4) continue;

                const plant = new THREE.Group();

                if (season === 'kharif') {
                    // Rice (Detailed)
                    const stemGeo = new THREE.CylinderGeometry(0.03, 0.05, 1.5, 6);
                    const stemMat = new THREE.MeshPhongMaterial({ color: 0x4A9A2A });
                    const stem = new THREE.Mesh(stemGeo, stemMat);
                    stem.position.y = 0.75;
                    plant.add(stem);

                    const headGeo = new THREE.SphereGeometry(0.12, 8, 8);
                    headGeo.scale(1, 3, 1);
                    const headMat = new THREE.MeshPhongMaterial({ color: 0xC8A040 });
                    const head = new THREE.Mesh(headGeo, headMat);
                    head.position.y = 1.6;
                    plant.add(head);

                    for (let l = 0; l < 3; l++) {
                        const leafGeo = new THREE.BoxGeometry(0.1, 0.9, 0.01);
                        const leaf = new THREE.Mesh(leafGeo, stemMat);
                        leaf.position.y = 0.8;
                        leaf.rotation.y = (l * Math.PI * 2) / 3;
                        leaf.rotation.x = 0.6;
                        plant.add(leaf);
                    }
                } else if (season === 'rabi' || season === 'winter') {
                    // Wheat (Multi-stalk)
                    const stalkMat = new THREE.MeshPhongMaterial({ color: 0x7CB342 });
                    const earMat = new THREE.MeshPhongMaterial({ color: 0xD4A840 });
                    for (let s = 0; s < 3; s++) {
                        const stalk = new THREE.Group();
                        const sGeo = new THREE.CylinderGeometry(0.02, 0.04, 1.6, 5);
                        const stem = new THREE.Mesh(sGeo, stalkMat);
                        stem.position.y = 0.8;
                        stalk.add(stem);

                        const eGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6);
                        const ear = new THREE.Mesh(eGeo, earMat);
                        ear.position.y = 1.7;
                        stalk.add(ear);

                        if (season === 'winter') {
                            const snowGeo = new THREE.SphereGeometry(0.18, 8, 8);
                            snowGeo.scale(1, 0.4, 1);
                            const snowMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
                            const snow = new THREE.Mesh(snowGeo, snowMat);
                            snow.position.y = 1.95;
                            stalk.add(snow);
                        }
                        stalk.position.x = (s - 1) * 0.18;
                        stalk.rotation.z = (s - 1) * 0.15;
                        plant.add(stalk);
                    }
                } else {
                    // Zaid (Fresh Watermelon)
                    const vineMat = new THREE.MeshPhongMaterial({ color: 0x2E7D2E });
                    const fruitMat = new THREE.MeshPhongMaterial({ color: 0x1B5E20 });

                    const vineGeo = new THREE.TorusGeometry(0.35, 0.08, 8, 16);
                    const vine = new THREE.Mesh(vineGeo, vineMat);
                    vine.rotation.x = Math.PI / 2;
                    plant.add(vine);

                    const fruitGeo = new THREE.SphereGeometry(0.35, 16, 16);
                    fruitGeo.scale(1.5, 1, 1);
                    const fruit = new THREE.Mesh(fruitGeo, fruitMat);
                    fruit.position.y = 0.25;
                    // Add stripe logic if needed - keeping it simple for perf
                    plant.add(fruit);
                }

                plant.position.set((i - rows / 2) * spacing, 0, (j - cols / 2) * spacing);
                scene.add(plant);
                cropsRef.current.push(plant);
            }
        }
    };

    return (
        <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-inner group bg-gray-900/10">
            <div
                ref={containerRef}
                className="w-full h-full cursor-move"
                style={{ touchAction: 'none' }}
            />

            {/* Hindi Control Guide Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-lg rounded-2xl p-4 border border-white/20 pointer-events-none transition-all opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100">
                <ul className="text-[12px] font-bold text-white/95 space-y-2 tracking-wide">
                    <li className="flex items-center gap-2"><span>🖱️</span> Drag = Ghumayen</li>
                    <li className="flex items-center gap-2"><span>🖱️</span> Scroll = Chhota-Bada</li>
                    <li className="flex items-center gap-2"><span>⌨️</span> Arrows = Ghumayen</li>
                    <li className="flex items-center gap-2"><span>⌨️</span> +/- = Zoom</li>
                </ul>
            </div>
        </div>
    );
}

