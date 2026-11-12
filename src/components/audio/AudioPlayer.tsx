import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Repeat,
  Volume2,
  Headphones,
} from "lucide-react";
import { surahs } from "../../constants/quran";
export default function AudioPlayer({
  verseKey,
  onVerse,
}: {
  verseKey: string;
  onVerse: (key: string) => void;
}) {
  const audio = useRef<HTMLAudioElement>(null),
    auto = useRef(false);
  const [playing, setPlaying] = useState(false),
    [position, setPosition] = useState(0),
    [duration, setDuration] = useState(0),
    [error, setError] = useState("");
  const [reciter, setReciter] = useState("Alafasy_128kbps"),
    [rate, setRate] = useState(1),
    [volume, setVolume] = useState(1),
    [repeat, setRepeat] = useState<"none" | "ayah" | "range">("none"),
    [rangeStart, setRangeStart] = useState(1),
    [rangeEnd, setRangeEnd] = useState(7);
  const [s, a] = verseKey.split(":").map(Number),
    count = surahs[s - 1]?.total_verses ?? 7;
  useEffect(() => {
    setRangeStart(1);
    setRangeEnd(count);
  }, [s, count]);
  const attemptPlay = () => {
    const el = audio.current;
    if (!el) return;
    setError("");
    auto.current = true;
    void el.play().catch(() => {
      auto.current = false;
      setPlaying(false);
      setError(
        "Audio could not play. Check your connection, then press play to retry.",
      );
    });
  };
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.src = `https://everyayah.com/data/${reciter}/${String(s).padStart(3, "0")}${String(a).padStart(3, "0")}.mp3`;
    el.playbackRate = rate;
    el.volume = volume;
    setPosition(0);
    setDuration(0);
    setError("");
    if (auto.current) attemptPlay();
  }, [verseKey, reciter]);
  useEffect(() => {
    if (audio.current) {
      audio.current.playbackRate = rate;
      audio.current.volume = volume;
    }
  }, [rate, volume]);
  const step = (delta: number) => {
    const next = a + delta;
    if (next >= 1 && next <= count) onVerse(`${s}:${next}`);
  };
  const ended = () => {
    if (repeat === "ayah") {
      if (audio.current) audio.current.currentTime = 0;
      attemptPlay();
    } else if (repeat === "range" && a >= rangeEnd) {
      if (a === rangeStart) {
        if (audio.current) audio.current.currentTime = 0;
        attemptPlay();
      } else onVerse(`${s}:${rangeStart}`);
    } else if (a < count) {
      onVerse(`${s}:${a + 1}`);
    } else {
      auto.current = false;
      setPlaying(false);
    }
  };
  return (
    <section className="audio-player" aria-label="Quran recitation">
      <audio
        ref={audio}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setPosition(audio.current?.currentTime ?? 0)}
        onLoadedMetadata={() =>
          setDuration(
            Number.isFinite(audio.current?.duration)
              ? audio.current!.duration
              : 0,
          )
        }
        onEnded={ended}
        onError={() => {
          auto.current = false;
          setPlaying(false);
          setError(
            "Recitation unavailable. Check your connection and try again.",
          );
        }}
      />
      <div className="audio-heading">
        <span className="audio-badge">
          <Headphones size={18} />
        </span>
        <div>
          <strong>
            {surahs[s - 1]?.transliteration}{" "}
            <span>
              · {s}:{a}
            </span>
          </strong>
          <label className="sr-only" htmlFor="reciter">
            Reciter
          </label>
          <select
            id="reciter"
            value={reciter}
            onChange={(e) => setReciter(e.target.value)}
          >
            <option value="Alafasy_128kbps">Mishary Rashid Alafasy</option>
            <option value="Abdul_Basit_Murattal_64kbps">
              Abdul Basit Abdul Samad
            </option>
          </select>
        </div>
        <span className="audio-source">EveryAyah · streaming</span>
      </div>
      <div className="audio-main">
        <div className="playback-buttons">
          <button
            className="icon-button"
            aria-label="Previous ayah"
            disabled={a <= 1}
            onClick={() => step(-1)}
          >
            <SkipBack size={18} />
          </button>
          <button
            className="play-button"
            aria-label={playing ? "Pause recitation" : "Play recitation"}
            onClick={() => {
              if (playing) {
                auto.current = false;
                audio.current?.pause();
              } else attemptPlay();
            }}
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            className="icon-button"
            aria-label="Next ayah"
            disabled={a >= count}
            onClick={() => step(1)}
          >
            <SkipForward size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Stop recitation"
            onClick={() => {
              auto.current = false;
              audio.current?.pause();
              if (audio.current) audio.current.currentTime = 0;
            }}
          >
            <Square size={14} />
          </button>
        </div>
        <label className="sr-only" htmlFor="audio-progress">
          Audio progress
        </label>
        <input
          id="audio-progress"
          className="audio-progress"
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={Math.min(position, duration || 1)}
          onChange={(e) => {
            if (audio.current && duration)
              audio.current.currentTime = Number(e.target.value);
          }}
        />
        <span className="audio-time">
          {Math.floor(position / 60)}:
          {String(Math.floor(position % 60)).padStart(2, "0")}
        </span>
        <label className="sr-only" htmlFor="speed">
          Playback speed
        </label>
        <select
          id="speed"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        >
          {[0.75, 1, 1.25, 1.5, 2].map((n) => (
            <option key={n} value={n}>
              {n}×
            </option>
          ))}
        </select>
        <Volume2 size={17} className="volume-icon" />
        <input
          className="volume"
          type="range"
          aria-label="Volume"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
        <button
          className={`icon-button ${repeat !== "none" ? "selected" : ""}`}
          aria-label={`Repeat: ${repeat}. Change repeat mode`}
          onClick={() =>
            setRepeat((r) =>
              r === "none" ? "ayah" : r === "ayah" ? "range" : "none",
            )
          }
        >
          <Repeat size={18} />
          {repeat === "ayah" && <small>1</small>}
        </button>
      </div>
      {repeat === "range" && (
        <div className="repeat-range">
          <span>Repeat ayahs</span>
          <input
            aria-label="Repeat start ayah"
            type="number"
            min={1}
            max={rangeEnd}
            value={rangeStart}
            onChange={(e) =>
              setRangeStart(
                Math.max(1, Math.min(rangeEnd, Number(e.target.value) || 1)),
              )
            }
          />
          <span>through</span>
          <input
            aria-label="Repeat end ayah"
            type="number"
            min={rangeStart}
            max={count}
            value={rangeEnd}
            onChange={(e) =>
              setRangeEnd(
                Math.max(
                  rangeStart,
                  Math.min(count, Number(e.target.value) || rangeStart),
                ),
              )
            }
          />
          <button
            onClick={() => {
              auto.current = true;
              if (a === rangeStart) attemptPlay();
              else onVerse(`${s}:${rangeStart}`);
            }}
          >
            Play range
          </button>
        </div>
      )}
      {error && (
        <p className="audio-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
