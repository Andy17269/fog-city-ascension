/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Eye, HelpCircle, Flame } from 'lucide-react';
import { cyberAudio } from '../lib/audio';

interface SettingsPanelProps {
  difficulty: number;
  onChangeDifficulty: (lvl: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function SettingsPanel({
  difficulty,
  onChangeDifficulty,
  isMuted,
  onToggleMute,
}: SettingsPanelProps) {
  const handleDifficulty = (lvl: number) => {
    cyberAudio.playBeep(true);
    onChangeDifficulty(lvl);
  };

  return (
    <div id="settings-pnl-root" className="bg-dark-slate p-4 border border-[#ffffff15] font-mono flex flex-col gap-4">
      {/* Title */}
      <div className="text-[11px] font-bold text-white uppercase tracking-widest border-b border-white/10 pb-1.5">
        COCKPIT CALIBRATION SPECS
      </div>

      {/* Difficulty levels Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-[#ffffff50] uppercase tracking-wider">Flight Velocity Standard</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 1, label: 'Normal', desc: '1.0x Core Speed' },
            { value: 2, label: 'Overdrive', desc: '1.4x Speed' },
            { value: 3, label: 'Terminal', desc: '1.8x Speed' },
          ].map((lvl) => {
            const active = difficulty === lvl.value;
            return (
              <button
                key={lvl.value}
                onClick={() => handleDifficulty(lvl.value)}
                className={`py-2 px-1 text-center border cursor-pointer select-none transition-all flex flex-col items-center justify-center ${
                  active
                    ? 'border-neon-cyan bg-neon-cyan/5 text-neon-cyan'
                    : 'border-[#ffffff10] bg-white/2 text-[#ffffff50] hover:text-white hover:border-[#ffffff20]'
                }`}
              >
                <span className="text-xs font-bold leading-none">{lvl.label}</span>
                <span className="text-[8px] opacity-70 mt-1 uppercase">{lvl.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio toggle button */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        <label className="text-[10px] text-[#ffffff50] uppercase tracking-wider">Sound Synthesizer Control</label>
        <button
          onClick={onToggleMute}
          className="w-full py-2 px-3 border border-white/15 hover:border-white/25 bg-white/2 cursor-pointer text-xs flex items-center justify-between text-white/80 select-none uppercase hover:bg-white/5 font-mono"
        >
          <span className="flex items-center gap-1.5">
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
            SYSTEM ACOUSTICS
          </span>
          <span className="font-bold">{isMuted ? 'Muted' : 'Enabled'}</span>
        </button>
      </div>

      {/* Instruction list manual */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5 bg-[#0e0e18] p-3 text-[10px] leading-relaxed text-white/50">
        <div className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
          <HelpCircle className="w-3.5 h-3.5 text-neon-cyan" />
          Flight Control Manual
        </div>
        <ul className="list-disc list-inside flex flex-col gap-1 text-[9px] uppercase font-mono">
          <li>Press <span className="text-neon-cyan font-bold">[←] / [A]</span> to steer leftward</li>
          <li>Press <span className="text-neon-cyan font-bold">[→] / [D]</span> to steer rightward</li>
          <li>Hold <span className="text-neon-purple font-bold">[SPACEBAR]</span> to ignite boosters</li>
          <li>Fly through <span className="text-neon-cyan font-bold">Cyan Rings</span> for high score bonus</li>
          <li>Avoid <span className="text-neon-purple font-bold">Neon Scrapers</span> to protect hull integrity</li>
        </ul>
      </div>
    </div>
  );
}
