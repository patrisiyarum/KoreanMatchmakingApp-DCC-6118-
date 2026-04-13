import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, UserPlus, User } from 'lucide-react';
import axios from 'axios';
import { registerApi } from '@/api/authApi';
import { getApiBase } from '@/api/apiBase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function Register() {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errMsg, setErrMsg] = useState('');
  const navigate = useNavigate();
  const { setUserId } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    if (formData.password !== formData.confirmPassword) {
      setErrMsg(t('Passwords do not match', '비밀번호가 일치하지 않습니다'));
      return;
    }
    if (!formData.agreeToTerms) {
      setErrMsg(t('Please agree to the terms and conditions', '이용약관에 동의해주세요'));
      return;
    }
    const fullName = formData.name.trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ');
    try {
      const data = await registerApi(
        firstName.trim(),
        lastName.trim(),
        formData.email.trim(),
        formData.password
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

  return (
    <div className="size-full flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md my-6"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {t('Create Account', '계정 만들기')}
          </h1>
          <p className="text-neutral-600">
            {t('Start your language learning adventure', '언어 학습 모험을 시작하세요')}
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
                {t('Full Name', '이름')}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('Enter your name', '이름을 입력하세요')}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

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
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  placeholder={t('Create a password', '비밀번호 생성')}
                  className="w-full pl-12 pr-12 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {t('Must be at least 8 characters', '최소 8자 이상이어야 합니다')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('Confirm Password', '비밀번호 확인')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder={t('Confirm your password', '비밀번호 확인')}
                  className="w-full pl-12 pr-12 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData((prev) => ({ ...prev, agreeToTerms: e.target.checked }))}
                className="mt-1 rounded border-neutral-300"
              />
              <label htmlFor="terms" className="text-sm text-neutral-600">
                {t('I agree to the', '다음에 동의합니다')}{' '}
                <a href="#" className="text-purple-600 hover:underline">
                  {t('Terms of Service', '이용약관')}
                </a>{' '}
                {t('and', '및')}{' '}
                <a href="#" className="text-purple-600 hover:underline">
                  {t('Privacy Policy', '개인정보처리방침')}
                </a>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {t('Create Account', '계정 만들기')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">
                  {t('or sign up with', '또는 다음으로 가입')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium text-neutral-700">Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                <span className="text-sm font-medium text-neutral-700">GitHub</span>
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-neutral-600 mt-6">
            {t('Already have an account?', '이미 계정이 있으신가요?')}{' '}
            <Link to="/login" className="text-purple-600 font-medium hover:underline">
              {t('Sign in', '로그인')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
