import { useState } from 'react';
import React from "react";
import './Login.scss';
import { handleLoginApi, handleRegisterApi } from '../Services/userService';
import logo from "../Styles/logo.png";
import { createSearchParams, useNavigate } from "react-router-dom";
 
function Registration() {
  let data;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
 
  const handleFirstName = (e) => { setFirstName(e.target.value); setSubmitted(false); };
  const handleLastName  = (e) => { setLastName(e.target.value);  setSubmitted(false); };
  const handleEmail     = (e) => { setEmail(e.target.value);     setSubmitted(false); };
  const handlePassword  = (e) => { setPassword(e.target.value);  setSubmitted(false); };
 
  const handleBack = () => { navigate({ pathname: "/Login" }); };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (firstName === '' || lastName === '' || email === '' || password === '') {
      setError(true);
      setErrMsg("Enter all the fields");
      return;
    }
    setError(false);
    setErrMsg("");
    try {
      console.log('Sending Register:', firstName, lastName, email, password);
      const registerResp = await handleRegisterApi(firstName, lastName, email, password);
      console.log('Register response:', registerResp);

      if (registerResp && registerResp.errorCode !== 0) {
        setSubmitted(true);
        setError(true);
        setErrMsg(registerResp.message || 'Registration failed.');
        return;
      }

      // Auto-login after successful registration.
      const loginResp = await handleLoginApi(email, password);
      const base = process.env.PUBLIC_URL || '';
      if (loginResp && loginResp.errorCode === 0) {
        const qs = createSearchParams({ id: loginResp.id }).toString();
        window.location.assign(`${base}/CreateProfile?${qs}`);
      } else {
        const qs = createSearchParams({ id: registerResp.id }).toString();
        window.location.assign(`${base}/CreateProfile?${qs}`);
      }
    } catch (error) {
      console.error("Register/login error:", error);
      setError(true);
      const msg =
        error.response?.data?.message ||
        (typeof error.response?.data === "string"
          ? error.response.data
          : null) ||
        error.message ||
        "Server error. Try again.";
      setErrMsg(msg);
    }
  };
 
  const errorMessage = () => (
    <div className="error" style={{ display: error ? '' : 'none' }}>
      <h1>{errMsg}</h1>
    </div>
  );
 
  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src={logo} alt="Language Exchange Matchmaker logo" className="auth-logo" />
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Sign up to start games, quests, and practice sessions.</p>

        <div>{errorMessage()}</div>

        <form onSubmit={handleSubmit}>
          <div className="login-input login-input--minimal">
            <label htmlFor="reg-first">First name</label>
            <input
              id="reg-first"
              placeholder=""
              onChange={handleFirstName}
              value={firstName}
              type="text"
              autoComplete="given-name"
            />
          </div>
          <div className="login-input login-input--minimal">
            <label htmlFor="reg-last">Last name</label>
            <input
              id="reg-last"
              placeholder=""
              onChange={handleLastName}
              value={lastName}
              type="text"
              autoComplete="family-name"
            />
          </div>
          <div className="login-input login-input--minimal">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              placeholder=""
              onChange={handleEmail}
              value={email}
              type="email"
              autoComplete="email"
            />
          </div>
          <div className="login-input login-input--minimal">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              placeholder=""
              onChange={handlePassword}
              value={password}
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div className="auth-actions">
            <button className="auth-primary" type="submit">Create an account</button>
          </div>
          <div className="auth-actions auth-actions--stacked">
            <p className="auth-prompt">Already have an account?</p>
            <button className="auth-secondary" type="button" onClick={handleBack}>
              Log in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
export default Registration;