import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { Pizza, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = useSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const from = location.state?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser(data));
    if (!result.error) navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      {}
      <div className="absolute inset-0 hero-pattern pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-400/6 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all duration-200">
              <Pizza size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-gradient">PizzaRush</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold text-white">Welcome back!</h1>
          <p className="mt-2 text-gray-400">Sign in to your account to order.</p>
        </div>

        {}
        <div className="card-elevated p-7 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {}
            <div>
              <label htmlFor="login-email" className="input-label">Email address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`input-field ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                placeholder="you@example.com"
              />
              <p className="input-error">{errors.email?.message || '\u00A0'}</p>
            </div>

            {}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="input-label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className={`input-field pr-11 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="input-error">{errors.password?.message || '\u00A0'}</p>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 text-base mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In 🍕'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
