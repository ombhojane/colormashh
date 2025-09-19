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
        className="fixed top-3 right-3 z-40 px-3 py-1 bg-white text-gray-900 border border-amber-400 rounded-md shadow"
        style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
      >
        {muted ? 'Unmute' : 'Mute'}
      </button>
    </>
  );
};


