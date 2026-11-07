import React, { useState } from 'react';
import { PTD } from '../../engine';
import { PortraitCanvas } from '../PortraitCanvas';

interface UpgradesModalProps {
  onClose: () => void;
}

/** Star upgrade tree: 6 tracks × 5 ranks, bought with stars earned in levels. Free reset. */
export const UpgradesModal: React.FC<UpgradesModalProps> = ({ onClose }) => {
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const P = PTD.Progress;
  const earned = P.starsEarned();
  const avail = P.starsAvailable();
  const spent = P.starsSpent();

  const buy = (track: string) => {
    if (P.buy(track)) PTD.Audio.play('upgrade');
    else PTD.Audio.play('deny');
    refresh();
  };

  const reset = () => {
    if (spent === 0) return;
    P.resetTree();
    PTD.Audio.play('sell');
    refresh();
  };

  return (
    <div className="modal active" id="modal-upgrades">
      <div className="panel parch upgrades">
        <button
          className="x"
          onClick={() => {
            PTD.Audio.play('click');
            onClose();
          }}
        >
          ✕
        </button>
        <h2>Upgrades</h2>
        <div className="upg-head">
          <span className="upg-stars">
            <i>★</i> {avail} to spend
          </span>
          <span className="upg-note">
            {earned} earned · {spent} spent · Upgrades apply to every level.
          </span>
          <button className="btn small red" disabled={spent === 0} onClick={reset}>
            Reset (free)
          </button>
        </div>
        <div className="upg-tracks">
          {PTD.UPGRADE_TREE.map((tr: any) => {
            const rank = P.rank(tr.id);
            return (
              <div key={tr.id} className="upg-track">
                <div className="upg-title">
                  <PortraitCanvas por={tr.por} size={56} className="upg-por" />
                  <div>
                    <b>{tr.name}</b>
                    <small>{tr.blurb}</small>
                  </div>
                </div>
                {tr.ranks.map((rk: any, i: number) => {
                  const owned = i < rank;
                  const next = i === rank;
                  const cost = PTD.RANK_COST[i];
                  const can = next && avail >= cost;
                  return (
                    <button
                      key={i}
                      className={`upg-rank ${owned ? 'owned' : ''} ${next ? 'next' : ''} ${can ? 'can' : ''}`}
                      disabled={!can}
                      onClick={() => buy(tr.id)}
                      title={owned ? 'Owned' : next ? (can ? 'Click to buy' : 'Not enough stars') : 'Buy the previous rank first'}
                    >
                      <span className="upg-cost">{owned ? '✔' : `★${cost}`}</span>
                      <span className="upg-desc">{rk.d}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="upg-foot">Earn up to 3 stars per level ({PTD.LEVELS.length * 3} total). Ranks cost 1/1/2/2/3 stars, so choose where to invest.</div>
      </div>
    </div>
  );
};
