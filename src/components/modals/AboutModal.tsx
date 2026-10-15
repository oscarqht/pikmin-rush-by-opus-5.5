import React from 'react';
import { PTD } from '../../engine';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="modal active" id="modal-about">
      <div className="panel parch about">
        <button
          className="x"
          onClick={() => {
            PTD.Audio.play('click');
            onClose();
          }}
        >
          ✕
        </button>
        <h2>About</h2>
        <p>
          <b>Bulborb Rush</b> is a fan-made tower defense tribute in the style of <i>Kingdom Rush</i>, set in the world of{' '}
          <i>Pikmin</i> — but with the roles reversed. You command the native creatures; the Pikmin and their captains are the invaders.
        </p>
        <p>
          Every sprite, prop, map and sound in this game is generated procedurally in React + Canvas 2D + Web Audio. No external images or audio files are used.
        </p>
        <p className="small">
          Pikmin and all related characters are trademarks of Nintendo. This is a non-commercial fan project.
        </p>
        <h3>How to play</h3>
        <ul>
          <li>Click a dirt plot to build a creature. Click a creature to upgrade, evolve at tier 3, or sell it.</li>
          <li>Press the flashing Onion flag to send the next wave early for bonus pokos.</li>
          <li>Click the Emperor Bulblax (or his portrait), then click the ground to move him.</li>
          <li>Snagret Strike (1) and Reinforcements (2) are your special powers.</li>
        </ul>
      </div>
    </div>
  );
};
