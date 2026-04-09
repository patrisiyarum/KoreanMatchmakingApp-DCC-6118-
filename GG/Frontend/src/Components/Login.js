import { useState } from 'react';
import React from "react";
import './Login.scss';
import { handleLoginApi } from '../Services/userService';
import logo from "../Styles/logo.png";
import { createSearchParams, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from 'react-icons/fi';
 
function Login() {
    let data;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [errMsg, setErrMsg] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(false);
 
    const handleOnChangeUserInput = (event) => {
        setUsername(event.target.value);
        setSubmitted(false);
    }
 
    const handleOnChangePassword = (event) => {
        setPassword(event.target.value);
        setSubmitted(false);
    }
 
    const handleBack = () => {
        navigate({ pathname: "/Register" });
    };
 
    const handleOnClick = async () => {
        setErrMsg("");
        try {
            data = await handleLoginApi(username, password);
            console.log("check >>>>", data.errorCode);
      if (data && data.errorCode != 0) {
        setErrMsg(data.message || "Login failed.");
      } else if (data && data.errorCode == 0) {
                // Full page load so the browser fetches the latest index.html + JS (avoids stale
                // bundle after login while an old main.*.js was still in memory).
                const base = process.env.PUBLIC_URL || '';
                const qs = createSearchParams({ id: data.id }).toString();
                window.location.assign(`${base}/Dashboard?${qs}`);
            }
        } catch (error) {
            const msg =
                error.response?.data?.message ||
                (typeof error.response?.data === "string"
                    ? error.response.data
                    : null) ||
                error.message ||
                "Server error. Try again.";
            setErrMsg(msg);
        }
    }
 
    return (
        <div className="auth-page">
          <div className="auth-card">
            <img src={logo} alt="Language Exchange Matchmaker logo" className="auth-logo" />
            <h1 className="auth-title">Login</h1>
            <p className="auth-subtitle">Welcome back. Let’s pick up where you left off.</p>

            <div className="login-input login-input--minimal">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder=""
                value={username}
                onChange={handleOnChangeUserInput}
              />
            </div>

            <div className="login-input login-input--minimal">
              <label htmlFor="password">Password</label>
              <div className="password-field password-field--minimal">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder=""
                  value={password}
                  onChange={handleOnChangePassword}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div className="error-message">{errMsg}</div>

            <div className="auth-signin-row">
              <button type="button" className="auth-pill-submit" onClick={handleOnClick}>
                Sign in
              </button>
              <button
                type="button"
                className="auth-arrow-submit"
                onClick={handleOnClick}
                aria-label="Sign in"
              >
                →
              </button>
            </div>

            <div className="auth-actions auth-actions--stacked">
              <p className="auth-prompt">New here?</p>
              <button className="auth-secondary" type="button" onClick={handleBack}>
                Create an account
              </button>
            </div>
          </div>
        </div>
    );
}
 
export default Login;
 