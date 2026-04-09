import React from 'react';
import { createSearchParams, useSearchParams, useNavigate } from 'react-router-dom';
import './GameSelect.css';
import Navbar from './NavBar';

function GameControllerIcon() {
  return (
    <svg
      className="lm-games-hero-svg"
      viewBox="0 0 80 80"
      aria-hidden
      width={80}
      height={80}
    >
      <defs>
        <linearGradient id="lmPadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="45%" stopColor="#9146ff" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <filter id="lmPadShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.18" />
        </filter>
      </defs>
      <rect
        x="8"
        y="22"
        width="64"
        height="40"
        rx="14"
        fill="url(#lmPadGrad)"
        filter="url(#lmPadShadow)"
      />
      <rect x="14" y="30" width="22" height="10" rx="3" fill="rgba(255,255,255,0.35)" />
      <circle cx="26" cy="48" r="5" fill="rgba(255,255,255,0.9)" />
      <circle cx="54" cy="42" r="4" fill="#f472b6" />
      <circle cx="62" cy="50" r="4" fill="#fde047" />
    </svg>
  );
}

function GameSelect() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();

  const goToTermMatching = () => {
    if (!id) return;
    navigate({ pathname: '/TermMatching', search: createSearchParams({ id }).toString() });
  };

  return (
    <div className="game-selection-page lm-game-page lm-game-page--minimal">
      <Navbar id={id} />
      <div className="gs-content lm-games-menu-wrap">
        <header className="lm-games-hero">
          <div className="lm-games-hero-icon-wrap">
            <GameControllerIcon />
          </div>
          <h1 className="lm-games-title">Language Games</h1>
          <p className="lm-games-title-ko" lang="ko">
            언어 게임
          </p>
          <p className="lm-games-tagline">Practice and improve your skills</p>
        </header>

        <div className="lm-game-cards lm-game-cards--solo">
          <button
            type="button"
            className="lm-game-card lm-game-card--active"
            onClick={goToTermMatching}
            disabled={!id}
            title={!id ? 'Open Games from a partner card to play together' : undefined}
          >
            <div className="lm-game-card-main">
              <span className="lm-game-card-title-row">
                <span className="lm-game-card-title">Vocabulary Quiz</span>
                <span className="lm-game-card-ko" lang="ko">어휘 퀴즈</span>
              </span>
              <span className="lm-game-card-sub">Test your Korean vocabulary knowledge</span>
            </div>
            <span className="lm-game-card-arrow" aria-hidden>
              →
            </span>
          </button>

          <div className="lm-game-card lm-game-card--disabled" aria-disabled="true">
            <div className="lm-game-card-main">
              <span className="lm-game-card-title lm-game-card-title--muted">Translation Challenge</span>
              <span className="lm-game-card-sub lm-game-card-soon">Coming soon!</span>
            </div>
          </div>

          <div className="lm-game-card lm-game-card--disabled" aria-disabled="true">
            <div className="lm-game-card-main">
              <span className="lm-game-card-title lm-game-card-title--muted">Speed Match</span>
              <span className="lm-game-card-sub lm-game-card-soon">Coming soon!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameSelect;
