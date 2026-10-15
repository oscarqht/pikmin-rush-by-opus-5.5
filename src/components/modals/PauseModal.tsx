import React from 'react';
import { PTD } from '../../engine';

interface PauseModalProps {
  musicOn: boolean;
  soundOn: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuitToMap: () => void;
  onToggleMusic: () => void;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  musicOn,
  soundOn,
  onResume,
  onRestart,
  onQuitToMap,
  onToggleMusic,
  onToggleSound,
}) => {
  return (
    <div className="modal active" id="modal-pause">
      <div className="panel wood pause">
        <h2>Paused</h2>
        <button
          className="btn green"
          onClick={() => {
            PTD.Audio.play('click');
            onResume();
          }}
        >
          Resume
        </button>
        <div className="row">
          <button
            className="btn small"
            onClick={() => {
              PTD.Audio.play('click');
              onToggleMusic();
            }}
          >
            Music: {musicOn ? 'On' : 'Off'}
          </button>
          <button
            className="btn small"
            onClick={() => {
              PTD.Audio.play('click');
              onToggleSound();
            }}
          >
            Sound: {soundOn ? 'On' : 'Off'}
          </button>
        </div>
        <button
          className="btn"
          onClick={() => {
            PTD.Audio.play('click');
            onRestart();
          }}
        >
          Restart
        </button>
        <button
          className="btn red"
          onClick={() => {
            PTD.Audio.play('click');
            onQuitToMap();
          }}
        >
          Quit to Map
        </button>
        <div className="keys">
          Space pause · F speed · 1/2 spells · H hero · N next wave · Esc cancel
        </div>
      </div>
    </div>
  );
};
