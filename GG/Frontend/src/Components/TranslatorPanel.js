import React, { useState } from 'react';
import translate from 'translate';
import { useTranslator } from '../context/TranslatorContext';
import './TranslatorPanel.css';

const DIR_EN_TO_KO = 'en-ko';
const DIR_KO_TO_EN = 'ko-en';

function TranslatorPanel() {
  const { isOpen, closeTranslator } = useTranslator();
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translating, setTranslating] = useState(false);
  const [direction, setDirection] = useState(DIR_EN_TO_KO);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setTranslating(true);
    try {
      const isEnToKo = direction === DIR_EN_TO_KO;
      const text = await translate(inputText, {
        from: isEnToKo ? 'en' : 'ko',
        to: isEnToKo ? 'ko' : 'en',
      });
      setTranslatedText(text);
    } catch (err) {
      console.error('Translation error:', err);
      setTranslatedText('(Translation failed)');
    } finally {
      setTranslating(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
  };

  const handleSwapDirection = () => {
    setDirection((d) => (d === DIR_EN_TO_KO ? DIR_KO_TO_EN : DIR_EN_TO_KO));
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  if (!isOpen) return null;

  const isEnToKo = direction === DIR_EN_TO_KO;
  const fromLabel = isEnToKo ? 'English' : 'Korean';
  const toLabel = isEnToKo ? 'Korean' : 'English';

  return (
    <>
      <div className="translator-panel-backdrop" onClick={closeTranslator} aria-hidden="true" />
      <div className="translator-panel" role="dialog" aria-label="Translator">
        <div className="translator-panel-header">
          <h3 className="translator-panel-title">Translator</h3>
          <button className="translator-panel-close" onClick={closeTranslator} aria-label="Close translator">
            ×
          </button>
        </div>
        <div className="translator-panel-body">
          <div className="translator-panel-direction">
            <button
              type="button"
              className={`translator-panel-dir-btn ${direction === DIR_EN_TO_KO ? 'active' : ''}`}
              onClick={() => setDirection(DIR_EN_TO_KO)}
            >
              English → Korean
            </button>
            <button
              type="button"
              className={`translator-panel-dir-btn ${direction === DIR_KO_TO_EN ? 'active' : ''}`}
              onClick={() => setDirection(DIR_KO_TO_EN)}
            >
              Korean → English
            </button>
          </div>
          <div className="translator-panel-row">
            <label className="translator-panel-label">{fromLabel}</label>
            <textarea
              className="translator-panel-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Type ${fromLabel.toLowerCase()}...`}
              rows={3}
            />
          </div>
          <button
            type="button"
            className="translator-panel-swap"
            onClick={handleSwapDirection}
            aria-label="Swap direction"
            title="Swap input and output"
          >
            ⇅
          </button>
          <div className="translator-panel-row">
            <label className="translator-panel-label">{toLabel}</label>
            <textarea
              className="translator-panel-input"
              value={translatedText}
              readOnly
              placeholder="Translation..."
              rows={3}
            />
          </div>
          <div className="translator-panel-actions">
            <button className="translator-panel-btn translator-panel-btn-primary" onClick={handleTranslate} disabled={translating || !inputText.trim()}>
              {translating ? 'Translating...' : 'Translate'}
            </button>
            <button className="translator-panel-btn translator-panel-btn-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default TranslatorPanel;
