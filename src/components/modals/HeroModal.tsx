import React, { useState } from 'react';
import { PTD } from '../../engine';
import { PortraitCanvas } from '../PortraitCanvas';

interface HeroModalProps {
  onClose: () => void;
}

/** Emperor Bulblax: persistent level (cap 10) and 4 skills × 3 ranks, bought with skill points. */
export const HeroModal: React.FC<HeroModalProps> = ({ onClose }) => {
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const P = PTD.Progress;
  const xp = P.heroXp();
  const level = P.heroLevel();
  const max = PTD.HERO_MAX_LEVEL;
  const XP = PTD.HERO_XP;
  const into = level >= max ? 1 : (xp - XP[level]) / (XP[level + 1] - XP[level]);
  const points = P.pointsAvailable();
  const spent = P.pointsSpent();
  const H = PTD.HERO;
  const hpNow = Math.round(H.hp * (1 + (level - 1) * 0.12) * (1 + 0.15 * P.skillRank('hide')));
  const dmgMul = 1 + (level - 1) * 0.1;

  const buy = (id: string) => {
    if (P.buySkill(id)) PTD.Audio.play('upgrade');
    else PTD.Audio.play('deny');
    refresh();
  };

  return (
    <div className="modal active" id="modal-hero">
      <div className="panel parch hero-panel">
        <button
          className="x"
          onClick={() => {
            PTD.Audio.play('click');
            onClose();
          }}
        >
          ✕
        </button>
        <h2>{H.name}</h2>
        <div className="hero-top">
          <PortraitCanvas por="borb:emperor" size={110} className="hero-por" />
          <div className="hero-info">
            <div className="hero-lv">
              Level {level}
              {level >= max ? ' (max)' : ` / ${max}`}
            </div>
            <div className="hero-xp">
              <div className="hero-xp-fill" style={{ width: `${Math.round(into * 100)}%` }} />
              <span>{level >= max ? `${Math.floor(xp)} XP` : `${Math.floor(xp - XP[level])} / ${XP[level + 1] - XP[level]} XP`}</span>
            </div>
            <div className="hero-stats">
              <span>HP {hpNow}</span>
              <span>
                Bite {Math.round(H.dmg[0] * dmgMul)}-{Math.round(H.dmg[1] * dmgMul)}
              </span>
              <span>Armour {Math.round(Math.min(0.7, H.armor + 0.06 * P.skillRank('hide')) * 100)}%</span>
            </div>
            <div className="hero-note">The Emperor keeps his XP between levels. Every level gained gives 1 skill point.</div>
          </div>
        </div>
        <div className="hero-points">
          <span>
            <b>{points}</b> skill point{points === 1 ? '' : 's'} to spend
          </span>
          <button
            className="btn small red"
            disabled={spent === 0}
            onClick={() => {
              P.resetSkills();
              PTD.Audio.play('sell');
              refresh();
            }}
          >
            Reset skills
          </button>
        </div>
        <div className="hero-skills">
          {PTD.HERO_SKILLS.map((sk: any) => {
            const rank = P.skillRank(sk.id);
            const can = points > 0 && rank < 3;
            return (
              <div key={sk.id} className="hero-skill">
                <div className="hs-head">
                  <b>{sk.name}</b>
                  <span className="hs-pips">
                    {[0, 1, 2].map((k) => (
                      <i key={k} className={k < rank ? 'on' : ''} />
                    ))}
                  </span>
                </div>
                <p>{sk.desc}</p>
                <ol>
                  {sk.ranks.map((r: string, k: number) => (
                    <li key={k} className={k < rank ? 'on' : k === rank ? 'next' : ''}>
                      {r}
                    </li>
                  ))}
                </ol>
                <button className="btn small green" disabled={!can} onClick={() => buy(sk.id)}>
                  {rank >= 3 ? 'Mastered' : `Learn rank ${rank + 1}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
