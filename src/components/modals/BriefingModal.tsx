import React, { useEffect, useRef } from 'react';
import { PTD } from '../../engine';

interface BriefingModalProps {
  levelIndex: number;
  difficulty: string;
  onSelectDifficulty: (diff: string) => void;
  onStart: () => void;
  onClose: () => void;
}

export const BriefingModal: React.FC<BriefingModalProps> = ({
  levelIndex,
  difficulty,
  onSelectDifficulty,
  onStart,
  onClose,
}) => {
  const thumbRef = useRef<HTMLDivElement>(null);
  const enemiesRef = useRef<HTMLDivElement>(null);

  const lv = PTD.LEVELS[levelIndex];
  const save = PTD.Save.load();
  const st = (save.stars && save.stars[lv.id]) || 0;

  useEffect(() => {
    if (!lv) return;

    // Render thumbnail
    if (thumbRef.current) {
      thumbRef.current.innerHTML = '';
      const built = PTD.buildLevel(lv);
      const c = PTD.Art.paintLevel(built, 0.5);
      c.className = 'thumb';
      thumbRef.current.appendChild(c);
    }

    // Render enemy preview mini portraits
    if (enemiesRef.current) {
      enemiesRef.current.innerHTML = '';
      const types: string[] = [];
      lv.waves.forEach((w: any) =>
        w.forEach((g: any) => {
          if (!types.includes(g.type)) types.push(g.type);
        })
      );

      for (const t of types) {
        const s = PTD.Art.portrait(PTD.enemyPortrait(t, 0), 48);
        const cv = document.createElement('canvas');
        cv.width = s.c.width;
        cv.height = s.c.height;
        cv.getContext('2d')?.drawImage(s.c, 0, 0);
        cv.className = 'mini';
        cv.title = PTD.ENEMIES[t]?.name || t;
        enemiesRef.current.appendChild(cv);
      }
    }
  }, [lv, levelIndex]);

  if (!lv) return null;

  return (
    <div className="modal active" id="modal-brief">
      <div className="panel wood brief">
        <button
          className="x"
          onClick={() => {
            PTD.Audio.play('click');
            onClose();
          }}
        >
          ✕
        </button>
        <h2>{lv.name}</h2>
        <div className="sub">{lv.subtitle}</div>
        <div className="brief-body">
          <div id="brief-thumb" ref={thumbRef}></div>
          <div className="brief-text">
            <p>{lv.desc}</p>
            <div className="meta">
              {lv.waves.length} waves · {lv.paths.length} trail{lv.paths.length > 1 ? 's' : ''} · Starting pokos {lv.gold}
            </div>
            <div className="label">Invaders</div>
            <div id="brief-enemies" ref={enemiesRef}></div>
            <div className="stars">
              {[0, 1, 2].map((k) => (
                <i key={k} className={k < st ? 'on' : ''}>
                  ★
                </i>
              ))}
            </div>
          </div>
        </div>
        <div className="brief-foot">
          <div id="brief-diff">
            {(['casual', 'normal', 'veteran'] as const).map((d) => (
              <button
                key={d}
                className={difficulty === d ? 'sel' : ''}
                onClick={() => {
                  PTD.Audio.play('click');
                  onSelectDifficulty(d);
                }}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="btn big green"
            onClick={() => {
              PTD.Audio.play('click');
              onStart();
            }}
          >
            To Battle!
          </button>
        </div>
      </div>
    </div>
  );
};
