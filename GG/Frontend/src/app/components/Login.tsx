import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { loginApi } from '@/api/authApi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const navigate = useNavigate();
  const { setUserId } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    try {
      const data = await loginApi(email.trim(), password);
      if (data.errorCode !== 0 || data.id == null) {
        setErrMsg(data.message || 'Login failed.');
        return;
      }
      setUserId(String(data.id));
      navigate('/create-profile', { replace: true });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setErrMsg(
        ax.response?.data?.message ||
          ax.message ||
          'Server error. Is the backend running on port 8080?'
      );
    }
  };

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25';

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-gradient-to-b from-violet-100/80 via-white to-sky-50/90">
      <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex h-[44rem] flex-col overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-xl shadow-violet-900/10">
          <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pb-8 pt-10 text-center sm:px-8 sm:pb-10 sm:pt-12">
            <div className="mb-5 flex items-center justify-center gap-3 sm:gap-4" aria-hidden>
              <span
                className="select-none text-5xl leading-none drop-shadow-md sm:text-6xl"
                title="United States"
              >
                🇺🇸
              </span>
              <span className="text-2xl font-light text-white/90 sm:text-3xl" aria-hidden>
                ⇄
              </span>
              <span
                className="select-none text-5xl leading-none drop-shadow-md sm:text-6xl"
                title="South Korea"
              >
                🇰🇷
              </span>
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

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 text-center sm:px-8">
            <h2 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
              {t('Sign in', '로그인')}
            </h2>

            <form className="mt-8 space-y-5 text-left" onSubmit={handleSubmit}>
              {errMsg ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errMsg}
                </div>
              ) : null}
              <div>
                <label className="text-sm font-medium text-neutral-700" htmlFor="login-email">
                  {t('Email', '이메일')}
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700" htmlFor="login-password">
                  {t('Password', '비밀번호')}
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:from-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                {t('Sign in', '로그인')}
              </button>
            </form>

            <p className="mt-6 text-sm text-neutral-600">
              {t('No account?', '계정이 없으신가요?')}{' '}
              <Link
                to="/register"
                className="font-semibold text-violet-600 hover:text-violet-700 hover:underline"
              >
                {t('Register', '회원가입')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
