import { useEffect, useRef } from "react";

export function ThreeMarketStage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let disposed = false;
    let cleanup = () => {};

    async function start() {
      const THREE = await import("three");
      if (disposed) return;

      let frameId = 0;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 11);

      const group = new THREE.Group();
      scene.add(group);

      const pointGeometry = new THREE.BufferGeometry();
      const pointCount = 72;
      const positions = new Float32Array(pointCount * 3);
      for (let index = 0; index < pointCount; index += 1) {
        positions[index * 3] = (Math.random() - 0.5) * 12;
        positions[index * 3 + 1] = (Math.random() - 0.5) * 5.4;
        positions[index * 3 + 2] = (Math.random() - 0.5) * 5;
      }
      pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const pointMaterial = new THREE.PointsMaterial({
        color: 0x3182f6,
        size: 0.035,
        transparent: true,
        opacity: 0.34
      });
      const points = new THREE.Points(pointGeometry, pointMaterial);
      group.add(points);

      const curveMaterial = new THREE.LineBasicMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.22
      });
      const curveGeometries = [];
      for (let row = 0; row < 5; row += 1) {
        const curve = new THREE.CatmullRomCurve3(
          Array.from({ length: 7 }, (_, index) => {
            const x = -5.4 + index * 1.8;
            const y = -1.8 + row * 0.8 + Math.sin(index + row) * 0.18;
            return new THREE.Vector3(x, y, -1.5 + row * 0.2);
          })
        );
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
        curveGeometries.push(geometry);
        group.add(new THREE.Line(geometry, curveMaterial));
      }

      function resize() {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      function animate(time) {
        group.rotation.y = Math.sin(time * 0.00022) * 0.08;
        group.rotation.x = Math.cos(time * 0.00018) * 0.04;
        points.rotation.z += 0.0008;
        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(animate);
      }

      resize();
      window.addEventListener("resize", resize);
      frameId = window.requestAnimationFrame(animate);

      cleanup = () => {
        window.cancelAnimationFrame(frameId);
        window.removeEventListener("resize", resize);
        pointGeometry.dispose();
        pointMaterial.dispose();
        curveGeometries.forEach((geometry) => geometry.dispose());
        curveMaterial.dispose();
        renderer.dispose();
      };
    }

    start();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas className="threeStage" ref={canvasRef} aria-hidden="true" />;
}
