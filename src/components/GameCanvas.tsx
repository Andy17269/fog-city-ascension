/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameState, Obstacle, Collectible, Particle, Cloud } from '../types';
import { cyberAudio } from '../lib/audio';

interface GameCanvasProps {
  gameState: GameState;
  isBoosting: boolean;
  onUpdateHUD: (data: {
    height: number;
    score: number;
    speed: number;
    hull: number;
    energy: number;
    isBoosting: boolean;
  }) => void;
  onGameOver: () => void;
  onAddLog: (text: string, type: 'info' | 'warn' | 'success' | 'system') => void;
  difficulty: number; // 1 = Normal, 2 = Overdrive, 3 = Terminal
}

export default function GameCanvas({
  gameState,
  isBoosting,
  onUpdateHUD,
  onGameOver,
  onAddLog,
  difficulty,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Flight states
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });
  
  // Game states managed inside loop via refs to avoid state latency inside requestAnimationFrame
  const stateRef = useRef({
    gameState,
    playerX: 50, // 0 to 100 percentage
    playerY: 80, // bottom screen percentage
    speed: 150,  // current speed KM/H
    baseSpeed: 150,
    targetSpeed: 150,
    height: 0,
    score: 0,
    hull: 100,
    energy: 100,
    isBoosting,
    keys: { Left: false, Right: false },
    obstacles: [] as Obstacle[],
    collectibles: [] as Collectible[],
    particles: [] as Particle[],
    clouds: [] as Cloud[],
    gridOffset: 0,
    frame: 0,
    lastTime: 0,
    shakeTime: 0,
    invulnerableTime: 0,
  });

  // Keep stateRef up to date with props
  useEffect(() => {
    stateRef.current.gameState = gameState;
    stateRef.current.isBoosting = isBoosting;
    if (gameState === 'PLAYING') {
      // Lazy init sounds
      cyberAudio.updateEnginePitch(isBoosting);
    }
  }, [gameState, isBoosting]);

  // Handle keys and focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.gameState !== 'PLAYING') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.Left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.Right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.Left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.Right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Set up resize observer to perfectly track parent dimensions according to constraints
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(280, width),
        height: Math.max(400, height),
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initialize Game Loops & Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId = 0;
    
    // Seed clouds
    const clouds: Cloud[] = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        id: Math.random().toString(),
        x: Math.random() * 100,
        y: Math.random() * 1000 - 200,
        speed: Math.random() * 0.5 + 0.2,
        radius: Math.random() * 80 + 40,
        density: Math.random() * 0.15 + 0.05,
      });
    }
    stateRef.current.clouds = clouds;

    const gameLoop = (timestamp: number) => {
      if (!ctx || !canvas) return;
      const ref = stateRef.current;

      const delta = ref.lastTime ? (timestamp - ref.lastTime) / 1000 : 0.016;
      ref.lastTime = timestamp;
      ref.frame++;

      // Canvas dimensions
      const w = canvas.width;
      const h = canvas.height;

      // Update calculations if active
      if (ref.gameState === 'PLAYING') {
        // Adjust speed based on boosting state and difficulty scaling
        const speedScale = 1 + (difficulty - 1) * 0.4;
        ref.baseSpeed = 150 * speedScale;
        
        if (ref.isBoosting && ref.energy > 5) {
          ref.targetSpeed = 280 * speedScale;
          ref.energy = Math.max(0, ref.energy - delta * 25);
          cyberAudio.updateEnginePitch(true);
        } else {
          ref.targetSpeed = ref.baseSpeed;
          // Slowly regenerate energy when not boosting
          ref.energy = Math.min(100, ref.energy + delta * 12);
          cyberAudio.updateEnginePitch(false);
        }

        // Steer speed smooth transition
        ref.speed += (ref.targetSpeed - ref.speed) * 0.1;

        // Accelerate height and score
        ref.height += (ref.speed * delta) / 3.6; // convert km/h to m/s added
        ref.score += Math.round(ref.speed * delta * 0.15 * (ref.isBoosting ? 2 : 1));

        // Lateral moving calculation
        const steeringForce = 4.5;
        if (ref.keys.Left) {
          ref.playerX = Math.max(12, ref.playerX - steeringForce * 50 * delta);
        }
        if (ref.keys.Right) {
          ref.playerX = Math.min(88, ref.playerX + steeringForce * 50 * delta);
        }

        // Hit frame cooldown
        if (ref.invulnerableTime > 0) {
          ref.invulnerableTime -= delta;
        }

        // Map scrolling math
        ref.gridOffset = (ref.gridOffset + ref.speed * delta * 5) % 120;

        // Update HUD to parent component periodically (throttled every 10 frames)
        if (ref.frame % 10 === 0) {
          onUpdateHUD({
            height: Math.floor(ref.height),
            score: ref.score,
            speed: Math.floor(ref.speed),
            hull: Math.floor(ref.hull),
            energy: Math.floor(ref.energy),
            isBoosting: ref.isBoosting && ref.energy > 5,
          });
        }

        // Spawners Obstacles & Collectibles
        const spawnInterval = Math.max(35, 80 - Math.floor(ref.speed / 5));
        if (ref.frame % spawnInterval === 0) {
          spawnEntities(w);
        }

        // Update hurdles & clean passives
        updateObstacles(delta, h);
        updateCollectibles(delta, h);
        updateParticles(delta);
        updateClouds(delta);

        // Check crash/collisions
        checkCollisions(w, h);
      }

      // Draw Everything
      drawScene(ctx, w, h);

      frameId = requestAnimationFrame(gameLoop);
    };

    // Begin looping
    frameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [dimensions, difficulty]);

  // Spawn obstacles, rings, cells
  const spawnEntities = (width: number) => {
    const ref = stateRef.current;
    const cyberObstacleLabels = [
      'SMOG_TOWER', 'NEON_GRID_A', 'COM_BEACON', 'DIGI_PULSE', 
      'SYS_CORES', 'FOG_VENT', 'LIGHT_PULSE', 'VOID_SPIRE'
    ];

    // Seed Random Obstacles
    if (Math.random() < 0.65) {
      const obstacleWidth = Math.random() * 25 + 15; // 15 to 40% of horizontal axis width
      const obstacleX = Math.random() * (100 - obstacleWidth);
      const isGlowy = Math.random() > 0.4;
      const colorSet = isGlowy ? '#bc13fe' : '#ffffff20'; // Purple electrical barriers or Steel metal cores
      
      ref.obstacles.push({
        id: Math.random().toString(),
        x: obstacleX,
        y: -100,
        width: obstacleWidth,
        height: Math.random() * 40 + 60,
        passed: false,
        color: colorSet,
        label: cyberObstacleLabels[Math.floor(Math.random() * cyberObstacleLabels.length)],
        hasGlow: isGlowy,
      });

      if (Math.random() < 0.3) {
        onAddLog(`SCANNER: Obstacle detected on trajectory ${Math.round(obstacleX)}%`, 'warn');
      }
    }

    // Spawn Energy Rings & Power-ups
    if (Math.random() < 0.5) {
      const isShield = Math.random() < 0.15;
      const isEnergy = Math.random() < 0.5;
      const ringX = Math.random() * 80 + 10;
      ref.collectibles.push({
        id: Math.random().toString(),
        x: ringX,
        y: -50,
        type: isShield ? 'SHIELD' : isEnergy ? 'ENERGY' : 'NANORING',
        collected: false,
        pulseSize: 6,
      });
    }
  };

  // Move obstacles
  const updateObstacles = (delta: number, height: number) => {
    const ref = stateRef.current;
    const moveSpeed = ref.speed * 5 * delta;

    ref.obstacles = ref.obstacles.filter(obs => {
      obs.y += moveSpeed;
      if (!obs.passed && obs.y > height * 0.8) {
        obs.passed = true;
      }
      return obs.y < height + 100;
    });
  };

  // Move power Collectibles
  const updateCollectibles = (delta: number, height: number) => {
    const ref = stateRef.current;
    const moveSpeed = ref.speed * 4.5 * delta;

    ref.collectibles = ref.collectibles.filter(item => {
      item.y += moveSpeed;
      item.pulseSize = 6 + Math.sin(ref.frame * 0.2) * 2;
      return item.y < height + 50 && !item.collected;
    });
  };

  // Space Dust Speed particles
  const updateParticles = (delta: number) => {
    const ref = stateRef.current;
    // Spawn boost fire particles
    if (ref.gameState === 'PLAYING') {
      const count = ref.isBoosting ? 5 : 2;
      const px = (ref.playerX / 100) * dimensions.width;
      const py = (ref.playerY / 100) * dimensions.height;

      for (let i = 0; i < count; i++) {
        ref.particles.push({
          id: Math.random().toString(),
          x: px + (Math.random() * 12 - 6),
          y: py + 20,
          vx: Math.random() * 40 - 20,
          vy: ref.isBoosting ? Math.random() * 300 + 400 : Math.random() * 150 + 200,
          alpha: 0.9,
          color: ref.isBoosting ? '#00f2ff' : '#bc13fe',
          size: Math.random() * 4 + 2,
          life: 0,
          maxLife: Math.random() * 0.5 + 0.3,
        });
      }
    }

    // Engine speed streaks
    if (ref.frame % 3 === 0 && ref.gameState === 'PLAYING') {
      ref.particles.push({
        id: Math.random().toString(),
        x: Math.random() * dimensions.width,
        y: -10,
        vx: 0,
        vy: ref.speed * 8 * delta + (Math.random() * 80 + 100),
        alpha: 0.4,
        color: '#00f2ff',
        size: Math.random() * 1.5 + 0.5,
        life: 0,
        maxLife: 2.0,
      });
    }

    // Tick forward
    ref.particles = ref.particles.filter(p => {
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.life += delta;
      p.alpha = 1 - (p.life / p.maxLife);
      return p.life < p.maxLife;
    });
  };

  // Update neon background clouds
  const updateClouds = (delta: number) => {
    const ref = stateRef.current;
    ref.clouds.forEach(cloud => {
      cloud.y += (ref.speed * 0.8 * delta) * cloud.speed;
      if (cloud.y > dimensions.height + 150) {
        cloud.y = -150;
        cloud.x = Math.random() * 100;
      }
    });
  };

  // Collision detection logic
  const checkCollisions = (width: number, height: number) => {
    const ref = stateRef.current;
    if (ref.invulnerableTime > 0) return;

    const px = (ref.playerX / 100) * width;
    const py = (ref.playerY / 100) * height;

    const droneRadius = 16;

    // Check Obstacles
    for (let i = 0; i < ref.obstacles.length; i++) {
      const obstacle = ref.obstacles[i];
      const ox = (obstacle.x / 100) * width;
      const oWidth = (obstacle.width / 100) * width;

      // Check aligned bounding box
      const collidesX = px + droneRadius > ox && px - droneRadius < ox + oWidth;
      const collidesY = py + droneRadius > obstacle.y && py - droneRadius < obstacle.y + obstacle.height;

      if (collidesX && collidesY) {
        // Boom! Collision
        ref.hull = Math.max(0, ref.hull - (obstacle.hasGlow ? 35 : 20));
        ref.invulnerableTime = 1.2; // 1.2 seconds invuln
        ref.shakeTime = 0.5; // screen shake for 0.5 seconds
        cyberAudio.playCollision();

        // Spawn red burst explosion particles
        for (let k = 0; k < 25; k++) {
          ref.particles.push({
            id: Math.random().toString(),
            x: px,
            y: py,
            vx: (Math.random() * 200 - 100) * 2,
            vy: (Math.random() * 200 - 100) * 2,
            alpha: 1.0,
            color: '#ff4c3b',
            size: Math.random() * 6 + 3,
            life: 0,
            maxLife: 1.0,
          });
        }

        onAddLog(`CRITICAL: Collision with ${obstacle.label}! Hull at ${ref.hull}%`, 'warn');

        if (ref.hull <= 0) {
          cyberAudio.playGameOver();
          onGameOver();
        }
        break;
      }
    }

    // Check Collectibles
    for (let i = 0; i < ref.collectibles.length; i++) {
      const item = ref.collectibles[i];
      if (item.collected) continue;

      const ix = (item.x / 100) * width;
      
      const distance = Math.hypot(px - ix, py - item.y);
      if (distance < droneRadius + 18) {
        item.collected = true;
        cyberAudio.playChime();

        if (item.type === 'ENERGY') {
          ref.energy = Math.min(100, ref.energy + 35);
          onAddLog('BATTERY: Energy Matrix Core recharged (+35%)', 'success');
        } else if (item.type === 'SHIELD') {
          ref.hull = Math.min(100, ref.hull + 20);
          onAddLog('NANO_TECH: Autonomous hull repair system triggered', 'success');
        } else if (item.type === 'NANORING') {
          ref.score += 500;
          onAddLog('HUD: Synchronized with sector ring relay (+500 pts)', 'info');

          // Green spark particles
          for (let k = 0; k < 8; k++) {
            ref.particles.push({
              id: Math.random().toString(),
              x: ix,
              y: item.y,
              vx: Math.random() * 100 - 50,
              vy: Math.random() * 100 - 50,
              alpha: 1.0,
              color: '#00f2ff',
              size: Math.random() * 3 + 1.5,
              life: 0,
              maxLife: 0.6,
            });
          }
        }
      }
    }
  };

  // Rendering Scene layout on Canvas frame
  const drawScene = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const ref = stateRef.current;

    // Apply screen shake viewport offset on crash
    ctx.save();
    if (ref.shakeTime > 0 && ref.gameState === 'PLAYING') {
      const sX = (Math.random() * 12 - 6);
      const sY = (Math.random() * 12 - 6);
      ctx.translate(sX, sY);
      ref.shakeTime -= 0.016; // tick down 60fps
    }

    // 1. Dark Neon Slate Background Space
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Speed Line Grid
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.04)';
    ctx.lineWidth = 1.0;

    // Perspective lines fanning outward
    const gridCols = 8;
    const centerX = w / 2;
    for (let i = 0; i <= gridCols; i++) {
      const startX = (i / gridCols) * w;
      ctx.beginPath();
      ctx.moveTo(centerX, -100);
      ctx.lineTo(startX, h + 100);
      ctx.stroke();
    }

    // Horizontal moving grid speed-bands
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.06)';
    ctx.lineWidth = 1.5;
    const gridSpace = 80;
    const scrollOffset = ref.gridOffset;
    for (let y = -gridSpace; y < h + gridSpace; y += gridSpace) {
      const currentY = y + scrollOffset;
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(w, currentY);
      ctx.stroke();
    }

    // 3. Draw Deep Ambient Fog / Clouds
    ref.clouds.forEach(cloud => {
      const cx = (cloud.x / 100) * w;
      const gradient = ctx.createRadialGradient(cx, cloud.y, 5, cx, cloud.y, cloud.radius);
      
      gradient.addColorStop(0, `rgba(188, 19, 254, ${cloud.density})`); // Purple fog
      gradient.addColorStop(0.5, `rgba(0, 242, 255, ${cloud.density * 0.4})`); // Cyan fog
      gradient.addColorStop(1, 'rgba(10, 10, 18, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cloud.y, cloud.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Draw Space Dust System Particles
    ref.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      
      // Booster fire points vs long speed streaks
      if (Math.abs(p.vy) > 200) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y - 15);
        ctx.stroke();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    });
    ctx.globalAlpha = 1.0; // Reset alpha

    // 5. Draw Obstacles (Cyber Scraper Buildings & Laser Core Barriers)
    ref.obstacles.forEach(obs => {
      const ox = (obs.x / 100) * w;
      const oWidth = (obs.width / 100) * w;

      if (obs.hasGlow) {
        // High-Tech Neon Pulse Barrier (Electric Purple)
        // Outer glow
        ctx.shadowColor = '#bc13fe';
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = 'rgba(188, 19, 254, 0.15)';
        ctx.fillRect(ox, obs.y, oWidth, obs.height);

        // Core Glowing Border
        ctx.strokeStyle = '#bc13fe';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(ox, obs.y, oWidth, obs.height);

        // Scan bars inside
        ctx.strokeStyle = 'rgba(188, 19, 254, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const pulseBarY = obs.y + (ref.frame % 30) * (obs.height / 30);
        ctx.moveTo(ox, pulseBarY);
        ctx.lineTo(ox + oWidth, pulseBarY);
        ctx.stroke();

        ctx.shadowBlur = 0; // reset
      } else {
        // Industrial Dark Steel Spires
        ctx.fillStyle = '#1b1b26';
        ctx.fillRect(ox, obs.y, oWidth, obs.height);
        
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(ox, obs.y, oWidth, obs.height);

        // Technical details inside buildings (grating windows/panels)
        ctx.fillStyle = 'rgba(0, 242, 255, 0.08)';
        for (let i = 10; i < obs.height - 10; i += 18) {
          ctx.fillRect(ox + 5, obs.y + i, oWidth - 10, 4);
        }
      }

      // Readouts tags on obstacles
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.fillStyle = obs.hasGlow ? '#bc13fe' : '#00f2ff';
      ctx.fillText(obs.label, ox + 6, obs.y + 16);
    });

    // 6. Draw Collectibles (Neon cyan ring circles & Battery Matrix Cores)
    ref.collectibles.forEach(item => {
      const ix = (item.x / 100) * w;

      if (item.type === 'NANORING') {
        // Neon Target flight ring
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 2.5;

        // Draw isometric flying circle ring
        ctx.beginPath();
        ctx.ellipse(ix, item.y, item.pulseSize * 2.2, item.pulseSize * 1.2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Arrow nodes pointing in
        ctx.fillStyle = 'rgba(0, 242, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(ix, item.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      } else if (item.type === 'ENERGY') {
        // Battery block
        ctx.fillStyle = '#00f2ff';
        ctx.fillRect(ix - 8, item.y - 8, 16, 16);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(ix - 8, item.y - 8, 16, 16);
        
        // Lighting icon
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#00363a';
        ctx.fillText('⚡', ix - 5, item.y + 4);
      } else {
        // Nano Shield / Health Repair Sphere
        ctx.shadowColor = '#bc13fe';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#bc13fe';
        ctx.beginPath();
        ctx.arc(ix, item.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('♥', ix - 4, item.y + 4);
        ctx.shadowBlur = 0;
      }
    });

    // 7. Draw Player's Craft/Drone (Spacecraft vector drawing)
    const px = (ref.playerX / 100) * w;
    const py = (ref.playerY / 100) * h;

    // Blink effect if invulnerable after a hit
    let shouldDraw = true;
    if (ref.invulnerableTime > 0) {
      shouldDraw = ref.frame % 4 < 2;
    }

    if (shouldDraw) {
      ctx.save();
      ctx.translate(px, py);

      // Jet exhaust fire glow
      const fireGrad = ctx.createLinearGradient(0, 10, 0, 40);
      fireGrad.addColorStop(0, ref.isBoosting ? '#00f2ff' : '#bc13fe');
      fireGrad.addColorStop(1, 'rgba(10, 10, 18, 0)');
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.moveTo(-10, 12);
      ctx.lineTo(0, 35 + (Math.random() * 15));
      ctx.lineTo(10, 12);
      ctx.closePath();
      ctx.fill();

      // Draw Drone Wing structures (Aggressive chamfered design)
      ctx.shadowColor = '#00f2ff';
      ctx.shadowBlur = ref.isBoosting ? 18 : 8;

      ctx.fillStyle = '#1f1f2a';
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 2.0;

      // Drone Path Drawing
      ctx.beginPath();
      // Nose tip
      ctx.moveTo(0, -18);
      // Wing right
      ctx.lineTo(8, -4);
      ctx.lineTo(24, 6);
      ctx.lineTo(28, 12);
      ctx.lineTo(12, 10);
      // Thruster rear-center
      ctx.lineTo(0, 4);
      // Wing left
      ctx.lineTo(-12, 10);
      ctx.lineTo(-28, 12);
      ctx.lineTo(-24, 6);
      ctx.lineTo(-8, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit Glow Core (Neon Cyan)
      ctx.fillStyle = '#00f2ff';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(4, -2);
      ctx.lineTo(0, 2);
      ctx.lineTo(-4, -2);
      ctx.closePath();
      ctx.fill();

      // Left laser wing pod light
      ctx.fillStyle = '#bc13fe';
      ctx.beginPath();
      ctx.arc(-22, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Right laser wing pod light
      ctx.fillStyle = '#bc13fe';
      ctx.beginPath();
      ctx.arc(22, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.shadowBlur = 0;
    }

    // 8. Welcome Menu HUD graphics overlay
    if (ref.gameState === 'MENU') {
      // Atmospheric scanning graphic
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const scanLineY = (timestampScaleY(ref.frame) / 100) * h;
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(w, scanLineY);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Static sweep helper
  const timestampScaleY = (frame: number) => {
    return (frame % 180) * (100 / 180);
  };

  // Click Steer Controls helpers (Touch responsive thumb pads)
  const handleTouchLeft = () => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    stateRef.current.keys.Left = true;
    stateRef.current.keys.Right = false;
  };

  const handleTouchRight = () => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    stateRef.current.keys.Right = true;
    stateRef.current.keys.Left = false;
  };

  const handleTouchRelease = () => {
    stateRef.current.keys.Left = false;
    stateRef.current.keys.Right = false;
  };

  return (
    <div 
      id="game-container-parent"
      ref={containerRef} 
      className="relative w-full h-full min-h-[420px] bg-dark-slate/90 select-none overflow-hidden flex flex-col justify-between"
    >
      {/* 2D HTML Canvas element */}
      <canvas
        id="cyber-flight-canvas"
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute top-0 left-0 w-full h-full block z-0"
      />

      {/* Screen flash/damage red shader */}
      {stateRef.current.shakeTime > 0 && gameState === 'PLAYING' && (
        <div className="absolute inset-0 bg-red-900/10 border-4 border-red-500 animate-pulse pointer-events-none z-10" />
      )}

      {/* Invisible mobile click control zones */}
      {gameState === 'PLAYING' && (
        <div id="mobile-control-overlay" className="absolute inset-0 w-full h-full flex justify-between select-none z-20 md:hidden pointer-events-auto">
          <div
            id="mobile-touch-left"
            className="w-1/2 h-full active:bg-cyan-500/5 transition cursor-pointer"
            onTouchStart={handleTouchLeft}
            onTouchEnd={handleTouchRelease}
            onMouseDown={handleTouchLeft}
            onMouseUp={handleTouchRelease}
            onMouseLeave={handleTouchRelease}
          />
          <div
            id="mobile-touch-right"
            className="w-1/2 h-full active:bg-cyan-500/5 transition cursor-pointer"
            onTouchStart={handleTouchRight}
            onTouchEnd={handleTouchRelease}
            onMouseDown={handleTouchRight}
            onMouseUp={handleTouchRelease}
            onMouseLeave={handleTouchRelease}
          />
        </div>
      )}
    </div>
  );
}
