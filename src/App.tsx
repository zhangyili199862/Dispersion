import * as THREE from "three";
import { OrbitControls, useFBO, useGLTF, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import vertexShader from "@/shaders/dispersion/vertex.glsl";
import fragmentShader from "@/shaders/dispersion/fragment.glsl";
import { useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { folder, useControls } from "leva";
import { range } from "@/utils";
const Dispersion = () => {
  const { size } = useThree();
  // This reference gives us direct access to our mesh
  const mesh = useRef<THREE.Mesh | null>(null);

  // This is our main render target where we'll render and store the scene as a texture
  const mainRenderTarget = useFBO();
  const backRenderTarget = useFBO();
  const backgroundGroup = useRef<THREE.Group | null>(null);
  const {
    light,
    shininess,
    diffuseness,
    fresnelPower,
    iorR,
    iorY,
    iorG,
    iorC,
    iorB,
    iorP,
    saturation,
    chromaticAberration,
    refraction,
  } = useControls({
    light: {
      value: new THREE.Vector3(-1.0, 1.0, 1.0),
    } as any,
    diffuseness: {
      value: 0.2,
    },
    shininess: {
      value: 40.0,
    },
    fresnelPower: {
      value: 8.0,
    },
    ior: folder({
      iorR: { min: 1.0, max: 2.333, step: 0.001, value: 1.15 },
      iorY: { min: 1.0, max: 2.333, step: 0.001, value: 1.16 },
      iorG: { min: 1.0, max: 2.333, step: 0.001, value: 1.18 },
      iorC: { min: 1.0, max: 2.333, step: 0.001, value: 1.22 },
      iorB: { min: 1.0, max: 2.333, step: 0.001, value: 1.22 },
      iorP: { min: 1.0, max: 2.333, step: 0.001, value: 1.22 },
    }),
    saturation: { value: 1.08, min: 1, max: 1.25, step: 0.01 },
    chromaticAberration: {
      value: 0.6,
      min: 0,
      max: 1.5,
      step: 0.01,
    },
    refraction: {
      value: 0.4,
      min: 0,
      max: 1,
      step: 0.01,
    },
  });

  const uniforms = useMemo(
    () => ({
      uTexture: {
        value: null,
      },
      uIorR: new THREE.Uniform(1.0),
      uIorY: new THREE.Uniform(1.0),
      uIorG: new THREE.Uniform(1.0),
      uIorC: new THREE.Uniform(1.0),
      uIorB: new THREE.Uniform(1.0),
      uIorP: new THREE.Uniform(1.0),
      uRefractPower: new THREE.Uniform(0.2),
      uChromaticAberration: new THREE.Uniform(1.0),
      uSaturation: new THREE.Uniform(0.0),
      uShininess: { value: 40.0 },
      uDiffuseness: { value: 0.2 },
      uFresnelPower: { value: 8.0 },
      uLight: {
        value: new THREE.Vector3(-1.0, 1.0, 1.0),
      },
      uResolution: {
        value: new THREE.Vector2(size.width, size.height).multiplyScalar(
          Math.min(window.devicePixelRatio, 2)
        ),
      },
    }),
    []
  );

  useFrame((state) => {
    const { gl, scene, camera } = state;
    if (mesh.current) {
      mesh.current.visible = false;
      const meshMaterial = mesh.current.material as THREE.ShaderMaterial;

      meshMaterial.uniforms.uDiffuseness.value = diffuseness;
      meshMaterial.uniforms.uShininess.value = shininess;
      meshMaterial.uniforms.uLight.value = new THREE.Vector3(
        light.x,
        light.y,
        light.z
      );
      meshMaterial.uniforms.uFresnelPower.value = fresnelPower;

      meshMaterial.uniforms.uIorR.value = iorR;
      meshMaterial.uniforms.uIorY.value = iorY;
      meshMaterial.uniforms.uIorG.value = iorG;
      meshMaterial.uniforms.uIorC.value = iorC;
      meshMaterial.uniforms.uIorB.value = iorB;
      meshMaterial.uniforms.uIorP.value = iorP;

      meshMaterial.uniforms.uSaturation.value = saturation;
      meshMaterial.uniforms.uChromaticAberration.value = chromaticAberration;
      meshMaterial.uniforms.uRefractPower.value = refraction;

      gl.setRenderTarget(backRenderTarget);
      gl.render(scene, camera);

      meshMaterial.uniforms.uTexture.value = backRenderTarget.texture;
      meshMaterial.side = THREE.BackSide;

      mesh.current.visible = true;

      gl.setRenderTarget(mainRenderTarget);
      gl.render(scene, camera);

      meshMaterial.uniforms.uTexture.value = mainRenderTarget.texture;
      meshMaterial.side = THREE.FrontSide;

      gl.setRenderTarget(null);
      if (backgroundGroup.current) {
        backgroundGroup.current.rotation.z = state.clock.elapsedTime;
      }
    }
  });
  const { nodes } = useGLTF("/models/suzanne.glb");
  const columns = range(-5, 5, 2.5);
  const rows = range(-5, 5, 2.5);
  return (
    <>
      <color attach="background" args={["black"]} />
      <group ref={backgroundGroup}>
        {columns.map((col: number) =>
          rows.map((row: number) => (
            <mesh position={[col, row, -4]} key={uuidv4()}>
              <icosahedronGeometry args={[0.6, 8]} />
              <meshStandardMaterial color="white" />
            </mesh>
          ))
        )}
      </group>
      <mesh
        ref={mesh}
        geometry={(nodes.Suzanne as THREE.Mesh).geometry}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <shaderMaterial
          key={uuidv4()}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <Stars />
    </>
  );
};
function Scene() {
  return (
    <>
      <Canvas
        camera={{
          position: [0, 0, 9],
        }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={5.0} />

        <OrbitControls makeDefault />
        <Dispersion />
      </Canvas>
    </>
  );
}
function App() {
  return (
    <>
      <Scene />
    </>
  );
}

export default App;
