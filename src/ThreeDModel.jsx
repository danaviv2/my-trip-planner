import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ThreeDModel = ({ modelPath }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(300, 300);

    mountRef.current.appendChild(renderer.domElement);

    const loader = new GLTFLoader();
    loader.load(
      modelPath || '/models/eiffel_tower.glb', // נסה עם נתיב מ-public
      (gltf) => {
        scene.add(gltf.scene);
        console.log('מודל נטען בהצלחה:', gltf);
      },
      (progress) => {
        console.log('טעינת המודל:', (progress.loaded / progress.total) * 100 + '%');
      },
      (error) => {
        console.error('שגיאה בטעינת המודל:', error);
        // הוסף תצוגה חלופית אם המודל לא נטען
        const placeholder = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        scene.add(placeholder);
      }
    );

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelPath]);

  return <div ref={mountRef} style={{ width: '300px', height: '300px' }} />;
};

export default ThreeDModel;