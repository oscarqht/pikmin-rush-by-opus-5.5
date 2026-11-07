import React, { useState, useEffect } from 'react';
import { PTD } from '../../engine';

interface EndModalProps {
  result: {
    win: boolean;
    stars: number;
    lives: number;
    kills: number;
    wave: number;
    totalWaves: number;
    levelIndex: number;
    hero?: { gained: number; before: number; after: number } | null;
  };
  onRetry: () => void;
  onContinue: () => void;
}

export const EndModal: React.FC<EndModalProps> = ({
  result,
  onRetry,
  onContinue,
}) => {
  const [activeStars, setActiveStars] = useState<number[]>([]);
  const lv = PTD.LEVELS[result.levelIndex];

  useEffect(() => {
    setActiveStars([]);
    if (result.win) {
      if (lv) {
        PTD.Save.setStars(lv.id, result.stars);
      }
      const timers: ReturnType<typeof setTimeout>[] = [];
      for (let k = 0; k < result.stars; k++) {
        const timer = setTimeout(() => {
          setActiveStars((prev) => [...prev, k]);
          PTD.Audio.play('star');
        }, 500 + k * 450);
        timers.push(timer);
      }
      return () => timers.forEach(clearTimeout);
    }
  }, [result, lv]);

  const subtitle = result.win
    ? (lv && lv.winText) || 'The Pikmin have been driven back to their Onion!'
    : 'The Pikmin overran the burrow. Regroup and try again!';
  const hero = result.hero;
  const levelsUp = hero ? hero.after - hero.before : 0;

  return (
    <div className={`modal active ${result.win ? 'win' : 'lose'}`} id="modal-end">
      <div className="panel wood end">
        <div id="end-stars" className="end-stars">
          {[0, 1, 2].map((k) => (
            <i key={k} className={activeStars.includes(k) ? 'on' : ''}>
              ★
            </i>
          ))}
        </div>
        <h2 id="end-title">{result.win ? 'VICTORY!' : 'DEFEAT'}</h2>
        <div id="end-sub" className="sub">
          {subtitle}
        </div>
        <div id="end-stats">
          <span>❤ {result.lives} lives left</span>
          <span>☠ {result.kills} defeated</span>
          <span>
            Wave {Math.min(result.wave, result.totalWaves)}/{result.totalWaves}
          </span>
        </div>
        {hero && hero.gained > 0 && (
          <div className="end-hero">
            Emperor Bulblax +{hero.gained} XP
            {levelsUp > 0 && (
              <b>
                {' '}
                · Level {hero.after}! +{levelsUp} skill point{levelsUp > 1 ? 's' : ''}
              </b>
            )}
          </div>
        )}
        {result.win && <div className="end-hint">Spend stars on the world map's Upgrades screen.</div>}
        <div className="row">
          <button
            id="end-retry"
            className="btn"
            onClick={() => {
              PTD.Audio.play('click');
              onRetry();
            }}
          >
            {result.win ? 'Replay' : 'Retry'}
          </button>
          <button
            id="end-map"
            className="btn green"
            onClick={() => {
              PTD.Audio.play('click');
              onContinue();
            }}
          >
            {result.win ? 'Continue' : 'World Map'}
          </button>
        </div>
      </div>
    </div>
  );
};
