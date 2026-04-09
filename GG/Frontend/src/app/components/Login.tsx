import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { loginApi } from '@/api/authApi';
import { useAuth } from '../context/AuthContext';

export function Login() {
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
      navigate('/home', { replace: true });
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
    <div className="min-h-full flex items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Login</h1>
        <p className="mt-1 text-sm text-neutral-600">Welcome back to LangMatch.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {errMsg ? (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errMsg}</div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-neutral-700">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600">
          No account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            Register
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/welcome" className="text-neutral-500 hover:underline">
            Continue without account (demo)
          </Link>
        </p>
      </div>
    </div>
  );
}
