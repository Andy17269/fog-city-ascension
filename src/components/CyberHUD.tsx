/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { PilotLog, PilotProfile } from '../types';
import { Terminal, Shield, Zap, Compass, Activity, Volume2, VolumeX, Eye, Flame } from 'lucide-react';
import { cyberAudio } from '../lib/audio';

interface CyberHUDProps {
  height: number;
  score: number;
  speed: number;
  hull: number;
  energy: number;
  isBoosting: boolean;
  onToggleBoost: (active: boolean) => void;
  logs: PilotLog[];
  pilot: PilotProfile;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
}

export default function CyberHUD({
  height,
  score,
  speed,
  hull,
  energy,
  isBoosting,
  onToggleBoost,
  logs,
  pilot,
  isMuted,
  onToggleMute,
  onOpenSettings,
}: CyberHUDProps) {
  const [coordinates, setCoordinates] = useState({ lat: 31.233, lng: 121.467 });
  const [radialAngle, setRadialAngle] = useState(0);

  // Animate mock orbital coordinates and radar sweep
  useEffect(() => {
    const timer = setInterval(() => {
      setCoordinates(prev => ({
        lat: prev.lat + (Math.random() * 0.0004 - 0.0002),
        lng: prev.lng + (Math.random() * 0.0004 - 0.0002),
      }));
      setRadialAngle(angle => (angle + 3) % 360);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="hud-main-panel" className="w-full flex flex-col gap-4 pointer-events-auto select-none">
      
      {/* SECTION 1: TOP GRID STATUS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Speedometer Telemetry */}
        <div className="bg-dark-slate/60 border border-neon-cyan/20 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-neon-cyan font-mono uppercase tracking-widest">
            <span>Velocity</span>
            <Activity className="w-3 h-3 text-neon-cyan" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono tracking-wider text-neon-cyan drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]">
              {speed}
            </span>
            <span className="text-xs font-mono text-neon-cyan/60 uppercase">KM/H</span>
          </div>
          <div className="mt-1 h-1 bg-dark-slate flex overflow-hidden">
            <div 
              className="h-full bg-neon-cyan transition-all duration-100 shadow-[0_0_6px_rgba(0,242,255,0.7)]" 
              style={{ width: `${Math.min(100, (speed / 350) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Altitude Telemetry */}
        <div className="bg-dark-slate/60 border border-neon-purple/20 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-neon-purple font-mono uppercase tracking-widest">
            <span>Elevation</span>
            <Compass className="w-3 h-3 text-neon-purple" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono tracking-wider text-neon-purple drop-shadow-[0_0_8px_rgba(188,19,254,0.4)]">
              {height}
            </span>
            <span className="text-xs font-mono text-neon-purple/60 uppercase">M</span>
          </div>
          <div className="text-[10px] font-mono text-[#ffffff40] flex justify-between mt-1">
            <span>GPS: {coordinates.lat.toFixed(4)}°N</span>
            <span>{coordinates.lng.toFixed(4)}°E</span>
          </div>
        </div>

        {/* Core Scores telemetry */}
        <div className="bg-dark-slate/60 border border-neon-cyan/20 p-3 flex flex-col justify-between">
          <div className="text-[10px] text-neon-cyan font-mono uppercase tracking-widest">Score Matrix</div>
          <div className="mt-2">
            <span className="text-3xl font-bold font-mono text-[#fff] tracking-widest">
              {score.toString().padStart(6, '0')}
            </span>
          </div>
          <div className="text-[10px] font-mono text-neon-cyan/50 mt-1 flex justify-between">
            <span>SYS_OK_98</span>
            <span>SYNC_ONLINE</span>
          </div>
        </div>

        {/* Energy Cell Telemetry */}
        <div className="bg-dark-slate/60 border border-neon-purple/20 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-neon-purple font-mono uppercase tracking-widest">
            <span>FOG NOISE FILTER</span>
            <span className="text-[#a4df3b] text-xs">99.2%</span>
          </div>
          <div className="mt-2 flex items-center justify-between font-mono">
            <div className="text-sm font-bold text-white">COGNITIVE_SENS</div>
            <span className="text-neon-purple/80 text-xs">PULSAR</span>
          </div>
          <div className="text-[10px] font-mono text-[#ffffff40] mt-1">
            SECTOR: EAST-5_SMOG_DOME
          </div>
        </div>
      </div>

      {/* SECTION 2: CENTRAL TELEMETRY CONTROLS - VITAL GAUGES */}
      <div id="hud-lower-controls" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Side: Segmented Health & Boost Panels */}
        <div className="bg-dark-slate/70 border border-white/10 p-4 flex flex-col gap-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-white border-b border-white/10 pb-1 flex items-center justify-between">
            <span>Pilot Vitals & Shield</span>
            <Shield className="w-3.5 h-3.5 text-neon-cyan" />
          </div>

          {/* Hull integrity Bar */}
          <div>
            <div className="flex justify-between text-[11px] font-mono text-white/80 mb-1">
              <span>HULL INTEGRITY</span>
              <span className={hull < 40 ? "text-orange-500 animate-pulse font-bold" : "text-neon-cyan"}>
                {hull}% {hull < 30 ? "CRITICAL" : "STABLE"}
              </span>
            </div>
            
            {/* Segmented layout bar precisely */}
            <div className="flex gap-0.5 h-5 bg-dark-slate p-0.5 border border-[#ffffff15]">
              {Array.from({ length: 20 }).map((_, i) => {
                const step = 20 - i; // left-to-right filling
                const pct = (step / 20) * 100;
                const active = hull >= pct;
                return (
                  <div
                    key={i}
                    className={`h-full flex-1 transition-all duration-300 ${
                      active
                        ? hull < 35 
                          ? 'bg-red-500' // Red Critical
                          : 'bg-neon-cyan shadow-[0_0_4px_#00f2ff]' 
                        : 'bg-[#ffffff05]'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Reactor Energy / Boost Bar */}
          <div>
            <div className="flex justify-between text-[11px] font-mono text-white/80 mb-1">
              <span>THRUSTER ENERGY SOURCE</span>
              <span className="text-neon-purple font-bold">{energy}%</span>
            </div>
            
            {/* Segmented layout bar */}
            <div className="flex gap-0.5 h-5 bg-dark-slate p-0.5 border border-[#ffffff15]">
              {Array.from({ length: 20 }).map((_, i) => {
                const step = 20 - i;
                const pct = (step / 20) * 100;
                const active = energy >= pct;
                return (
                  <div
                    key={i}
                    className={`h-full flex-1 transition-all duration-300 ${
                      active
                        ? 'bg-neon-purple shadow-[0_0_4px_#bc13fe]'
                        : 'bg-[#ffffff05]'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Boost Trigger Button */}
          <button
            id="boost-trigger-button"
            onMouseDown={() => onToggleBoost(true)}
            onMouseUp={() => onToggleBoost(false)}
            onTouchStart={() => onToggleBoost(true)}
            onTouchEnd={() => onToggleBoost(false)}
            onMouseLeave={() => onToggleBoost(false)}
            className={`w-full py-3 font-mono font-bold text-center tracking-widest text-xs uppercase cursor-pointer select-none transition-all ${
              isBoosting && energy > 5
                ? 'bg-neon-cyan text-black shadow-[0_0_15px_#00f2ff] translate-y-0.5'
                : 'border border-neon-cyan text-neon-cyan bg-neon-cyan/5 hover:bg-neon-cyan/15'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Flame className="w-4 h-4" />
              <span>HOLD [SPACEBAR] TO BOOST VELOCITY</span>
            </div>
          </button>
        </div>

        {/* Center Side: Tactical circular radar sweep screen */}
        <div className="bg-dark-slate/70 border border-white/10 p-4 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="w-full text-[11px] font-mono uppercase tracking-widest text-white border-b border-white/10 pb-1 flex items-center justify-between mb-2">
            <span>Tactical Sweep Radar</span>
            <Compas />
          </div>

          <div className="relative w-36 h-36 border border-neon-cyan/30 rounded-full flex items-center justify-center bg-dark-slate-low">
            {/* Crosshairs axis */}
            <div className="absolute inset-x-0 h-[1px] bg-neon-cyan/15" />
            <div className="absolute inset-y-0 w-[1px] bg-neon-cyan/15" />
            
            {/* Concentric grid circles */}
            <div className="absolute w-28 h-28 border border-dashed border-neon-cyan/10 rounded-full" />
            <div className="absolute w-16 h-16 border border-dashed border-neon-cyan/20 rounded-full" />
            
            {/* Moving sweep line */}
            <div 
              className="absolute w-full h-full rounded-full pointer-events-none transition-all ease-linear"
              style={{
                background: `conic-gradient(from ${radialAngle}deg, rgba(0,242,255,0.15) 0deg, rgba(0,242,255,0) 90deg)`,
              }}
            />

            {/* Static random simulation tracking dots on sweep */}
            <div className="absolute w-2 h-2 bg-neon-purple rounded-full animate-ping" style={{ top: '22%', left: '70%' }} />
            <div className="absolute w-1.5 h-1.5 bg-neon-purple rounded-full" style={{ top: '22%', left: '70%' }} />
            
            <div className="absolute w-2 h-2 bg-neon-purple rounded-full animate-pulse" style={{ top: '75%', left: '26%' }} />
            <div className="absolute w-1.5 h-1.5 bg-neon-purple rounded-full" style={{ top: '75%', left: '26%' }} />

            <div className="absolute w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" style={{ top: '48%', left: '35%' }} />

            {/* Player craft central node marker */}
            <div className="z-10 w-2 h-2 bg-neon-cyan rounded-full shadow-[0_0_8px_#00f2ff]" />
          </div>

          <div className="text-[10px] font-mono text-neon-cyan/60 tracking-wider text-center mt-2 uppercase">
            ACTIVE SWEEP CORRIDOR RANGE: 1.5KM
          </div>
        </div>

        {/* Right Side: Command Pilot Text Log Console */}
        <div className="bg-dark-slate/70 border border-white/10 p-4 flex flex-col justify-between h-full min-h-[170px]">
          <div className="text-[11px] font-mono uppercase tracking-widest text-white border-b border-white/10 pb-1 flex items-center justify-between mb-2">
            <span>Terminal Matrix Stream</span>
            <Terminal className="w-3.5 h-3.5 text-neon-purple" />
          </div>

          <div 
            id="pilot-logs-console"
            className="flex-1 overflow-y-auto font-mono text-[10px] flex flex-col gap-1 pr-1 border border-white/5 p-2 bg-[#09090f] max-h-[101px]"
          >
            {logs.slice(-5).map((log) => {
              let color = 'text-white/60';
              if (log.type === 'warn') color = 'text-orange-400 font-bold';
              if (log.type === 'success') color = 'text-green-400 font-bold';
              if (log.type === 'system') color = 'text-neon-cyan';

              return (
                <div key={log.id} className="leading-snug transition-all flex items-start gap-1">
                  <span className="text-[#ffffff20] font-normal">[{log.timestamp}]</span>
                  <span className={`${color}`}>{log.text}</span>
                </div>
              );
            })}
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
            <div className="flex gap-2">
              <button
                id="toggle-audio-btn"
                onClick={onToggleMute}
                className="p-1 px-2 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 cursor-pointer flex items-center gap-1 font-mono text-[10px] uppercase"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-green-400" />}
                <span>{isMuted ? 'Muted' : 'Audio On'}</span>
              </button>

              <button
                id="toggle-settings-btn"
                onClick={onOpenSettings}
                className="p-1 px-2 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 cursor-pointer font-mono text-[10px] uppercase flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Specs</span>
              </button>
            </div>

            <span className="text-[9px] font-mono text-[#ffffff20]">ENG_PITCH_80HZ</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// Simple compass/radar decorator
function Compas() {
  return (
    <div className="relative w-3.5 h-3.5 flex items-center justify-center">
      <div className="absolute inset-0 border border-neon-cyan rounded-full" />
      <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-ping" />
    </div>
  );
}
