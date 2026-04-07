import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { startTermMatching, submitTermMatching } from '../Services/gameLogicService';
import { submitChallengeScore } from '../Services/challengeService';
import Navbar from './NavBar';
import './TermMatching.css';

function TermMatching() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const challengeId = search.get('challengeId');
  const urlDifficulty = search.get('difficulty');
  const inChallengeMode = !!challengeId;
  const navigate = useNavigate();

  const [pairs, setPairs] = useState([]);
  const [englishOptions, setEnglishOptions] = useState([]);
  const [selected, setSelected] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [difficulty, setDifficulty] = useState(urlDifficulty || 'Beginner');
  const [activePairId, setActivePairId] = useState(null);
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);

  const loadRound = async (diff) => {
    setLoading(true);
    setResult(null);
    setSelected({});
    setActivePairId(null);
    setChallengeSubmitted(false);
    try {
      const data = await startTermMatching(id, diff || difficulty, 6, challengeId);
      setPairs(data.pairs || []);
      setEnglishOptions(data.englishOptions || []);
    } catch (err) {
      console.error('Failed to start term matching:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRound(); }, []);

  const handleKoreanClick = (pairId) => {
    if (result) return;
    setActivePairId(pairId === activePairId ? null : pairId);
  };

  const handleEnglishClick = (option) => {
    if (result || activePairId === null) return;
    setSelected(prev => ({ ...prev, [activePairId]: option.english }));
    setActivePairId(null);
  };

  const getPairFeedback = (pairId) => {
    const chosen = selected[pairId];
    if (!chosen) return null;
    const pair = pairs.find(p => p.id === pairId);
    if (!pair?.english) return null;
    return pair.english === chosen ? 'correct' : 'wrong';
  };

  const handleSubmit = async () => {
    if (result || submitting) return;
    setSubmitting(true);
    const answers = pairs.map(p => ({ id: p.id, english: selected[p.id] || '' }));
    try {
      const data = await submitTermMatching(id, answers);
      setResult(data);
      if (inChallengeMode) {
        await submitChallengeScore(challengeId, id, data.score);
        setChallengeSubmitted(true);
      }
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    loadRound(e.target.value);
  };

  const allMatched = pairs.length > 0 && pairs.every(p => selected[p.id]);

  if (loading) return <div className="tm-loading">Loading...</div>;

  return (
    <div className="tm-page">
      <Navbar id={id} />
      <div className="tm-page-content">
      <div className="tm-container">
        <div className="tm-header">
          <h2 className="tm-title">Term Matching{inChallengeMode ? ' — Challenge' : ''}</h2>
          <div className="tm-controls">
            {inChallengeMode ? (
              <span className="tm-difficulty-locked">{difficulty}</span>
            ) : (
              <select value={difficulty} onChange={handleDifficultyChange} className="tm-difficulty">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            )}
          </div>
        </div>

        {!result && (
          <p className="tm-instructions">
            Click a Korean word, then click its English match.
          </p>
        )}

        {!result && (
          <>
            <div className="tm-board">
              <div className="tm-column">
                <h4 className="tm-col-label">Korean</h4>
                {pairs.map(p => {
                  const feedback = getPairFeedback(p.id);
                  return (
                    <button
                      key={p.id}
                      className={`tm-card tm-korean ${activePairId === p.id ? 'tm-active' : ''} ${selected[p.id] ? 'tm-matched' : ''} ${
                        feedback === 'correct' ? 'tm-match-correct' : ''
                      } ${feedback === 'wrong' ? 'tm-match-wrong' : ''}`}
                      onClick={() => handleKoreanClick(p.id)}
                    >
                      {p.korean}
                    </button>
                  );
                })}
              </div>
              <div className="tm-column">
                <h4 className="tm-col-label">English</h4>
                {englishOptions.map(o => {
                  const isUsed = Object.values(selected).includes(o.english);
                  const pairUsingThis = pairs.find(p => selected[p.id] === o.english);
                  const feedback = pairUsingThis ? getPairFeedback(pairUsingThis.id) : null;
                  return (
                    <button
                      key={o.id}
                      className={`tm-card tm-english ${isUsed ? 'tm-used' : ''} ${
                        feedback === 'correct' ? 'tm-match-correct' : ''
                      } ${feedback === 'wrong' ? 'tm-match-wrong' : ''}`}
                      onClick={() => handleEnglishClick(o)}
                      disabled={isUsed}
                    >
                      {o.english}
                    </button>
                  );
                })}
              </div>
            </div>
            {pairs.some(p => getPairFeedback(p.id) === 'wrong') && (
              <div className="tm-instant-feedback">
                <p className="tm-feedback-msg">Incorrect matches (red). Correct answers:</p>
                <ul className="tm-feedback-list">
                  {pairs.filter(p => getPairFeedback(p.id) === 'wrong').map(p => (
                    <li key={p.id}><strong>{p.korean}</strong> = {p.english}</li>
                  ))}
                </ul>
                <p className="tm-feedback-hint">Use Reset to try again.</p>
              </div>
            )}
          </>
        )}

        {!result && (
          <div className="tm-actions">
            <button
              className="tm-submit-btn"
              onClick={handleSubmit}
              disabled={!allMatched || submitting}
            >
              {submitting ? 'Checking...' : 'Submit'}
            </button>
            <button className="tm-reset-btn" onClick={() => { setSelected({}); setActivePairId(null); }}>
              Reset
            </button>
          </div>
        )}

        {result && (
          <div className="tm-results">
            <div className="tm-mascot">
              <div className="tm-mascot-circle">
                <span className="tm-mascot-face">{result.score >= 80 ? ':D' : result.score >= 50 ? ':)' : ':/'}</span>
              </div>
              <h3 className="tm-congrats">
                {result.score === 100 ? 'Perfect!' : result.score >= 80 ? 'Great job!' : result.score >= 50 ? 'Nice work!' : 'Keep going!'}
              </h3>
              <p className="tm-congrats-sub">
                {result.score >= 80 ? 'Your vocabulary is growing!' : 'Every round makes you better!'}
              </p>
            </div>

            <div className="tm-score-banner">
              <span className="tm-score">{result.score}%</span>
              <span className="tm-score-detail">{result.correct}/{result.total} correct</span>
            </div>
            <div className="tm-xp-bar-section">
              <div className="tm-xp-earned-label">+{result.xpEarned} XP earned</div>
              <div className="tm-xp-track"><div className="tm-xp-fill" style={{ width: `${Math.min(100, (result.xpEarned / 50) * 100)}%` }} /></div>
            </div>

            {inChallengeMode && challengeSubmitted && (
              <div className="tm-challenge-notice">
                Score submitted! Waiting for your opponent to finish their turn.
              </div>
            )}

            {result.newBadges && result.newBadges.length > 0 && (
              <div className="tm-new-badges">
                <h4>New Badges Earned!</h4>
                {result.newBadges.map(b => (
                  <div key={b.id} className="tm-badge-toast">
                    {b.name}
                  </div>
                ))}
              </div>
            )}

            <div className="tm-correct-pairs">
              <h4>Correct Answers</h4>
              {result.correctPairs && result.correctPairs.map(p => (
                <div key={p.id} className="tm-pair-row">
                  <span>{p.korean}</span> <span>=</span> <span>{p.english}</span>
                </div>
              ))}
            </div>

            <div className="tm-actions">
              {inChallengeMode ? (
                <button className="tm-reset-btn" onClick={() => navigate(`/Challenges?id=${id}`)}>
                  Back to Challenges
                </button>
              ) : (
                <>
                  <button className="tm-submit-btn" onClick={() => loadRound()}>Play Again</button>
                  <button className="tm-reset-btn" onClick={() => navigate(`/GameSelection?id=${id}`)}>
                    Back to Games
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default TermMatching;
