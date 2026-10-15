import React from 'react';
import { PTD } from '../engine';

interface WorldMapScreenProps {
  onBackToTitle: () => void;
  onSelectLevel: (levelIndex: number) => void;
  onOpenAlmanac: () => void;
}

export const WorldMapScreen: React.FC<WorldMapScreenProps> = ({
  onBackToTitle,
  onSelectLevel,
  onOpenAlmanac,
}) => {
  const levels = PTD.LEVELS || [];
  const save = PTD.Save.load();

  const isUnlocked = (index: number) => {
    if (index === 0) return true;
    return (save.stars && save.stars[levels[index - 1]?.id]) > 0;
  };

  let totalStars = 0;
  levels.forEach((lv: any) => {
    totalStars += (save.stars && save.stars[lv.id]) || 0;
  });

  const handleNodeClick = (index: number, open: boolean) => {
    PTD.Audio.init();
    if (!open) {
      PTD.Audio.play('deny');
      return;
    }
    PTD.Audio.play('click');
    onSelectLevel(index);
  };

  return (
    <div className="screen active" id="screen-map">
      <div id="map-nodes">
        {levels.map((lv: any, i: number) => {
          const st = (save.stars && save.stars[lv.id]) || 0;
          const open = isUnlocked(i);
          const isDone = st > 0;
          const isNext = open && !isDone;

          return (
            <button
              key={lv.id}
              className={`map-node ${open ? '' : 'locked'} ${isDone ? 'done' : ''} ${isNext ? 'next' : ''}`}
              style={{
                left: `${lv.mapPos[0] / 12.8}%`,
                top: `${lv.mapPos[1] / 7.2}%`,
              }}
              onClick={() => handleNodeClick(i, open)}
            >
              <span className="flag">
                <span className="num">{i + 1}</span>
              </span>
              <span className="stars">
                {[0, 1, 2].map((k) => (
                  <i key={k} className={k < st ? 'on' : ''}>
                    ★
                  </i>
                ))}
              </span>
              <span className="label">{lv.name}</span>
            </button>
          );
        })}
      </div>

      <div className="map-bar">
        <button
          className="btn small"
          onClick={() => {
            PTD.Audio.play('click');
            onBackToTitle();
          }}
        >
          ◀ Title
        </button>
        <div className="map-stars">
          <span className="star">★</span>{' '}
          <span>{`${totalStars} / ${levels.length * 3}`}</span>
        </div>
        <button
          className="btn small"
          onClick={() => {
            PTD.Audio.play('click');
            onOpenAlmanac();
          }}
        >
          Piklopedia
        </button>
      </div>
    </div>
  );
};
