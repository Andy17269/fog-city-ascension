/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PilotProfile } from '../types';
import { Shield, Zap, Flame, Check } from 'lucide-react';
import { cyberAudio } from '../lib/audio';

export const SHIPS_DB: PilotProfile[] = [
  {
    name: 'Ashe Vance',
    callsign: 'PULSE_RUNNER',
    mechModel: 'Apex-Core V-7',
    maxBoost: 95,
    handling: 65,
  },
  {
    name: 'Kira Nakano',
    callsign: 'NEON_PHANTOM',
    mechModel: 'Spectral Phantom-X',
    maxBoost: 70,
    handling: 90,
  },
  {
    name: 'Bax Sterling',
    callsign: 'VOID_BREACHER',
    mechModel: 'Behemoth Spire-M9',
    maxBoost: 80,
    handling: 75,
  },
];

interface PilotSelectorProps {
  selected: PilotProfile;
  onSelect: (pilot: PilotProfile) => void;
}

export default function PilotSelector({ selected, onSelect }: PilotSelectorProps) {
  const handleSelect = (ship: PilotProfile) => {
    cyberAudio.playBeep(true);
    onSelect(ship);
  };

  return (
    <div id="pilot-selector-root" className="flex flex-col gap-3 font-mono">
      <div className="text-[11px] text-[#ffffff50] uppercase tracking-widest border-b border-[#ffffff10] pb-1 font-bold">
        Select Cyber Ship Specifications
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {SHIPS_DB.map((ship) => {
          const isSelected = ship.callsign === selected.callsign;

          return (
            <div
              key={ship.callsign}
              onClick={() => handleSelect(ship)}
              className={`border p-3 flex flex-col justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'border-neon-cyan bg-neon-cyan/5 text-white'
                  : 'border-[#ffffff10] hover:border-white/20 bg-[#ffffff02] text-[#ffffff60]'
              }`}
            >
              {/* Header Title selection */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] tracking-wider text-white font-bold">{ship.mechModel}</span>
                  <div className="text-[10px] text-neon-cyan lowercase">Callsign: @{ship.callsign}</div>
                </div>
                
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-neon-cyan text-black flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 font-bold" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/10" />
                )}
              </div>

              {/* Stats Indicators bars */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 pt-2.5 border-t border-white/5 text-[9px] uppercase tracking-wider font-mono">
                {/* Max Speed Thrusters */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5 text-neon-cyan" /> Speed
                    </span>
                    <span>{ship.maxBoost}%</span>
                  </div>
                  <div className="h-1 bg-[#ffffff05] flex">
                    <div className="h-full bg-neon-cyan" style={{ width: `${ship.maxBoost}%` }} />
                  </div>
                </div>

                {/* Lateral Handling Steer */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 text-neon-purple" /> Handling
                    </span>
                    <span>{ship.handling}%</span>
                  </div>
                  <div className="h-1 bg-[#ffffff05] flex">
                    <div className="h-full bg-neon-purple" style={{ width: `${ship.handling}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
