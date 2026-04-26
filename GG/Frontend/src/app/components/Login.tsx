import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { loginApi } from '@/api/authApi';
import { fetchUserProfilePayload } from '@/api/profileApi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function hasExistingProfile(profile: Awaited<ReturnType<typeof fetchUserProfilePayload>>) {
  return Boolean(profile?.id);
}

export function Login() {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errMsg, setErrMsg] = useState('');
  const navigate = useNavigate();
  const { setUserId } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    try {
      const data = await loginApi(formData.email.trim(), formData.password);
      if (data.errorCode !== 0 || data.id == null) {
        setErrMsg(data.message || 'Login failed.');
        return;
      }
      const nextUserId = String(data.id);
      setUserId(nextUserId);
      const profile = await fetchUserProfilePayload(nextUserId);
      if (hasExistingProfile(profile)) {
        navigate('/home', { replace: true });
      } else {
        navigate('/create-profile', { replace: true });
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setErrMsg(
        ax.response?.data?.message ||
          ax.message ||
          'Server error. Is the backend running on port 8080?'
      );
    }
  };

  return (
    <div className="size-full flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🇰🇷 🇺🇸</div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {t('Welcome Back', '다시 오신 것을 환영합니다')}
          </h1>
          <p className="text-neutral-600">
            {t('Sign in to continue your language journey', '언어 학습을 계속하려면 로그인하세요')}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errMsg ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errMsg}
              </div>
            ) : null}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('Email', '이메일')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder={t('Enter your email', '이메일을 입력하세요')}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('Password', '비밀번호')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder={t('Enter your password', '비밀번호를 입력하세요')}
                  className="w-full pl-12 pr-12 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-neutral-300" />
                <span className="text-neutral-600">
                  {t('Remember me', '로그인 상태 유지')}
                </span>
              </label>
              <a href="#" className="text-blue-600 hover:underline">
                {t('Forgot password?', '비밀번호를 잊으셨나요?')}
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {t('Sign In', '로그인')}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-600 mt-6">
            {t("Don't have an account?", '계정이 없으신가요?')}{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              {t('Sign up', '가입하기')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
