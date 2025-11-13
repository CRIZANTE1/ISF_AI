"use client";

import React, { useEffect, useRef, forwardRef } from "react";
import * as THREE from "three";
import { cn } from "../../utils/cn";

export interface SingularityShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  intensity?: number;
  size?: number;
  waveStrength?: number;
  colorShift?: number;
}

const SingularityShaders = forwardRef<HTMLDivElement, SingularityShadersProps>(({
  className,
  speed = 1.0,
  intensity = 1.0,
  size = 1.0,
  waveStrength = 1.0,
  colorShift = 1.0,
  ...props
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    camera: THREE.Camera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    uniforms: any;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const fragmentShader = `
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_size;
      uniform float u_waveStrength;
      uniform float u_colorShift;
      uniform vec2 iResolution;
      uniform float iTime;

      void main() {
        float i = .2 * u_speed, a;
        vec2 F = gl_FragCoord.xy;
        vec2 r = iResolution.xy,
             p = ( F+F - r ) / r.y / (.7 * u_size),
             d = vec2(-1,1),
             b = p - i*d,
             c = p * mat2(1, 1, d/(.1 + i/dot(b,b))),
             v = c * mat2(cos(.5*log(a=dot(c,c)) + iTime*i*u_speed + vec4(0,33,11,0)))/i,
             w = vec2(0.0);
        for(float j = 0.0; j < 9.0; j++) {
          i++;
          w += 1.0 + sin(v * u_waveStrength);
          v += .7 * sin(v.yx * i + iTime * u_speed) / i + .5;
        }
        i = length( sin(v/.3)*.4 + c*(3.+d) );
        vec4 colorGrad = vec4(.6,-.4,-1,0) * u_colorShift;
        vec4 O = 1. - exp( -exp( c.x * colorGrad )
                     / w.xyyx
                     / ( 2. + i*i/4. - i )
                     / ( .5 + 1. / a )
                     / ( .03 + abs( length(p)-.7 ) )
                     * u_intensity
               );
        gl_FragColor = O;
      }
    `;

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `;

    // Initialize Three.js scene
    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      u_speed: { type: "f", value: speed },
      u_intensity: { type: "f", value: intensity },
      u_size: { type: "f", value: size },
      u_waveStrength: { type: "f", value: waveStrength },
      u_colorShift: { type: "f", value: colorShift },
      iResolution: { type: "v2", value: new THREE.Vector2() },
      iTime: { type: "f", value: 0.0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false 
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 1); // Fundo preto

    container.appendChild(renderer.domElement);

    // Handle window resize
    const onWindowResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.iResolution.value.x = renderer.domElement.width;
      uniforms.iResolution.value.y = renderer.domElement.height;
    };

    // Initial resize
    onWindowResize();
    window.addEventListener("resize", onWindowResize, false);

    let startTime = Date.now();

    // Animation loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      uniforms.iTime.value = (Date.now() - startTime) / 1000.0;
      renderer.render(scene, camera);

      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }
    };

    // Store scene references for cleanup
    sceneRef.current = {
      camera,
      scene,
      renderer,
      uniforms,
      animationId: 0,
    };

    // Start animation
    animate();

    // Cleanup function
    return () => {
      window.removeEventListener("resize", onWindowResize);

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);

        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement);
        }

        sceneRef.current.renderer.dispose();
        geometry.dispose();
        material.dispose();
      }
    };
  }, [speed, intensity, size, waveStrength, colorShift]);

  return (
    <div
      ref={ref || containerRef}
      className={cn('w-full h-full', className)}
      style={{ backgroundColor: '#000000' }}
      {...props}
    />
  );
});

SingularityShaders.displayName = "SingularityShaders";

export { SingularityShaders };

