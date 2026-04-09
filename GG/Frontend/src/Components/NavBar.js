import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, createSearchParams, useLocation } from 'react-router-dom';
import { useTranslator } from '../context/TranslatorContext';
import { useAssistant } from '../context/AssistantContext';
import BottomNav from './BottomNav';
import './NavBar.css';

function Navbar({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTranslator } = useTranslator();
  const { toggleAssistant } = useAssistant();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreWrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (moreWrapRef.current && !moreWrapRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname, location.search]);

  const goTo = (pathname) => {
    navigate({ pathname, search: createSearchParams({ id }).toString() });
  };

  const goAssistant = () => {
    navigate({ pathname: '/Assistant', search: createSearchParams({ id }).toString() });
    setMoreOpen(false);
  };

  return (
    <>
      <nav className="app-top-nav app-top-nav--lm">
        <div className="app-top-nav-brand">
          <div className="app-top-nav-title">
            LangMatch{' '}
            <span className="app-top-nav-title-ko" lang="ko">
              언어교환
            </span>
          </div>
          <div className="app-top-nav-tagline">
            Find your perfect study partner
            <span className="app-top-nav-tagline-ko" lang="ko">
              {' '}
              · 완벽한 스터디 파트너 찾기
            </span>
          </div>
        </div>

        <div className="app-top-nav-right app-top-nav-right--lm" ref={moreWrapRef}>
          <button
            type="button"
            className="nav-more-btn"
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            onClick={(e) => {
              e.stopPropagation();
              setMoreOpen((o) => !o);
            }}
          >
            Menu
            <span className="nav-more-chevron" aria-hidden>
              ▾
            </span>
          </button>
          {moreOpen && (
            <div className="nav-more-dropdown" role="menu">
              <button type="button" className="nav-more-item" role="menuitem" onClick={() => { goTo('/Scheduler'); setMoreOpen(false); }}>
                Scheduler
              </button>
              <button type="button" className="nav-more-item" role="menuitem" onClick={() => { goTo('/Videocall'); setMoreOpen(false); }}>
                Calls
              </button>
              <button type="button" className="nav-more-item" role="menuitem" onClick={() => { goTo('/ViewProfile'); setMoreOpen(false); }}>
                Profile
              </button>
              <button type="button" className="nav-more-item" role="menuitem" onClick={() => { goAssistant(); }}>
                AI chat
              </button>
              <button type="button" className="nav-more-item" role="menuitem" onClick={() => { toggleAssistant(id); setMoreOpen(false); }}>
                AI assistant (panel)
              </button>
              <button type="button" className="nav-more-item" role="menuitem" onClick={() => { toggleTranslator(); setMoreOpen(false); }}>
                Translator
              </button>
            </div>
          )}
        </div>
      </nav>
      <BottomNav userId={id} />
    </>
  );
}

export default Navbar;
