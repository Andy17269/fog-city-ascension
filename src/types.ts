/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'PAUSED';

export interface Obstacle {
  id: string;
  x: number;          // relative X (0 to 100 representing width percentage of slot)
  y: number;          // pixels from top of sky
  width: number;      // width percentage
  height: number;     // height in pixels
  passed: boolean;
  color: string;
  label: string;      // block label, e.g. "BUIL_A", "TOWER_X"
  hasGlow: boolean;
}

export interface Collectible {
  id: string;
  x: number;          // relative X percentage (0 to 100)
  y: number;          // screen pixels
  type: 'ENERGY' | 'SHIELD' | 'NANORING';
  collected: boolean;
  pulseSize: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface Cloud {
  id: string;
  x: number;
  y: number;
  speed: number;
  radius: number;
  density: number;
}

export interface PilotLog {
  id: string;
  timestamp: string;
  text: string;
  type: 'info' | 'warn' | 'success' | 'system';
}

export interface LeaderboardEntry {
  rank: number;
  pilot: string;
  height: number;
  score: number;
  date: string;
  isPlayer?: boolean;
}

export interface PilotProfile {
  name: string;
  callsign: string;
  mechModel: string;
  maxBoost: number;
  handling: number;
}
