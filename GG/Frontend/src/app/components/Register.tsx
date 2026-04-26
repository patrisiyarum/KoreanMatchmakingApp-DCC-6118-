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
