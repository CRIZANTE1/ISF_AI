import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Shape, ExtrudeGeometry, MeshPhysicalMaterial } from 'three';
import * as THREE from 'three';

// Criar geometria compartilhada uma única vez
const createBoxGeometry = () => {
    const shape = new Shape();
    const angleStep = Math.PI * 0.5;
    const radius = 1;

    shape.absarc(2, 2, radius, angleStep * 0, angleStep * 1);
    shape.absarc(-2, 2, radius, angleStep * 1, angleStep * 2);
    shape.absarc(-2, -2, radius, angleStep * 2, angleStep * 3);
    shape.absarc(2, -2, radius, angleStep * 3, angleStep * 4);

    const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 10, // Reduzido de 20 para melhor performance
        curveSegments: 10  // Reduzido de 20 para melhor performance
    };

    const geometry = new ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    return geometry;
};

// Criar material compartilhado uma única vez
const boxMaterial = new MeshPhysicalMaterial({
    color: "#232323",
    metalness: 1,
    roughness: 0.3,
    reflectivity: 0.5,
    ior: 1.5,
    emissive: "#000000",
    emissiveIntensity: 0,
    transparent: false,
    opacity: 1.0,
    transmission: 0.0,
    thickness: 0.5,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    sheen: 0,
    sheenRoughness: 1.0,
    sheenColor: "#ffffff",
    specularIntensity: 1.0,
    specularColor: "#ffffff",
    iridescence: 0.5, // Reduzido de 1 para melhor performance
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400],
    flatShading: false,
    side: 0,
    alphaTest: 0,
    depthWrite: true,
    depthTest: true
});

const Box = React.memo(({ position, rotation, geometry }: { 
    position: [number, number, number]; 
    rotation: [number, number, number];
    geometry: THREE.ExtrudeGeometry;
}) => {
    return (
        <mesh
            geometry={geometry}
            material={boxMaterial}
            position={position}
            rotation={rotation}
        />
    );
});

Box.displayName = 'Box';

const AnimatedBoxes = () => {
    const groupRef = useRef<THREE.Group | null>(null);
    
    // Memoizar a geometria compartilhada
    const sharedGeometry = useMemo(() => createBoxGeometry(), []);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.x += delta * 0.05;
        }
    });

    // Reduzir número de caixas de 50 para 30 para melhor performance
    const boxes = useMemo(() => 
        Array.from({ length: 30 }, (_, index) => ({
            position: [(index - 15) * 0.75, 0, 0] as [number, number, number],
            rotation: [
                (index - 7.5) * 0.1,
                Math.PI / 2,
                0
            ] as [number, number, number],
            id: index
        })), []
    );

    return (
        <group ref={groupRef}>
            {boxes.map((box) => (
                <Box
                    key={box.id}
                    position={box.position}
                    rotation={box.rotation}
                    geometry={sharedGeometry}
                />
            ))}
        </group>
    );
};

export const Scene = () => {
    const [cameraPosition] = React.useState<[number, number, number]>([5, 5, 20]);

    return (
        <div className="w-full h-full z-0">
            <Canvas 
                camera={{ position: cameraPosition, fov: 40 }}
                dpr={[1, 2]} // Limitar pixel ratio para melhor performance
                gl={{ 
                    antialias: true,
                    alpha: false,
                    powerPreference: "high-performance"
                }}
                performance={{ min: 0.5 }} // Reduzir qualidade se FPS cair
            >
                <ambientLight intensity={15} />
                <directionalLight position={[10, 10, 5]} intensity={15} />
                <AnimatedBoxes />
            </Canvas>
        </div>
    );
};

