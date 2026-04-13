import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import axios from 'axios';
import { registerApi } from '@/api/authApi';
import { getApiBase } from '@/api/apiBase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function Register() {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const navigate = useNavigate();
  const { setUserId } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    try {
      const data = await registerApi(
        firstName.trim(),
        lastName.trim(),
        email.trim(),
        password
      );
      if (data.errorCode !== 0 || data.id == null) {
        setErrMsg(data.message || 'Registration failed.');
        return;
      }
      setUserId(String(data.id));
      navigate('/create-profile', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && !err.response) {
        const base = getApiBase();
        setErrMsg(
          base
            ? `Cannot reach API at ${base}. Start the backend or fix API_BASE_URL.`
            : 'Cannot reach API (same origin / Vite proxy). Start the backend on port 8080.'
        );
        return;
      }
      const ax = err as {
        response?: { data?: { message?: string; errorCode?: number } };
        message?: string;
      };
      setErrMsg(
        ax.response?.data?.message ||
          ax.message ||
          'Server error. Is the backend running on port 8080?'
      );
    }
  };

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25';

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-gradient-to-b from-violet-100/80 via-white to-sky-50/90">
      <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-xl shadow-violet-900/10">
          <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pb-8 pt-10 text-center sm:px-8 sm:pb-10 sm:pt-12">
            <div className="mb-5 flex items-center justify-center gap-3 sm:gap-4" aria-hidden>
              <span className="select-none text-5xl leading-none drop-shadow-md sm:text-6xl">🇺🇸</span>
              <span className="text-2xl font-light text-white/90 sm:text-3xl" aria-hidden>
                ⇄
              </span>
              <span className="select-none text-5xl leading-none drop-shadow-md sm:text-6xl">🇰🇷</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              LangMatch <span className="font-semibold text-white/90">언어교환</span>
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/90">
              {t(
                'Find Korean and English language partners to practice together.',
                '한국어와 영어 언어교환 파트너를 찾는 앱입니다.'
              )}
            </p>
          </div>

          <div className="px-6 py-8 text-center sm:px-8">
            <h2 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
              {t('Create account', '회원가입')}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              {t('Join LangMatch 언어교환', 'LangMatch 언어교환에 참여하세요')}
            </p>

            <form className="mt-8 space-y-5 text-left" onSubmit={handleSubmit}>
              {errMsg ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errMsg}
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700" htmlFor="reg-first">
                    {t('First name', '이름')}
                  </label>
                  <input
                    id="reg-first"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700" htmlFor="reg-last">
                    {t('Last name', '성')}
                  </label>
                  <input
                    id="reg-last"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700" htmlFor="reg-email">
                  {t('Email', '이메일')}
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700" htmlFor="reg-password">
                  {t('Password', '비밀번호')}
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:from-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                {t('Register', '회원가입')}
              </button>
            </form>

            <p className="mt-6 text-sm text-neutral-600">
              {t('Already have an account?', '이미 계정이 있으신가요?')}{' '}
              <Link
                to="/login"
                className="font-semibold text-violet-600 hover:text-violet-700 hover:underline"
              >
                {t('Sign in', '로그인')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
