import { useEffect, useMemo, useRef, useState } from 'react';
import { Overlay } from '../components/Overlay';
import { AudioController } from '../components/AudioController';
import Confetti from 'react-confetti';

type PlayResponse = { score: number };
type RoundResponse = { targetHex: string };

type GameProps = {
  onBackHome: () => void;
};

export const Game = ({ onBackHome }: GameProps) => {
  const [targetHex, setTargetHex] = useState<string>('');
  const [userHex, setUserHex] = useState<string>('#ff0000');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [showScore, setShowScore] = useState<boolean>(false);
  const submitAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchRound = async () => {
      try {
        const res = await fetch('/api/round/today');
        if (!res.ok) throw new Error('Failed to fetch round');
        const data: RoundResponse = await res.json();
        setTargetHex(data.targetHex);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchRound();
  }, []);

  const submit = async () => {
    try {
      setError(null);
      const res = await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetHex, userHex }),
      });
      if (!res.ok) throw new Error('Failed to score');
      const data: PlayResponse = await res.json();
      setScore(data.score);
      setShowScore(true);
      try { await submitAudioRef.current?.play(); } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const shareText = useMemo(() => {
    const pct = score ?? 0;
    return `I scored ${pct}% on ColorMash!`;
  }, [score]);

  const reset = () => {
    setUserHex('#ff0000');
    setScore(null);
    setShowScore(false);
  };

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden">
      {showScore && <Confetti className="fixed inset-0 z-40" recycle={false} numberOfPieces={250} />}
      <img
        src="/Background.png"
        alt="Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover"
      />

      <AudioController />
      <audio ref={submitAudioRef} src="/Submit.wav" />

      <div className="relative z-10 min-h-screen">
        <div className="flex items-start justify-between p-4">
          <button
            onClick={onBackHome}
            className="px-4 py-2 bg-white text-gray-900 border border-amber-400 rounded-md shadow-lg z-20"
            style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
          >
            Home
          </button>

          <button
            onClick={reset}
            className="px-4 py-2 bg-white text-gray-900 border border-amber-400 rounded-md shadow-lg z-20"
            style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
          >
            Reset
          </button>

          <div></div>
        </div>

        <div className="flex flex-col items-center justify-center gap-5 px-4 py-6">
          {loading ? (
            <div className="text-white/90">Loading…</div>
          ) : error ? (
            <div className="text-red-200">{error}</div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-40 h-40 rounded-md border-4 border-white shadow-lg"
                  style={{ backgroundColor: targetHex }}
                />
                <span className="text-white/90 text-sm font-bold">Target Color</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-40 h-40 border-4 border-amber-400 rounded-md shadow-lg flex flex-wrap">
                  {[
                    '#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00', '#bfff00', '#80ff00', '#40ff00',
                    '#00ff00', '#00ff40', '#00ff80', '#00ffbf', '#00ffff', '#00bfff', '#0080ff', '#0040ff',
                    '#0000ff', '#4000ff', '#8000ff', '#bf00ff', '#ff00ff', '#ff00bf', '#ff0080', '#ff0040',
                    '#ff4040', '#ff8040', '#ffbf40', '#ffff40', '#bfff40', '#80ff40', '#40ff40', '#00ff40',
                    '#40ff80', '#40ffbf', '#40ffff', '#40bfff', '#4080ff', '#4040ff', '#8040ff', '#bf40ff',
                    '#ff40ff', '#ff40bf', '#ff4080', '#ff4040', '#ff8080', '#ffbf80', '#ffff80', '#bfff80',
                    '#80ff80', '#40ff80', '#00ff80', '#00ffbf', '#00ffff', '#00bfff', '#0080ff', '#0040ff',
                    '#4040ff', '#8040ff', '#bf40ff', '#ff40ff', '#ff40bf', '#ff4080', '#ff4040', '#ff8080',
                    '#ffbf80', '#ffff80', '#bfff80', '#80ff80', '#40ff80', '#00ff80', '#00ffbf', '#00ffff'
                  ].map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setUserHex(color)}
                      className={`w-5 h-5 border border-gray-300 ${
                        userHex === color ? 'ring-2 ring-yellow-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${index + 1}`}
                    />
                  ))}
                </div>
                <span className="text-white/90 text-sm font-bold">Your Pick</span>
              </div>

              <button
                onClick={submit}
                className="px-8 py-3 bg-white text-gray-900 border border-amber-400 rounded-md shadow-lg text-lg font-bold"
                style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
              >
                Submit
              </button>
            </>
          )}
        </div>
      </div>

      {showScore && score !== null && (
        <Overlay onClose={() => setShowScore(false)}>
          <div className="flex flex-col items-center gap-3">
            <div className="text-xl">🎉 You scored {score}% accuracy!</div>
            <div className="flex gap-2">
              <a
                className="px-4 py-2 bg-white text-gray-900 border border-amber-400 rounded-md"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
              >
                Share on X
              </a>
              <button
                className="px-4 py-2 bg-white text-gray-900 border border-amber-400 rounded-md"
                onClick={() => {
                  // Fallback: open Reddit submit page
                  const url = `https://www.reddit.com/submit?selftext=true&title=${encodeURIComponent(shareText)}`;
                  window.open(url, '_blank');
                }}
                style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
              >
                Post on Reddit
              </button>
              <button
                className="px-4 py-2 bg-white text-gray-900 border border-amber-400 rounded-md"
                onClick={onBackHome}
                style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
};


