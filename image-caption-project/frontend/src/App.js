import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "https://sidxd-image-captioning-with-vgg16.hf.space";

const WAVE_DELAYS = [0, 0.1, 0.2, 0.05, 0.15, 0.25, 0.08, 0.18, 0.03, 0.22, 0.12, 0.07];
const WAVE_HEIGHTS = ["35%", "70%", "55%", "90%", "45%", "80%", "60%", "35%", "75%", "50%", "88%", "42%"];

function App() {
  const [image, setImage]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [caption, setCaption]   = useState("");
  const [audio, setAudio]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [dark, setDark]         = useState(true);
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [curTime, setCurTime]   = useState("0:00");
  const [totTime, setTotTime]   = useState("0:00");
  const audioRef = useRef(null);

  useEffect(() => {
    document.body.className = dark ? "" : "light";
  }, [dark]);

  const fmt = (s) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const generate = async () => {
    if (!image) return alert("Upload an image first");
    const formData = new FormData();
    formData.append("file", image);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/predict`, formData);
      setCaption(res.data.caption);
      setAudio(res.data.audio);
      setProgress(0);
      setPlaying(false);
    } catch {
      alert("Backend error");
    }
    setLoading(false);
  };

  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    setProgress((el.currentTime / el.duration) * 100);
    setCurTime(fmt(el.currentTime));
    setTotTime(fmt(el.duration));
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play(); setPlaying(true); }
  };

  const handleEnded = () => setPlaying(false);

  const seekTrack = (e) => {
    const bar = e.currentTarget;
    const r = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const el = audioRef.current;
    if (el && el.duration) {
      el.currentTime = pct * el.duration;
      setProgress(pct * 100);
    }
  };

  return (
    <>
      {/* Animated background */}
      <div className="bg-scene">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>

      {/* Theme toggle */}
      <div className="top-bar">
        <button className="theme-btn" onClick={() => setDark(!dark)}>
          <span>{dark ? "☀" : "☾"}</span>
          <span>{dark ? "Light" : "Dark"}</span>
        </button>
      </div>

      <div className="app">
        {/* LEFT */}
        <div className="left">
          <div className="badge">
            <div className="badge-dot" />
            AI Powered Vision
          </div>

          <h1>
            Image<br />
            <span>Captioning</span>
          </h1>

          <p>
            Upload any image and get a natural, human-like description
            powered by state-of-the-art vision AI — with audio playback.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feat-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              Instant visual understanding
            </div>
            <div className="feature-item">
              <div className="feat-icon">
                <svg viewBox="0 0 24 24">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </div>
              Text-to-speech audio output
            </div>
            <div className="feature-item">
              <div className="feat-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              JPG, PNG, WEBP supported
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
          {/* Upload panel */}
          <div className="panel">
            <div className="panel-label">Upload image</div>

            <label className="upload-zone" htmlFor="fileInput">
              <div className="upload-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <span className="upload-label">Click to upload</span>
              <span className="upload-sub">PNG, JPG, WEBP — up to 10MB</span>
            </label>
            <input
              type="file" id="fileInput"
              accept="image/*" hidden
              onChange={handleChange}
            />

            {preview && (
              <img src={preview} className="preview-img" alt="preview" />
            )}

            <button
              className="gen-btn"
              onClick={generate}
              disabled={loading}
            >
              {loading ? "Analyzing image…" : "Generate Caption"}
            </button>
          </div>

          {/* Caption + Audio panel */}
          {caption && (
            <div className="caption-panel">
              <div className="panel-label">Generated caption</div>
              <div className="caption-text">{caption}</div>

              {audio && (
                <>
                  <div className="divider" />
                  <div className="audio-panel">
                    <div className="audio-label">Audio playback</div>

                    {/* Waveform */}
                    <div className={`waveform${playing ? "" : " paused"}`}>
                      {WAVE_HEIGHTS.map((h, i) => (
                        <span
                          key={i}
                          style={{
                            height: h,
                            animationDelay: `${WAVE_DELAYS[i]}s`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Player */}
                    <div className="audio-player">
                      <button className="play-btn" onClick={togglePlay}>
                        {playing ? (
                          <svg viewBox="0 0 24 24" fill="white" width="13" height="13">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="white" width="13" height="13">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </button>
                      <div className="audio-track">
                        <div className="track-bar" onClick={seekTrack}>
                          <div
                            className="track-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="track-times">
                          <span>{curTime}</span>
                          <span>{totTime}</span>
                        </div>
                      </div>
                    </div>

                    <audio
                      ref={audioRef}
                      src={audio}
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={handleEnded}
                      hidden
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;