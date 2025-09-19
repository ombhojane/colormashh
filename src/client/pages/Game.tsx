import { useEffect, useMemo, useRef, useState } from 'react';
import { Overlay } from '../components/Overlay';
import { AudioController } from '../components/AudioController';
import Confetti from 'react-confetti';

// Color conversion utilities
const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) throw new Error('Invalid hex color');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

const pivotRgb = (n: number) => {
  const value = n / 255;
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
};

const rgbToXyz = (r: number, g: number, b: number) => {
  const R = pivotRgb(r);
  const G = pivotRgb(g);
  const B = pivotRgb(b);
  const x = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  return { x, y, z };
};

const fLab = (t: number) => {
  const delta = 6 / 29;
  return t > Math.pow(delta, 3) ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29;
};

const xyzToLab = (x: number, y: number, z: number) => {
  const Xn = 0.95047;
  const Yn = 1.0;
  const Zn = 1.08883;
  const fx = fLab(x / Xn);
  const fy = fLab(y / Yn);
  const fz = fLab(z / Zn);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
};

const hexToLab = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const { x, y, z } = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
};

const deltaE76 = (lab1: { L: number; a: number; b: number }, lab2: { L: number; a: number; b: number }) => {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
};

const hsvToRgb = (h: number, s: number, v: number) => {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const deltaEToPercent = (deltaE: number) => {
  const clamped = Math.max(0, Math.min(100, 100 - deltaE));
  return Math.round(clamped);
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const rgbToHex = (r: number, g: number, b: number) => {
  const to = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
};

type RoundResponse = { targetHex: string };

type GameProps = {
  onBackHome: () => void;
};

export const Game = ({ onBackHome }: GameProps) => {
  const [targetHex, setTargetHex] = useState<string>('');
  const [hue, setHue] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(1);
  const [value, setValue] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [showScore, setShowScore] = useState<boolean>(false);
  const submitAudioRef = useRef<HTMLAudioElement | null>(null);

  const userHex = useMemo(() => {
    const { r, g, b } = hsvToRgb(hue, saturation, value);
    return rgbToHex(r, g, b);
  }, [hue, saturation, value]);

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
      // Calculate score client-side using Delta E
      const targetLab = hexToLab(targetHex);
      const userLab = hexToLab(userHex);
      const deltaE = deltaE76(targetLab, userLab);
      const calculatedScore = deltaEToPercent(deltaE);
      
      setScore(calculatedScore);
      setShowScore(true);
      try { await submitAudioRef.current?.play(); } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const shareText = useMemo(() => {
    const pct = score ?? 0;
    let emoji = '🎯';
    let message = 'Not bad!';
    
    if (pct >= 95) {
      emoji = '🔥';
      message = 'PERFECT MATCH!';
    } else if (pct >= 85) {
      emoji = '🌟';
      message = 'Amazing!';
    } else if (pct >= 70) {
      emoji = '👏';
      message = 'Great job!';
    } else if (pct >= 50) {
      emoji = '👍';
      message = 'Good try!';
    }
    
    return `${emoji} ${message} I scored ${pct}% accuracy on ColorMash! 🎨 Can you beat my color matching skills? #ColorMash #ColorGame`;
  }, [score]);

  const reset = () => {
    setHue(0);
    setSaturation(1);
    setValue(1);
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

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header with icon buttons */}
        <div className="flex items-center justify-between p-4 flex-shrink-0">
          <button
            onClick={onBackHome}
            className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm text-gray-900 border border-amber-400 rounded-lg shadow-lg hover:bg-white transition-all duration-200"
            style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
          >
            <img src="/Home.png" alt="Home" className="w-4 h-4" />
            Home
          </button>

          <button
            onClick={reset}
            className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm text-gray-900 border border-amber-400 rounded-lg shadow-lg hover:bg-white transition-all duration-200"
            style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
          >
            <img src="/Reset.png" alt="Reset" className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Main game content - horizontal layout */}
        <div className="flex-1 flex items-center justify-center px-4 py-4">
          <div className="w-full max-w-lg">
            {loading ? (
              <div className="text-center text-xl font-bold text-white bg-black/50 backdrop-blur-sm px-6 py-3 rounded-lg">
                Loading…
              </div>
            ) : error ? (
              <div className="text-center text-lg font-bold text-red-100 bg-red-500/80 backdrop-blur-sm px-6 py-3 rounded-lg">
                {error}
              </div>
            ) : (
              <div className="space-y-4">
                {/* A | B - Target Color and Your Pick side by side */}
                <div className="flex gap-4 justify-center">
                  {/* A - Target Color */}
                  <div className="text-center bg-black/30 backdrop-blur-sm p-3 rounded-lg border border-amber-400/50 flex-1">
                    <h3 className="text-sm font-bold text-white mb-2" style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}>
                      Target Color
                    </h3>
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-white shadow-lg mx-auto"
                      style={{ backgroundColor: targetHex }}
                    />
                  </div>

                  {/* B - Your Pick */}
                  <div className="text-center bg-black/30 backdrop-blur-sm p-3 rounded-lg border border-amber-400/50 flex-1">
                    <h3 className="text-sm font-bold text-white mb-2" style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}>
                      Your Pick
                    </h3>
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-white shadow-lg mx-auto"
                      style={{ backgroundColor: userHex }}
                    />
                  </div>
                </div>

                {/* PPPP - Palette and Slider */}
                <div className="text-center bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-amber-400/50">
                  <div className="space-y-3">
                    {/* Saturation/Value picker */}
                    <div className="w-48 h-48 border-2 border-white rounded-lg shadow-lg relative overflow-hidden mx-auto">
                      <div
                        className="w-full h-full cursor-crosshair"
                        style={{
                          background: `linear-gradient(to right, white, hsl(${hue}, 100%, 50%)), linear-gradient(to top, black, transparent)`
                        }}
                        onMouseDown={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          const newSaturation = clamp(x / rect.width, 0, 1);
                          const newValue = clamp(1 - (y / rect.height), 0, 1);
                          setSaturation(newSaturation);
                          setValue(newValue);
                        }}
                        onMouseMove={(e) => {
                          if (e.buttons === 1) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            const newSaturation = clamp(x / rect.width, 0, 1);
                            const newValue = clamp(1 - (y / rect.height), 0, 1);
                            setSaturation(newSaturation);
                            setValue(newValue);
                          }
                        }}
                      >
                        <div
                          className="absolute w-3 h-3 border-2 border-white rounded-full pointer-events-none"
                          style={{
                            left: `${saturation * 100}%`,
                            top: `${(1 - value) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.8)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Hue slider */}
                    <div className="w-48 h-6 border-2 border-white rounded shadow-lg relative mx-auto">
                      <div
                        className="w-full h-full cursor-pointer rounded"
                        style={{
                          background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                        }}
                        onMouseDown={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const newHue = clamp((x / rect.width) * 360, 0, 360);
                          setHue(newHue);
                        }}
                        onMouseMove={(e) => {
                          if (e.buttons === 1) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const newHue = clamp((x / rect.width) * 360, 0, 360);
                            setHue(newHue);
                          }
                        }}
                      >
                        <div
                          className="absolute w-2 h-full border border-white rounded pointer-events-none"
                          style={{
                            left: `${(hue / 360) * 100}%`,
                            transform: 'translateX(-50%)',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.8)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SUBMIT - Submit Button */}
                <div className="text-center">
                  <button
                    onClick={submit}
                    className="px-8 py-3 bg-white text-gray-900 border border-amber-400 rounded-lg shadow-lg text-lg font-bold hover:bg-gray-50 transition-all duration-200"
                    style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showScore && score !== null && (
        <Overlay onClose={() => setShowScore(false)}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              You scored {score}% accuracy!
            </div>
            
            {/* Score visualization */}
            <div className="flex gap-3 items-center">
              <div
                className="w-12 h-12 rounded border-2 border-gray-300 shadow"
                style={{ backgroundColor: targetHex }}
              />
              <div className="text-sm font-bold text-gray-700">vs</div>
              <div
                className="w-12 h-12 rounded border-2 border-gray-300 shadow"
                style={{ backgroundColor: userHex }}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-bold transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const simpleText = `I scored ${score}% accuracy on ColorMash! Can you beat my color matching skills?`;
                  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(simpleText)}`;
                  window.open(tweetUrl, '_blank', 'width=550,height=420,scrollbars=yes,resizable=yes');
                }}
                style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
              >
                Share on X
              </button>
              <button
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-bold transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const redditUrl = `https://www.reddit.com/submit?title=${encodeURIComponent(shareText)}`;
                  window.location.href = redditUrl;
                }}
                style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
              >
                Post to Reddit
              </button>
            </div>
            
            <button
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-bold transition-colors"
              onClick={onBackHome}
              style={{ fontFamily: 'Comic Sans MS, Comic Sans, Chalkboard SE, cursive' }}
            >
              Home
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
};


