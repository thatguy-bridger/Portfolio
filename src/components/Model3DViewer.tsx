import { useEffect, useRef, useState } from 'react';
import type * as THREE_TYPES from 'three';
import type { Model3DFormat } from '../data/siteData';

async function loadModel(THREE: typeof THREE_TYPES, format: Model3DFormat, src: string): Promise<THREE_TYPES.Object3D> {
  switch (format) {
    case '.glb':
    case '.gltf': {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const gltf = await new GLTFLoader().loadAsync(src);
      return gltf.scene;
    }
    case '.obj': {
      const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
      return await new OBJLoader().loadAsync(src);
    }
    case '.fbx': {
      const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
      return await new FBXLoader().loadAsync(src);
    }
    case '.stl': {
      const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
      const geometry = await new STLLoader().loadAsync(src);
      geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x9aa0ac, metalness: 0.15, roughness: 0.55 }));
    }
    case '.ply': {
      const { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader.js');
      const geometry = await new PLYLoader().loadAsync(src);
      geometry.computeVertexNormals();
      return new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0x9aa0ac, vertexColors: geometry.hasAttribute('color') }),
      );
    }
  }
}

/** Frees GPU resources for everything under an object — three.js doesn't do this automatically on removal. */
function disposeObject(object: THREE_TYPES.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE_TYPES.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    if (material) {
      const materials = Array.isArray(material) ? material : [material];
      for (const m of materials) {
        Object.values(m).forEach((v) => {
          if (v && typeof v === 'object' && 'isTexture' in v) (v as THREE_TYPES.Texture).dispose();
        });
        m.dispose();
      }
    }
  });
}

/**
 * Loads and renders an interactive 3D model — orbit/pan/zoom with the
 * mouse or touch, gently auto-rotating until the viewer touches it. Runs
 * plain three.js (not react-three-fiber) so only the specific format
 * loader a given model needs is ever downloaded, and everything about the
 * WebGL context is disposed on unmount.
 */
export function Model3DViewer({ src, format }: { src: string; format: Model3DFormat }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let disposed = false;
    let renderer: THREE_TYPES.WebGLRenderer | undefined;
    let controls: { dispose: () => void; update: () => void; target: THREE_TYPES.Vector3; autoRotate: boolean } | undefined;
    let animationId = 0;
    let resizeObserver: ResizeObserver | undefined;
    let loadedObject: THREE_TYPES.Object3D | undefined;

    setStatus('loading');

    (async () => {
      const [THREE, { OrbitControls }] = await Promise.all([
        import('three'),
        import('three/examples/jsm/controls/OrbitControls.js'),
      ]);
      const container = containerRef.current;
      if (!container || disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / Math.max(container.clientHeight, 1), 0.01, 2000);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 1));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
      dirLight.position.set(3, 5, 4);
      scene.add(dirLight);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
      fillLight.position.set(-4, -2, -3);
      scene.add(fillLight);

      const orbit = new OrbitControls(camera, renderer.domElement);
      orbit.enableDamping = true;
      orbit.autoRotate = true;
      orbit.autoRotateSpeed = 1.1;
      orbit.addEventListener('start', () => {
        orbit.autoRotate = false;
      });
      controls = orbit;

      let object: THREE_TYPES.Object3D;
      try {
        object = await loadModel(THREE, format, src);
      } catch {
        if (!disposed) setStatus('error');
        return;
      }
      if (disposed) {
        disposeObject(object);
        return;
      }
      loadedObject = object;
      scene.add(object);

      // Center the model at the origin and frame the camera to fit it, regardless of its native scale.
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const distance = (maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360))) * 1.7;
      camera.position.set(distance * 0.6, distance * 0.45, distance);
      camera.near = maxDim / 100;
      camera.far = maxDim * 100;
      camera.updateProjectionMatrix();
      orbit.target.set(0, 0, 0);
      orbit.update();

      setStatus('ready');

      function animate() {
        animationId = requestAnimationFrame(animate);
        orbit!.update();
        renderer!.render(scene, camera);
      }
      animate();

      resizeObserver = new ResizeObserver(() => {
        if (!container || !renderer) return;
        camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      });
      resizeObserver.observe(container);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      controls?.dispose();
      if (loadedObject) disposeObject(loadedObject);
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [src, format]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 380,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'var(--surface-card)',
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />
      {status !== 'ready' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            pointerEvents: 'none',
          }}
        >
          {status === 'loading' ? 'Loading model…' : "Couldn't load this model."}
        </div>
      )}
    </div>
  );
}
