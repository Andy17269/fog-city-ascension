/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { Award, Trophy, Zap, RefreshCw } from 'lucide-react';
import { cyberAudio } from '../lib/audio';

const STORAGE_KEY = 'fog_city_ascension_leaderboard';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, pilot: 'NEON_SHADOW', height: 2450, score: 35400, date: '2026/05/28' },
  { rank: 2, pilot: 'CYBER_VIXEN', height: 1980, score: 28100, date: '2026/05/27' },
  { rank: 3, pilot: 'SMOG_DRAKE', height: 1620, score: 22000, date: '2026/05/29' },
  { rank: 4, pilot: 'COGNITIVE_GRID', height: 1350, score: 18500, date: '2026/05/25' },
  { rank: 5, pilot: 'GRID_RUNNER', height: 1100, score: 14200, date: '2026/05/26' },
];

interface LeaderboardProps {
  currentScore?: number;
  currentHeight?: number;
  onClose?: () => void;
}

export default function Leaderboard({ currentScore, currentHeight, onClose }: LeaderboardProps) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Read from local storage
    const raw = localStorage.getItem(STORAGE_KEY);
    let currentBoard = DEFAULT_LEADERBOARD;
    
    if (raw) {
      try {
        currentBoard = JSON.parse(raw);
      } catch (e) {
        console.warn("Could not load highscores", e);
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
    }

    // Save actual score if provided
    if (currentScore && currentScore > 0) {
      const isDuplicate = currentBoard.some(
        entry => entry.isPlayer && entry.score === currentScore && entry.height === currentHeight
      );

      if (!isDuplicate) {
        const newPlayerEntry: LeaderboardEntry = {
          rank: 999, // dynamic placement
          pilot: 'YOU_PILOT',
          height: currentHeight || 0,
          score: currentScore,
          date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
          isPlayer: true,
        };

        const updated = [...currentBoard, newPlayerEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 7) // keep top 7
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));

        setBoard(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return;
      }
    }

    setBoard(currentBoard.sort((a, b) => b.score - a.score).slice(0, 7));
  }, [currentScore, currentHeight]);

  const clearLeaderboard = () => {
    cyberAudio.playBeep(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
    setBoard(DEFAULT_LEADERBOARD);
  };

  return (
    <div id="leaderboard-panel" className="bg-dark-slate/95 border border-[#ffffff15] p-5 relative font-mono flex flex-col gap-4 max-w-md w-full">
      <div className="flex items-center justify-between border-b border-[#ffffff15] pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-neon-cyan" />
          <span className="text-sm font-bold text-white tracking-widest uppercase">Grid Ranking Records</span>
        </div>
        <button
          onClick={clearLeaderboard}
          title="Reset back to default list"
          className="p-1 border border-[#ffffff15] text-[#ffffff50] hover:text-white cursor-pointer hover:bg-white/5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {currentScore !== undefined && currentScore > 0 && (
        <div className="border border-neon-cyan/30 p-3 bg-neon-cyan/5">
          <div className="text-[10px] text-neon-cyan tracking-wider uppercase mb-1">Your Flight Statistics</div>
          <div className="flex justify-between items-baseline">
            <span className="text-white text-xs font-bold">ALT: {currentHeight}m</span>
            <span className="text-neon-cyan text-lg font-bold">SCORE: {currentScore}</span>
          </div>
        </div>
      )}

      {/* Main High-scores table list */}
      <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
        {board.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center justify-between p-2 text-xs border ${
              entry.isPlayer 
                ? 'border-neon-cyan/50 bg-neon-cyan/10' 
                : 'border-[#ffffff07] bg-[#ffffff02]'
            }`}
          >
            {/* Left elements: Rank and Pilot Call Sign */}
            <div className="flex items-center gap-3">
              <span className={`w-5 font-bold text-center ${
                entry.rank === 1 ? 'text-neon-cyan' : entry.rank === 2 ? 'text-neon-purple' : 'text-white/45'
              }`}>
                #{entry.rank}
              </span>
              <span className={`font-bold tracking-wider ${entry.isPlayer ? 'text-neon-cyan' : 'text-white'}`}>
                {entry.pilot}
              </span>
            </div>

            {/* Right elements: altimeter meters & score numbers */}
            <div className="flex items-center gap-4 text-right">
              <span className="text-white/40 text-[10px] hidden sm:inline">{entry.height}m</span>
              <span className={`font-mono font-bold ${entry.isPlayer ? 'text-neon-cyan' : 'text-neon-purple'}`}>
                {entry.score.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-white/30 text-center leading-relaxed">
        GLOBAL DATAFEED SYNC: {new Date().toLocaleTimeString()} UTC
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-2 w-full py-2.5 border border-neon-cyan text-neon-cyan text-xs font-bold tracking-widest uppercase cursor-pointer hover:bg-neon-cyan/15 active:translate-y-0.5"
        >
          Return to Launch Desk
        </button>
      )}
    </div>
  );
}
