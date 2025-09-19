import { useState } from 'react';
import { Overlay } from '../components/Overlay';
import { AudioController } from '../components/AudioController';

type LandingProps = {
  onStartGame: () => void;
};

export const Landing = ({ onStartGame }: LandingProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden">
      <img
        src="/Background.png"
        alt="Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover"
      />
      <AudioController />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <img
          src="/Logo.png"
          alt="ColorMash Logo"
          className="w-[260px] max-w-[70vw] mb-6 drop-shadow-md"
        />

        <button
          onClick={() => setShowMenu(true)}
          className="px-8 py-3 bg-white text-gray-900 border border-amber-400 rounded-md shadow-sm active:scale-95 transition-transform tracking-wider"
          style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
        >
          MASH
        </button>
      </div>

      {showMenu && (
        <Overlay onClose={() => setShowMenu(false)}>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setShowMenu(false);
                onStartGame();
              }}
              className="px-8 py-3 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white border-2 border-white rounded-lg shadow-lg text-lg font-bold transform hover:scale-105 transition-all duration-200"
              style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
            >
              🎮 Play Game
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setShowRules(true);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 border-2 border-amber-400 rounded-lg hover:bg-gray-50 transition-all duration-200"
              style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
            >
              <img src="/Info.png" alt="Info" className="w-5 h-5" />
              Info / Rules
            </button>
          </div>
        </Overlay>
      )}

      {showRules && (
        <Overlay onClose={() => setShowRules(false)}>
          <div className="text-gray-900 max-w-sm">
            <h2 className="text-xl font-bold mb-2">How to Play</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Match today’s target color as closely as possible.</li>
              <li>Pick your color and press Submit to see your score.</li>
              <li>Share and challenge friends!</li>
            </ul>
          </div>
        </Overlay>
      )}
    </div>
  );
};


