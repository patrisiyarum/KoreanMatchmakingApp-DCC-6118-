
import React from 'react';
import { createSearchParams, useSearchParams, useNavigate } from 'react-router-dom';
import './GameSelect.css';
import Navbar from './NavBar';

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
          <div className="lm-games-hero-icon" aria-hidden>
            🎮
          </div>
          <h1 className="lm-games-title">Language Games</h1>
          <p className="lm-games-tagline">Practice and improve your skills</p>
        </header>

        <div className="lm-game-cards lm-game-cards--solo">
          <button
            type="button"
            className="lm-game-card"
            onClick={goToTermMatching}
            disabled={!id}
            title={!id ? 'Open Games from a partner card to play together' : undefined}
          >
            <div className="lm-game-card-main">
              <span className="lm-game-card-title">Vocabulary Quiz</span>
              <span className="lm-game-card-sub">Test your Korean vocabulary knowledge</span>
            </div>
            <span className="lm-game-card-arrow" aria-hidden>›</span>
          </button>

          <div className="lm-game-card lm-game-card--disabled" aria-disabled="true">
            <div className="lm-game-card-main">
              <span className="lm-game-card-title">Translation Challenge</span>
              <span className="lm-game-card-sub lm-game-card-soon">Coming soon!</span>
            </div>
          </div>

          <div className="lm-game-card lm-game-card--disabled" aria-disabled="true">
            <div className="lm-game-card-main">
              <span className="lm-game-card-title">Speed Match</span>
              <span className="lm-game-card-sub lm-game-card-soon">Coming soon!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameSelect;
