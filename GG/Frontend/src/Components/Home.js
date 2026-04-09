import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.scss";
import logo from "../Styles/logo.png";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-utrecht">
      <div className="home-utrecht__inner">
        <img
          src={logo}
          alt="Language Exchange Matchmaker"
          className="home-utrecht__logo"
        />
        <p className="home-utrecht__eyebrow">Language exchange / 매칭</p>
        <h1 className="home-utrecht__title">
          Language Exchange Matchmaker
          <span className="home-utrecht__title-sub">Korean · English · 실제 사람과 연습</span>
        </h1>
        <hr className="home-utrecht__rule" />
        <p className="home-utrecht__intro">
          A quiet space to practice with partners who fit your schedule and goals.
        </p>
        <div className="home-utrecht__actions">
          <button type="button" className="home-utrecht__link" onClick={() => navigate("/Login")}>
            Log in
          </button>
          <span className="home-utrecht__sep" aria-hidden>
            ·
          </span>
          <button type="button" className="home-utrecht__link" onClick={() => navigate("/Register")}>
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
