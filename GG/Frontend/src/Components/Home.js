import React from "react";
import { useNavigate } from "react-router-dom";
import "./Login.scss";
import logo from "../Styles/logo.png";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="auth-page lm-landing">
      <div className="auth-card lm-landing-card" style={{ maxWidth: 480 }}>
        <div className="lm-landing-flags" aria-hidden="true">
          <span className="lm-landing-flag">🇰🇷</span>
          <span className="lm-landing-flag">🇺🇸</span>
        </div>
        <img
          src={logo}
          alt=""
          className="auth-logo lm-landing-logo"
        />
        <h1 className="auth-title lm-landing-title">
          Welcome to LangMatch{" "}
          <span className="lm-landing-title-ko" lang="ko">환영합니다</span>
        </h1>
        <p className="auth-subtitle lm-landing-sub">
          Connect with language partners worldwide.
        </p>
        <p className="lm-landing-bilingual-note" lang="ko">
          전 세계 언어 파트너와 연결하세요
        </p>

        <div className="home-landing-actions">
          <div className="home-landing-section">
            <p className="auth-prompt lm-bilingual-label">
              Already have an account? <span lang="ko">이미 계정이 있으신가요?</span>
            </p>
            <button className="auth-primary" type="button" onClick={() => navigate('/Login')}>
              Log In <span className="lm-btn-ko" lang="ko">로그인</span>
            </button>
          </div>
          <div className="home-landing-section home-landing-section--split">
            <p className="auth-prompt lm-bilingual-label">
              New here? <span lang="ko">처음이신가요?</span>
            </p>
            <button className="auth-secondary" type="button" onClick={() => navigate('/Register')}>
              Create an account <span className="lm-btn-ko" lang="ko">회원가입</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Home;
