import React from "react";
import { useNavigate } from "react-router-dom";
import "./Login.scss"; // reuse auth styles
import logo from "../Styles/logo.png";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <img
          src={logo}
          alt="Language Exchange Matchmaker logo"
          className="auth-logo"
        />
        <h1 className="auth-title">Language Exchange Matchmaker</h1>
        <p className="auth-subtitle">
          A focused space to practice Korean and English with real people.
        </p>

        <div className="login-input">
          <label className="button-header">Already have an account?</label>
          <button className="auth-primary" type="button" onClick={() => navigate("/Login")}>
            Log In
          </button>
        </div>

        <div className="login-input">
          <label className="button-header">New here?</label>
          <button className="auth-secondary" type="button" onClick={() => navigate("/Register")}>
            Create an account
          </button>
        </div>

      </div>
    </div>
  );
}

export default Home;
