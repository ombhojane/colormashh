import { useEffect, useRef, useState } from 'react';

export const AudioController = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = 0.3;
    audioRef.current.loop = true;

    const tryPlay = async () => {
      try {
        await audioRef.current!.play();
      } catch {
        // Autoplay might be blocked; button press will trigger later
      }
    };
    tryPlay();
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = muted;
  }, [muted]);

  return (
    <>
      <audio ref={audioRef} src="/BGAudio.mp3" />
      <button
        onClick={() => setMuted((m) => !m)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1 px-2 py-2 bg-white/90 backdrop-blur-sm text-gray-900 border border-amber-400 rounded-lg shadow-lg hover:bg-white transition-all duration-200"
        style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
      >
        <img src="/Audio.png" alt="Audio" className="w-4 h-4" />
        {muted ? '🔇' : '🔊'}
      </button>
    </>
  );
};


