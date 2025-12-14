import React, { useEffect, useRef, useState, useCallback } from 'react';

// Fast UUID generator, RFC4122 version 4 compliant
const generateUUID = () => {
  const lut = Array(256).fill(0).map((_, i) => (i < 16 ? '0' : '') + i.toString(16));
  const d0 = Math.random() * 0xffffffff | 0;
  const d1 = Math.random() * 0xffffffff | 0;
  const d2 = Math.random() * 0xffffffff | 0;
  const d3 = Math.random() * 0xffffffff | 0;
  return (
    lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
    lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
    lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
    lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff]
  );
};

interface StarfieldProps {
  starColor?: string;
  bgColor?: string;
  mouseAdjust?: boolean;
  tiltAdjust?: boolean;
  easing?: number;
  clickToWarp?: boolean;
  hyperspace?: boolean;
  warpFactor?: number;
  opacity?: number;
  speed?: number;
  quantity?: number;
}

const Starfield: React.FC<StarfieldProps> = ({
  starColor = 'rgba(255,255,255,1)',
  bgColor = 'rgba(0,0,0,1)',
  mouseAdjust = false,
  tiltAdjust = false,
  easing = 1,
  clickToWarp = false,
  hyperspace = false,
  warpFactor = 10,
  opacity = 0.1,
  speed = 1,
  quantity = 512,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({
    init: true,
    canvas: true,
    start: true,
    stop: false,
    destroy: false,
    reset: false,
    uid: generateUUID(),
    running: false,
    hyperspace: false,
  });
  const mouse = useRef({ x: 0, y: 0 });
  const cursor = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  const sd = useRef<{
    w: number;
    h: number;
    ctx: CanvasRenderingContext2D | null;
    cw: number;
    ch: number;
    x: number;
    y: number;
    z: number;
    star: { colorRatio: number; arr: (number | boolean)[][] };
    prevTime: number;
  }>({
    w: 0,
    h: 0,
    ctx: null,
    cw: 0,
    ch: 0,
    x: 0,
    y: 0,
    z: 0,
    star: { colorRatio: 0, arr: [] },
    prevTime: 0,
  });

  const colors = {
    fill: hyperspace || state.hyperspace ? `rgba(0,0,0,${opacity})` : bgColor,
  };

  const compSpeed = hyperspace || state.hyperspace ? speed * warpFactor : speed;
  const ratio = quantity / 2;

  const measureViewport = useCallback(() => {
    // Use window dimensions for fixed position
    sd.current.w = window.innerWidth;
    sd.current.h = window.innerHeight;
    sd.current.x = Math.round(sd.current.w / 2);
    sd.current.y = Math.round(sd.current.h / 2);
    sd.current.z = (sd.current.w + sd.current.h) / 2;
    sd.current.star.colorRatio = sd.current.z > 0 ? 1 / sd.current.z : 0.001;

    if (cursor.current.x === 0 || cursor.current.y === 0) {
      cursor.current.x = sd.current.x;
      cursor.current.y = sd.current.y;
    }
    if (mouse.current.x === 0 || mouse.current.y === 0) {
      mouse.current.x = cursor.current.x - sd.current.x;
      mouse.current.y = cursor.current.y - sd.current.y;
    }
  }, []);

  const setupCanvas = useCallback(() => {
    measureViewport();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        sd.current.ctx = ctx;
        canvas.width = sd.current.w;
        canvas.height = sd.current.h;
        sd.current.ctx.fillStyle = colors.fill;
        sd.current.ctx.strokeStyle = starColor;
      }
    }
  }, [colors.fill, starColor, measureViewport]);

  const bigBang = useCallback(() => {
    if (sd.current.star.arr.length !== quantity) {
      sd.current.star.arr = new Array(quantity).fill(0).map(() => [
        Math.random() * sd.current.w * 2 - sd.current.x * 2,
        Math.random() * sd.current.h * 2 - sd.current.y * 2,
        Math.round(Math.random() * sd.current.z),
        0,
        0,
        0,
        0,
        true,
      ]);
    }
  }, [quantity]);

  const resize = useCallback(() => {
    const oldStar = { arr: [...sd.current.star.arr] };
    measureViewport();
    sd.current.cw = sd.current.ctx?.canvas.width || 0;
    sd.current.ch = sd.current.ctx?.canvas.height || 0;

    if (sd.current.cw !== sd.current.w || sd.current.ch !== sd.current.h) {
      sd.current.x = Math.round(sd.current.w / 2);
      sd.current.y = Math.round(sd.current.h / 2);
      sd.current.z = (sd.current.w + sd.current.h) / 2;
      sd.current.star.colorRatio = sd.current.z > 0 ? 1 / sd.current.z : 0.001;

      const rw = sd.current.w / (sd.current.cw || 1);
      const rh = sd.current.h / (sd.current.ch || 1);

      if (sd.current.ctx && canvasRef.current) {
        canvasRef.current.width = sd.current.w;
        canvasRef.current.height = sd.current.h;

        if (!sd.current.star.arr.length) {
          bigBang();
        } else {
          sd.current.star.arr = sd.current.star.arr.map((star, i) => {
            const newStar = [...star];
            if (oldStar.arr[i]) {
              newStar[0] = (oldStar.arr[i][0] as number) * rw;
              newStar[1] = (oldStar.arr[i][1] as number) * rh;
              if ((newStar[2] as number) > 0) {
                newStar[3] = sd.current.x + ((newStar[0] as number) / (newStar[2] as number)) * ratio;
                newStar[4] = sd.current.y + ((newStar[1] as number) / (newStar[2] as number)) * ratio;
              }
            }
            return newStar;
          });
        }

        sd.current.ctx.fillStyle = colors.fill;
        sd.current.ctx.strokeStyle = starColor;
      }
    }
  }, [measureViewport, bigBang, ratio, colors.fill, starColor]);

  const update = useCallback(() => {
    // Se mouseAdjust estiver desabilitado, movimento fixo para leste (direita)
    if (mouseAdjust) {
      mouse.current.x = (cursor.current.x - sd.current.x) / easing;
      mouse.current.y = (cursor.current.y - sd.current.y) / easing;
    } else {
      // Movimento fixo no centro, direção leste (direita)
      mouse.current.x = 0;
      mouse.current.y = 0;
    }

    if (sd.current.star.arr.length > 0) {
      sd.current.star.arr = sd.current.star.arr.map(star => {
        const newStar = [...star];
        newStar[7] = true;
        newStar[5] = newStar[3];
        newStar[6] = newStar[4];
        // Movimento fixo para leste (direita) quando mouseAdjust está desabilitado
        if (mouseAdjust) {
          newStar[0] = (newStar[0] as number) + (mouse.current.x >> 4);
        } else {
          // Movimento fixo para direita (leste) - valor positivo pequeno
          newStar[0] = (newStar[0] as number) + 2;
        }

        if ((newStar[0] as number) > sd.current.x << 1) {
          newStar[0] = (newStar[0] as number) - (sd.current.w << 1);
          newStar[7] = false;
        }
        if ((newStar[0] as number) < -sd.current.x << 1) {
          newStar[0] = (newStar[0] as number) + (sd.current.w << 1);
          newStar[7] = false;
        }

        // Movimento vertical apenas se mouseAdjust estiver habilitado
        if (mouseAdjust) {
          newStar[1] = (newStar[1] as number) + (mouse.current.y >> 4);
        }
        if ((newStar[1] as number) > sd.current.y << 1) {
          newStar[1] = (newStar[1] as number) - (sd.current.h << 1);
          newStar[7] = false;
        }
        if ((newStar[1] as number) < -sd.current.y << 1) {
          newStar[1] = (newStar[1] as number) + (sd.current.h << 1);
          newStar[7] = false;
        }

        newStar[2] = (newStar[2] as number) - compSpeed;
        if ((newStar[2] as number) > sd.current.z) {
          newStar[2] = (newStar[2] as number) - sd.current.z;
          newStar[7] = false;
        }
        if ((newStar[2] as number) < 0) {
          newStar[2] = (newStar[2] as number) + sd.current.z;
          newStar[7] = false;
        }

        if ((newStar[2] as number) > 0) {
          newStar[3] = sd.current.x + ((newStar[0] as number) / (newStar[2] as number)) * ratio;
          newStar[4] = sd.current.y + ((newStar[1] as number) / (newStar[2] as number)) * ratio;
        }
        return newStar;
      });
    }
  }, [mouseAdjust, easing, compSpeed, ratio]);

  const draw = useCallback(() => {
    const ctx = sd.current.ctx;
    if (!ctx) return;

    // Clear canvas with transparent or very dark background
    ctx.clearRect(0, 0, sd.current.w, sd.current.h);
    ctx.fillStyle = colors.fill;
    ctx.fillRect(0, 0, sd.current.w, sd.current.h);
    ctx.strokeStyle = starColor;

    sd.current.star.arr.forEach(star => {
      if (
        (star[5] as number) > 0 &&
        (star[5] as number) < sd.current.w &&
        (star[6] as number) > 0 &&
        (star[6] as number) < sd.current.h &&
        star[7]
      ) {
        ctx.lineWidth = Math.max(0.5, (1 - sd.current.star.colorRatio * (star[2] as number)) * 2);
        ctx.beginPath();
        ctx.moveTo(star[5] as number, star[6] as number);
        ctx.lineTo(star[3] as number, star[4] as number);
        ctx.stroke();
        ctx.closePath();
      }
    });
  }, [colors.fill, starColor]);

  const animate = useCallback(() => {
    if (sd.current.prevTime === 0) {
      sd.current.prevTime = Date.now();
    }
    resize();
    update();
    draw();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [resize, update, draw]);

  const init = useCallback(() => {
    if (!canvasRef.current) return;
    measureViewport();
    setupCanvas();
    if (sd.current.ctx) {
      bigBang();
      animate();
      setState(prev => ({ ...prev, running: true }));
    }
  }, [measureViewport, setupCanvas, bigBang, animate]);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      setState(prev => ({ ...prev, running: false }));
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    sd.current.star.arr = [];
    init();
  }, [stop, init]);

  const destroy = useCallback(() => {
    stop();
    sd.current = {
      w: 0,
      h: 0,
      ctx: null,
      cw: 0,
      ch: 0,
      x: 0,
      y: 0,
      z: 0,
      star: { colorRatio: 0, arr: [] },
      prevTime: 0,
    };
  }, [stop]);

  const mouseHandler = (event: MouseEvent) => {
    cursor.current.x = event.pageX || event.clientX;
    cursor.current.y = event.pageY || event.clientY;
  };

  const tiltHandler = (event: DeviceOrientationEvent) => {
    if (event.beta !== null && event.gamma !== null) {
      const x = event.gamma;
      const y = event.beta;
      cursor.current.x = (sd.current.w / 2) + (x * 5);
      cursor.current.y = (sd.current.h / 2) + (y * 5);
    }
  };

  const clickHandler = (event: MouseEvent) => {
    if (event.type === 'mousedown') {
      setState(prev => ({ ...prev, hyperspace: true }));
    }
    if (event.type === 'mouseup') {
      setState(prev => ({ ...prev, hyperspace: false }));
    }
  };

  useEffect(() => {
    if (mouseAdjust) {
      window.addEventListener('mousemove', mouseHandler);
    }
    if (tiltAdjust) {
      window.addEventListener('deviceorientation', tiltHandler);
    }
    if (clickToWarp) {
      window.addEventListener('mousedown', clickHandler);
      window.addEventListener('mouseup', clickHandler);
    }

    const handleResize = () => {
      measureViewport();
      if (canvasRef.current && sd.current.ctx) {
        canvasRef.current.width = sd.current.w;
        canvasRef.current.height = sd.current.h;
      }
    };
    window.addEventListener('resize', handleResize);

    // Delay init to ensure canvas is mounted
    const timer = setTimeout(() => {
      init();
    }, 100);

    return () => {
      destroy();
      clearTimeout(timer);
      if (mouseAdjust) {
        window.removeEventListener('mousemove', mouseHandler);
      }
      if (tiltAdjust) {
        window.removeEventListener('deviceorientation', tiltHandler);
      }
      if (clickToWarp) {
        window.removeEventListener('mousedown', clickHandler);
        window.removeEventListener('mouseup', clickHandler);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [mouseAdjust, tiltAdjust, clickToWarp, init, destroy, measureViewport]);

  useEffect(() => {
    if (state.reset) {
      reset();
      setState(prev => ({ ...prev, reset: false }));
    }
    if (state.stop) {
      stop();
      setState(prev => ({ ...prev, stop: false }));
    }
    if (state.start && canvasRef.current) {
      init();
      setState(prev => ({ ...prev, start: false }));
    }
  }, [state.reset, state.stop, state.start, init, reset, stop]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'fixed', 
        width: '100vw', 
        height: '100vh', 
        top: 0, 
        left: 0, 
        zIndex: 1, 
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: bgColor === 'rgba(0,0,0,0)' ? 'transparent' : bgColor,
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block',
          width: '100%',
          height: '100%'
        }} 
      />
    </div>
  );
};

export default Starfield;
