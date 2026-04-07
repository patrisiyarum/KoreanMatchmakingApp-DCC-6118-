import React, { useState } from "react";
import { createSearchParams, useSearchParams, useNavigate } from "react-router-dom";
import translate from "translate";
import Navbar from './NavBar';
import "./Translator.css";

const DIR_EN_TO_KO = 'en-ko';
const DIR_KO_TO_EN = 'ko-en';

function Translator() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const id = search.get("id");

  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [direction, setDirection] = useState(DIR_EN_TO_KO);

  const translateButton = async () => {
    if (!inputText.trim()) return;
    try {
      const isEnToKo = direction === DIR_EN_TO_KO;
      const text = await translate(inputText, {
        from: isEnToKo ? 'en' : 'ko',
        to: isEnToKo ? 'ko' : 'en',
      });
      setTranslatedText(text);
    } catch (err) {
      console.error("Translation error:", err);
    }
  };

  const onClear = () => {
    setInputText("");
    setTranslatedText("");
  };

  const handleSwapDirection = () => {
    setDirection((d) => (d === DIR_EN_TO_KO ? DIR_KO_TO_EN : DIR_EN_TO_KO));
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const handleBack = () => {
    navigate({ pathname: "/Dashboard", search: createSearchParams({ id }).toString() });
  };

  const isEnToKo = direction === DIR_EN_TO_KO;
  const fromLabel = isEnToKo ? 'English' : 'Korean';
  const toLabel = isEnToKo ? 'Korean' : 'English';

  return (
    <div className="tl-page">
      <Navbar id={id} />
      <div className="tl-center">
        <div className="tl-card">
          <h1 className="tl-title">Translator</h1>

          <div className="tl-direction">
            <button
              type="button"
              className={`tl-dir-btn ${direction === DIR_EN_TO_KO ? 'active' : ''}`}
              onClick={() => setDirection(DIR_EN_TO_KO)}
            >
              English → Korean
            </button>
            <button
              type="button"
              className={`tl-dir-btn ${direction === DIR_KO_TO_EN ? 'active' : ''}`}
              onClick={() => setDirection(DIR_KO_TO_EN)}
            >
              Korean → English
            </button>
          </div>

          <div className="tl-panel">
            <div className="tl-column">
              <span className="tl-label">{fromLabel}</span>
              <textarea
                className="tl-box"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type ${fromLabel.toLowerCase()}...`}
              />
            </div>
            <button
              type="button"
              className="tl-swap"
              onClick={handleSwapDirection}
              aria-label="Swap direction"
              title="Swap input and output"
            >
              ⇅
            </button>
            <div className="tl-column">
              <span className="tl-label">{toLabel}</span>
              <textarea
                className="tl-box"
                value={translatedText}
                readOnly
                placeholder="Translation will appear here..."
              />
            </div>
          </div>

          <div className="tl-controls">
            <button className="tl-btn-primary" onClick={translateButton}>Translate</button>
            <button className="tl-btn-secondary" onClick={onClear}>Clear</button>
            <button className="back-to-dashboard" onClick={handleBack}>Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Translator;
