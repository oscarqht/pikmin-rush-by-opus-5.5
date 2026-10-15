import React, { useState, useEffect, useRef } from 'react';
import { PTD, drawAlmanacPreview } from '../../engine';

interface AlmanacModalProps {
  onClose: () => void;
}

export const AlmanacModal: React.FC<AlmanacModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'creatures' | 'invaders'>('creatures');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const animCanvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<number>(0);

  const getEntries = (tab: 'creatures' | 'invaders') => {
    const entries: any[] = [];
    if (tab === 'creatures') {
      const order = [
        'groink1',
        'manatlegs',
        'snitch',
        'den1',
        'den2',
        'den3',
        'bulbear',
        'breadbug',
        'hog1',
        'withering',
        'puffy',
        'cannon1',
        'decorated',
        'wolly',
      ];
      for (const id of order) {
        if (PTD.TOWERS[id]) {
          entries.push({
            por: PTD.towerPortrait(id),
            name: PTD.TOWERS[id].name,
            kind: 'tower',
            id,
          });
        }
      }
      entries.push({
        por: 'borb:emperor',
        name: PTD.HERO.name,
        kind: 'hero',
      });
      entries.push({
        por: 'spell:snagret',
        name: PTD.SPELLS.snagret.name,
        kind: 'spell',
        id: 'snagret',
      });
      entries.push({
        por: 'spell:reinforce',
        name: PTD.SPELLS.reinforce.name,
        kind: 'spell',
        id: 'reinforce',
      });
    } else {
      for (const id of Object.keys(PTD.ENEMIES)) {
        entries.push({
          por: PTD.enemyPortrait(id, 2),
          name: PTD.ENEMIES[id].name,
          kind: 'enemy',
          id,
        });
      }
    }
    return entries;
  };

  const entries = getEntries(activeTab);

  // Set default selection when tab changes
  useEffect(() => {
    if (entries.length > 0) {
      setSelectedEntry(entries[0]);
    }
  }, [activeTab]);

  // Animation loop for big preview canvas
  useEffect(() => {
    if (!selectedEntry || !animCanvasRef.current) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      timeRef.current += dt;

      if (animCanvasRef.current && selectedEntry) {
        drawAlmanacPreview(animCanvasRef.current, selectedEntry, timeRef.current);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [selectedEntry]);

  // Render entry details
  const renderDetails = () => {
    if (!selectedEntry) return null;
    const en = selectedEntry;

    let desc = '';
    const stats: { label: string; val: string }[] = [];

    if (en.kind === 'tower') {
      const t = PTD.TOWERS[en.id];
      desc = t.desc;
      stats.push({
        label: 'Type',
        val: PTD.FAMILY_NAME[t.family] + (t.tier === 4 ? ' · Elite' : ' · Tier ' + t.tier),
      });
      stats.push({ label: 'Cost', val: `${t.cost} pokos` });
      if (PTD.towerStats) {
        PTD.towerStats(en.id).forEach((s: string) => stats.push({ label: '', val: s }));
      }
    } else if (en.kind === 'enemy') {
      const e = PTD.ENEMIES[en.id];
      desc = e.desc;
      stats.push({ label: 'HP', val: `${e.hp}${e.pik ? ' (leaf)' : ''}` });
      stats.push({
        label: 'Speed',
        val: e.speed < 25 ? 'Slow' : e.speed < 38 ? 'Normal' : e.speed < 50 ? 'Fast' : 'Very fast',
      });
      stats.push({ label: 'Armour', val: `${Math.round((e.armor || 0) * 100)}%` });
      stats.push({ label: 'Magic res', val: `${Math.round((e.mres || 0) * 100)}%` });
      stats.push({ label: 'Lives', val: String(e.lives) });
      stats.push({ label: 'Bounty', val: `${e.reward} pokos` });
      if (e.flying) stats.push({ label: '', val: 'Flying' });
    } else if (en.kind === 'hero') {
      desc = PTD.HERO.desc;
      stats.push({ label: 'HP', val: String(PTD.HERO.hp) });
      stats.push({ label: 'Bite', val: PTD.HERO.dmg.join('-') });
      stats.push({ label: 'Armour', val: '25%' });
      stats.push({ label: 'Respawn', val: `${PTD.HERO.respawn}s` });
    } else {
      const s = PTD.SPELLS[en.id];
      desc = s.desc;
      stats.push({ label: 'Cooldown', val: `${s.cd}s` });
    }

    return (
      <div id="alm-detail">
        <canvas
          ref={animCanvasRef}
          width={440}
          height={360}
          className="alm-big"
        />
        <h3>{en.name}</h3>
        <p>{desc}</p>
        <div className="alm-stats">
          {stats.map((st, i) => (
            <span key={i}>
              {st.label && <b>{st.label} </b>}
              {st.val}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modal active" id="modal-almanac">
      <div className="panel parch almanac">
        <button
          className="x"
          onClick={() => {
            PTD.Audio.play('click');
            onClose();
          }}
        >
          ✕
        </button>
        <h2>Piklopedia</h2>
        <div id="alm-tabs">
          <button
            className={activeTab === 'creatures' ? 'sel' : ''}
            onClick={() => {
              PTD.Audio.play('click');
              setActiveTab('creatures');
            }}
          >
            Creatures (yours)
          </button>
          <button
            className={activeTab === 'invaders' ? 'sel' : ''}
            onClick={() => {
              PTD.Audio.play('click');
              setActiveTab('invaders');
            }}
          >
            Invaders
          </button>
        </div>
        <div className="alm-body">
          <div id="alm-grid">
            {entries.map((en) => {
              const s = PTD.Art.portrait(en.por, 72);
              const isSelected = selectedEntry?.name === en.name;
              return (
                <button
                  key={en.name}
                  className={`alm-item ${isSelected ? 'sel' : ''}`}
                  onClick={() => {
                    PTD.Audio.play('click');
                    setSelectedEntry(en);
                  }}
                >
                  <AlmanacThumbnail sprite={s} />
                  <span>{en.name}</span>
                </button>
              );
            })}
          </div>
          {renderDetails()}
        </div>
      </div>
    </div>
  );
};

// Thumbnail subcomponent using canvas
const AlmanacThumbnail: React.FC<{ sprite: any }> = ({ sprite }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !sprite) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(sprite.c, 0, 0, canvasRef.current.width, canvasRef.current.height);
  }, [sprite]);

  return <canvas ref={canvasRef} width={sprite?.c?.width || 72} height={sprite?.c?.height || 72} />;
};
