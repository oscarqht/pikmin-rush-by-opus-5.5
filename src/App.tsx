import React, { useState, useEffect, useCallback } from 'react';
import { PTD } from './engine';
import { GameCanvas } from './components/GameCanvas';
import { TitleScreen } from './components/TitleScreen';
import { WorldMapScreen } from './components/WorldMapScreen';
import { BriefingModal } from './components/modals/BriefingModal';
import { AlmanacModal } from './components/modals/AlmanacModal';
import { PauseModal } from './components/modals/PauseModal';
import { EndModal } from './components/modals/EndModal';
import { AboutModal } from './components/modals/AboutModal';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<'title' | 'map' | 'game'>('title');
  const [modal, setModal] = useState<'brief' | 'almanac' | 'pause' | 'end' | 'about' | null>(null);
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<string>('normal');
  const [game, setGame] = useState<any>(null);
  const [endResult, setEndResult] = useState<any>(null);
  const [musicOn, setMusicOn] = useState<boolean>(true);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [stageStyle, setStageStyle] = useState<React.CSSProperties>({});
  const [loaded, setLoaded] = useState<boolean>(false);

  // Initialize audio and save data on mount
  useEffect(() => {
    const save = PTD.Save.load();
    const isMuted = !!save.muted;
    const isMusic = save.music !== false;

    PTD.Audio.muted = isMuted;
    PTD.Audio.musicOn = isMusic;
    setSoundOn(!isMuted);
    setMusicOn(isMusic);

    // Initial music
    PTD.Audio.startMusic('title');
    setLoaded(true);
  }, []);

  // Window resize to letterbox stage
  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / PTD.W, vh / PTD.H);
      const w = Math.floor(PTD.W * scale);
      const h = Math.floor(PTD.H * scale);
      setStageStyle({
        width: `${w}px`,
        height: `${h}px`,
        fontSize: `${16 * scale}px`,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStartAdventure = () => {
    setScreen('map');
    PTD.Audio.startMusic('map');
  };

  const handleBackToTitle = () => {
    if (game) {
      game.paused = false;
      game.over = true;
      setGame(null);
    }
    setScreen('title');
    PTD.Audio.startMusic('title');
  };

  const handleSelectLevel = (idx: number) => {
    setLevelIndex(idx);
    setModal('brief');
  };

  const handleStartLevel = (idx: number = levelIndex) => {
    setLevelIndex(idx);
    setModal(null);
    const lv = PTD.LEVELS[idx];
    const save = PTD.Save.load();
    const newGame = new PTD.Game(lv, { difficulty, seen: save.seen || {} });
    newGame.initUI();

    newGame.on('newEnemy', () => {
      const s = PTD.Save.load();
      s.seen = newGame.seenTypes;
      PTD.Save.write();
    });

    setGame(newGame);
    setScreen('game');
    PTD.Audio.startMusic(lv.theme);
  };

  const handlePause = useCallback(() => {
    if (screen !== 'game' || !game || game.over) return;
    game.paused = true;
    setModal('pause');
    PTD.Audio.play('click');
  }, [screen, game]);

  const handleResume = useCallback(() => {
    if (game) {
      game.paused = false;
    }
    setModal(null);
    PTD.Audio.play('click');
  }, [game]);

  const handleRestart = () => {
    setModal(null);
    handleStartLevel(levelIndex);
  };

  const handleQuitToMap = () => {
    if (game) {
      game.paused = false;
      game.over = true;
      setGame(null);
    }
    setModal(null);
    setScreen('map');
    PTD.Audio.startMusic('map');
  };

  const handleToggleMusic = useCallback(() => {
    PTD.Audio.init();
    const next = !musicOn;
    PTD.Audio.setMusic(next);
    PTD.Save.data.music = next;
    PTD.Save.write();
    setMusicOn(next);
  }, [musicOn]);

  const handleToggleSound = useCallback(() => {
    PTD.Audio.init();
    const next = !soundOn;
    PTD.Audio.setMuted(!next);
    PTD.Save.data.muted = !next;
    PTD.Save.write();
    setSoundOn(next);
  }, [soundOn]);

  const handleGameEnd = useCallback(
    (r: any) => {
      if (!game) return;
      const res = {
        win: r.win,
        stars: r.stars,
        lives: game.lives,
        kills: game.stats.kills,
        wave: game.waveIdx,
        totalWaves: game.waveTotal,
        levelIndex,
      };
      setEndResult(res);
      setModal('end');
      if (r.win) {
        PTD.Audio.play('win');
      } else {
        PTD.Audio.play('lose');
      }
    },
    [game, levelIndex]
  );

  return (
    <div id="stage" style={stageStyle}>
      {/* Background and Game Canvas */}
      <GameCanvas
        screen={screen}
        game={game}
        onPause={handlePause}
        onToggleMute={handleToggleSound}
        onEnd={handleGameEnd}
      />

      {/* Screen Overlays */}
      {screen === 'title' && (
        <TitleScreen
          onStartAdventure={handleStartAdventure}
          onOpenAlmanac={() => setModal('almanac')}
          onOpenAbout={() => setModal('about')}
        />
      )}

      {screen === 'map' && (
        <WorldMapScreen
          onBackToTitle={handleBackToTitle}
          onSelectLevel={handleSelectLevel}
          onOpenAlmanac={() => setModal('almanac')}
        />
      )}

      {/* Modals */}
      {modal === 'brief' && (
        <BriefingModal
          levelIndex={levelIndex}
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          onStart={() => handleStartLevel(levelIndex)}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'almanac' && <AlmanacModal onClose={() => setModal(null)} />}

      {modal === 'pause' && (
        <PauseModal
          musicOn={musicOn}
          soundOn={soundOn}
          onResume={handleResume}
          onRestart={handleRestart}
          onQuitToMap={handleQuitToMap}
          onToggleMusic={handleToggleMusic}
          onToggleSound={handleToggleSound}
        />
      )}

      {modal === 'end' && endResult && (
        <EndModal
          result={endResult}
          onRetry={() => {
            setModal(null);
            handleStartLevel(levelIndex);
          }}
          onContinue={() => {
            setModal(null);
            handleQuitToMap();
          }}
        />
      )}

      {modal === 'about' && <AboutModal onClose={() => setModal(null)} />}

      {!loaded && (
        <div id="loading">
          <div className="spinner"></div>Growing sprouts…
        </div>
      )}
    </div>
  );
};
