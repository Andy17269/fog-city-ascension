/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, PilotLog, PilotProfile } from './types';
import GameCanvas from './components/GameCanvas';
import CyberHUD from './components/CyberHUD';
import Leaderboard from './components/Leaderboard';
import PilotSelector, { SHIPS_DB } from './components/PilotSelector';
import SettingsPanel from './components/SettingsPanel';
import { cyberAudio } from './lib/audio';
import { Trophy, Settings, ShieldAlert, Award, Plane, ChevronRight, X, Play, RefreshCw } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [isBoosting, setIsBoosting] = useState(false);
  const [difficulty, setDifficulty] = useState<number>(1); // 1 = Normal, 2 = Overdrive, 3 = Terminal
  
  // Real-time telemetry metrics updated from Canvas loops
  const [hudData, setHudData] = useState({
    height: 0,
    score: 0,
    speed: 0,
    hull: 100,
    energy: 100,
  });

  // Keep track of final scores achieved in game loop active trial
  const [archiveStats, setArchiveStats] = useState({ score: 0, height: 0 });

  // Custom pilot profile selector
  const [selectedPilot, setSelectedPilot] = useState<PilotProfile>(SHIPS_DB[0]);

  // Command Console pilot logs
  const [logs, setLogs] = useState<PilotLog[]>([
    { id: '1', timestamp: '14:37:33', text: 'GRID_COCKPIT: Calibration online.', type: 'system' },
    { id: '2', timestamp: '14:37:34', text: 'GPS: Connection verified sector EAST-5.', type: 'info' },
  ]);

  // Speaker configuration state
  const [isMuted, setIsMuted] = useState(true);

  // Overlay menu triggers
  const [showRankings, setShowRankings] = useState(false);
  const [showSpecsModal, setShowSpecsModal] = useState(false);

  // Spacebar global listener for boosting velocity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsBoosting(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsBoosting(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Master volume state synchronizer
  const handleToggleMute = () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    cyberAudio.setMute(nextVal);
    addLog(`ACOUSTIC_SYNTH: Master toggle set to ${nextVal ? 'OFF' : 'ON'}`, 'info');
  };

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'system') => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [...prev, {
      id: Math.random().toString(),
      timestamp,
      text,
      type,
    }].slice(-30)); // retain max 30
  };

  // Trigger game start
  const handleInitializeSequence = () => {
    cyberAudio.playBeep(true);
    // Unmute on first click if user requested or let mute control guide
    if (isMuted) {
      // Promptly inform that sound is muted but fully ready to enable
      addLog('COCKPIT: Launched in Silent Stealth mode. Click [AUDIO] to initialize sounds.', 'system');
    }
    
    // Reset live stats
    setHudData({
      height: 0,
      score: 0,
      speed: 0,
      hull: 100,
      energy: 100,
    });
    setIsBoosting(false);
    setGameState('PLAYING');
    addLog(`FLIGHT_SEQ: Initiating ship engine matrix for pilot @${selectedPilot.callsign}...`, 'success');
    addLog('FLIGHT_SEQ: Controls locked. Hold SPACEBAR to boost velocity.', 'system');
  };

  // Handle Game Over
  const handleGameOver = () => {
    setArchiveStats({
      score: hudData.score,
      height: hudData.height,
    });
    setGameState('GAMEOVER');
    addLog(`SYSTEM_HALT: Mission terminated. Altitude: ${hudData.height}m. Score: ${hudData.score}`, 'warn');
  };

  return (
    <div className="min-h-screen bg-[#07070d] text-[#e4e1ed] font-sans antialiased selection:bg-neon-cyan/30 flex flex-col justify-between overflow-x-hidden relative">

      {/* BACKGROUND DECORATIVE GLOW LIGHTS */}
      <div className="absolute top-[20%] left-[-100px] w-[350px] h-[350px] bg-neon-cyan/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-100px] w-[350px] h-[350px] bg-neon-purple/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HEADER WIDGES BAR */}
      <header className="border-b border-[#ffffff10] bg-[#07070d]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane className="w-6 h-6 text-neon-cyan animate-pulse" />
          <h1 
            id="app-main-brand-title"
            className="text-2xl font-display font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-[#54f6ff] drop-shadow-[0_0_12px_rgba(0,242,255,0.3)] select-none cursor-pointer"
            onClick={() => setGameState('MENU')}
          >
            雾都飞升
          </h1>
          <span className="hidden sm:inline-block font-mono text-[9px] uppercase border border-neon-cyan/20 px-1.5 py-0.5 text-neon-cyan bg-neon-cyan/5 tracking-widest">
            FOG_CITY_ASCENSION v1.2
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick specs settings toggle */}
          <button
            id="action-specs-header-btn"
            onClick={() => {
              cyberAudio.playBeep();
              setShowSpecsModal(!showSpecsModal);
              setShowRankings(false);
            }}
            className={`p-2.5 border transition cursor-pointer select-none relative ${
              showSpecsModal 
                ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' 
                : 'border-white/10 hover:border-white/25 hover:bg-white/5 text-white/70'
            }`}
            title="Cockpit Calibration Specs"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Quick leaderboard scores toggle */}
          <button
            id="action-rank-header-btn"
            onClick={() => {
              cyberAudio.playBeep();
              setShowRankings(!showRankings);
              setShowSpecsModal(false);
            }}
            className={`p-2.5 border transition cursor-pointer select-none relative ${
              showRankings 
                ? 'border-neon-purple bg-neon-purple/10 text-neon-purple' 
                : 'border-white/10 hover:border-white/25 hover:bg-white/5 text-white/70'
            }`}
            title="Global Rank leaderboard"
          >
            <Trophy className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT BODY */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col justify-center items-center z-10">
        
        {/* VIEWPORT BOX CONTAINER */}
        <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch justify-center">
          
          {/* FLIGHT COCKPIT (THE CENTER CHROME) */}
          <div className="flex-1 flex flex-col justify-center items-center">
            
            {/* COMPACT VIEW OF RADAR SPECS FLOATING ON MENU */}
            {gameState === 'MENU' && (
              <div 
                id="menu-flight-card" 
                className="w-full max-w-[500px] aspect-[4/6] min-h-[500px] border border-neon-cyan/45 bg-[#12121b]/80 backdrop-blur-md p-6 flex flex-col justify-between relative shadow-[0_0_20px_rgba(0,242,255,0.1)] hover:border-neon-cyan duration-500 transition-colors"
                style={{ borderRadius: '0px' }}
              >
                {/* Embedded Telemetry Tag on Top Right precisely as shown in mock image */}
                <span className="absolute top-4 right-4 bg-purple-950/40 border border-purple-500/20 px-2 py-1 text-[10px] font-mono font-medium text-purple-300 tracking-widest uppercase">
                  高度: 0m
                </span>

                <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center mt-6">
                  {/* Drone SVG Icon */}
                  <div className="w-16 h-16 rounded-full bg-neon-cyan/5 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan transform hover:rotate-12 duration-300">
                    <Plane className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-display font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-[#00f2ff] uppercase">
                      雾都飞升
                    </h2>
                    <p className="text-xs text-[#b9cacb] font-sans px-4 leading-relaxed font-medium uppercase tracking-wider">
                      在赛博都市中穿梭。
                      <br />
                      使用左右方向键或两侧屏幕区域控制飞行。
                    </p>
                  </div>

                  <button
                    id="menu-initialize-btn"
                    onClick={handleInitializeSequence}
                    className="mt-6 px-10 py-3 bg-neon-cyan text-[#0a0a12] font-mono font-bold text-sm tracking-widest uppercase cursor-pointer transition-all border border-neon-cyan hover:bg-[#00dbe7] active:transform active:scale-[0.98] select-none text-center shadow-[0_0_20px_rgba(0,242,255,0.4)]"
                  >
                    初始化序列
                  </button>
                </div>

                <div className="border-t border-[#ffffff10] pt-4 flex items-center justify-between text-[10px] font-mono text-[#ffffff30] uppercase">
                  <span>GPS: EAST-5_CITY_DOCK</span>
                  <span>STEALTH_ACTIVE</span>
                </div>
              </div>
            )}

            {/* PLAYING STATE SCREEN INTERTACTIVE FLIGHT PORT */}
            {gameState === 'PLAYING' && (
              <div 
                id="active-combat-dome"
                className="w-full max-w-[500px] aspect-[4/6] min-h-[500px] border border-neon-cyan/45 bg-[#0a0a12] relative overflow-hidden"
              >
                <GameCanvas
                  gameState={gameState}
                  isBoosting={isBoosting}
                  onUpdateHUD={(data) => setHudData(data)}
                  onGameOver={handleGameOver}
                  onAddLog={addLog}
                  difficulty={difficulty}
                />
              </div>
            )}

            {/* SEQUENCE TERMINATED GAME-OVER SCREEN */}
            {gameState === 'GAMEOVER' && (
              <div 
                id="gameover-flight-card"
                className="w-full max-w-[500px] aspect-[4/6] min-h-[500px] border border-orange-500/50 bg-[#12121b]/95 p-6 flex flex-col justify-between shadow-[0_0_25px_rgba(255,140,0,0.15)] relative"
              >
                <div className="absolute top-4 right-4 bg-orange-950/20 border border-orange-500/25 px-2 py-0.5 text-[9px] font-mono text-orange-400 uppercase tracking-widest">
                  SYS_DEAD_0x
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center mt-4">
                  <div className="w-14 h-14 bg-orange-500/5 border border-orange-500/30 flex items-center justify-center text-orange-500 animate-pulse">
                    <ShieldAlert className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-display font-black tracking-widest text-orange-400 uppercase">
                      连接中断
                    </h2>
                    <p className="text-[10px] text-white/50 uppercase font-mono">
                      PILOT SHIP COLLISION OR METROPALIS DETECTOR INTERCEPTION
                    </p>
                  </div>

                  {/* Summary performance stats block */}
                  <div className="bg-[#ffffff02] border border-[#ffffff10] p-4 w-full grid grid-cols-2 gap-4 font-mono divide-x divide-white/5 text-left mb-2">
                    <div>
                      <div className="text-[9px] text-[#ffffff45] uppercase tracking-wider">Final Altitude</div>
                      <div className="text-xl font-bold font-mono text-white mt-1">{archiveStats.height} M</div>
                    </div>
                    <div className="pl-4">
                      <div className="text-[9px] text-neon-cyan uppercase tracking-wider">Accumulated Score</div>
                      <div className="text-xl font-bold font-mono text-neon-cyan mt-1">{archiveStats.score} PTS</div>
                    </div>
                  </div>

                  {/* Immediate Leaderboard integration to save score in line */}
                  <div className="relative w-full text-left">
                    <Leaderboard currentScore={archiveStats.score} currentHeight={archiveStats.height} />
                  </div>

                  <button
                    id="sequence-restart-btn"
                    onClick={handleInitializeSequence}
                    className="mt-4 px-10 py-3 bg-neon-cyan text-[#0a0a12] font-mono font-bold text-sm tracking-widest uppercase cursor-pointer transition-all hover:bg-neon-cyan/95 text-center flex items-center justify-center gap-1.5 border border-neon-cyan shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>重启序列</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ACTIVE HUD DEPLOYED BELOW OR NEXT TO COCKPIT */}
          <div className="flex-1 lg:max-w-2xl flex flex-col gap-5 justify-between">
            {/* Selected HUD Telemetry block */}
            <div className="bg-dark-slate/30 p-5 border border-[#ffffff10] backdrop-blur-sm self-stretch flex flex-col gap-4">
              <div className="text-sm font-display font-medium tracking-widest text-[#e4e1ed] border-b border-[#ffffff10] pb-2 flex items-center justify-between">
                <span>TACTICAL PILOT HUD SYSTEMS</span>
                <span className="text-[10px] font-mono text-neon-cyan uppercase">SYS_ACTIVE</span>
              </div>
              
              <CyberHUD
                height={hudData.height}
                score={hudData.score}
                speed={hudData.speed}
                hull={hudData.hull}
                energy={hudData.energy}
                isBoosting={isBoosting}
                onToggleBoost={setIsBoosting}
                logs={logs}
                pilot={selectedPilot}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                onOpenSettings={() => setShowSpecsModal(true)}
              />
            </div>

            {/* QUICK LAUNCH MATRIX SIDE Widgets on Menu state */}
            {gameState === 'MENU' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pilot ship selection specs */}
                <div className="bg-dark-slate/40 border border-[#ffffff10] p-4 flex flex-col gap-2">
                  <PilotSelector selected={selectedPilot} onSelect={setSelectedPilot} />
                </div>

                {/* Level Speed Configurations settings */}
                <div className="bg-dark-slate/40 border border-[#ffffff10] p-4 flex flex-col gap-2">
                  <SettingsPanel
                    difficulty={difficulty}
                    onChangeDifficulty={setDifficulty}
                    isMuted={isMuted}
                    onToggleMute={handleToggleMute}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* FLOATING OVERLAY: GLOBAL RANKINGS DATABASE MODAL */}
      {showRankings && (
        <div id="rankings-modal-backdrop" className="fixed inset-0 bg-[#000000a0] backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="border border-neon-cyan/40 bg-[#0c0c14]/90 relative max-w-md w-full shadow-[0_0_30px_rgba(0,242,255,0.2)]">
            <button
              onClick={() => {
                cyberAudio.playBeep();
                setShowRankings(false);
              }}
              className="absolute top-4 right-4 p-1 text-[#ffffff50] hover:text-white hover:bg-white/5 cursor-pointer border border-[#ffffff10]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-4">
              <Leaderboard onClose={() => setShowRankings(false)} />
            </div>
          </div>
        </div>
      )}

      {/* FLOATING OVERLAY: COCKPIT SETTINGS/SPECS MODAL */}
      {showSpecsModal && (
        <div id="specs-modal-backdrop" className="fixed inset-0 bg-[#000000a0] backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="border border-neon-purple/40 bg-[#0c0c14]/90 relative max-w-md w-full shadow-[0_0_30px_rgba(188,19,254,0.2)]">
            <button
              onClick={() => {
                cyberAudio.playBeep();
                setShowSpecsModal(false);
              }}
              className="absolute top-4 right-4 p-1 text-[#ffffff50] hover:text-white hover:bg-white/5 cursor-pointer border border-[#ffffff10]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-neon-purple font-mono uppercase font-black text-sm tracking-widest border-b border-white/10 pb-2">
                <Settings className="w-4 h-4" />
                <span>Specs & Core Settings</span>
              </div>
              <SettingsPanel
                difficulty={difficulty}
                onChangeDifficulty={setDifficulty}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
              />
              <button
                onClick={() => {
                  cyberAudio.playBeep();
                  setShowSpecsModal(false);
                }}
                className="w-full py-2.5 border border-neon-purple text-neon-purple text-xs font-mono font-bold tracking-widest uppercase cursor-pointer hover:bg-neon-purple/10 text-center"
              >
                Close Calibration Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER METRICS AND STATUS */}
      <footer className="border-t border-[#ffffff05] bg-[#050509] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-white/30 tracking-wider">
        <div className="flex items-center gap-3">
          <span>COCKPIT_FEED_SECURE_98</span>
          <span className="text-neon-cyan">• ON AIR</span>
        </div>
        <div className="text-right text-[10px]">
          FOG CITY CORPORATION © {new Date().getFullYear()} ALL RECEPTORS SYNCHRONIZED
        </div>
      </footer>
    </div>
  );
}
