import React from 'react';
import { PTD } from '../engine';

interface TitleScreenProps {
  onStartAdventure: () => void;
  onOpenAlmanac: () => void;
  onOpenAbout: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartAdventure,
  onOpenAlmanac,
  onOpenAbout,
}) => {
  const handlePlay = () => {
    PTD.Audio.init();
    PTD.Audio.play('click');
    onStartAdventure();
  };

  const handleAlmanac = () => {
    PTD.Audio.init();
    PTD.Audio.play('click');
    onOpenAlmanac();
  };

  const handleAbout = () => {
    PTD.Audio.init();
    PTD.Audio.play('click');
    onOpenAbout();
  };

  return (
    <div className="screen active" id="screen-title">
      <div className="title-wrap">
        <div className="logo">
          <div className="logo-top">BULBORB</div>
          <div className="logo-bottom">RUSH</div>
          <div className="logo-sub">A Pikmin Tower Defense</div>
        </div>
        <div className="title-buttons">
          <button className="btn big green" onClick={handlePlay}>
            Start Adventure
          </button>
          <button className="btn" onClick={handleAlmanac}>
            Piklopedia
          </button>
          <button className="btn small" onClick={handleAbout}>
            About
          </button>
        </div>
      </div>
      <div className="title-hint">
        The Pikmin are coming to raid the creature kingdom. Defend the burrow with Bulborbs, Blowhogs and friends!
      </div>
    </div>
  );
};
