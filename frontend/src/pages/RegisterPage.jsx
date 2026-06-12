import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../store/slices/authSlice';
import { Pizza, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and a number'),
  confirmPassword: z.string().min(8, 'Confirm your password'),
  phone: z.string().min(10, 'Enter a valid phone number').optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const payload = { 
      name: data.name, 
      email: data.email, 
      password: data.password,
      confirmPassword: data.confirmPassword
    };
    if (data.phone) payload.phone = data.phone;
    const result = await dispatch(registerUser(payload));
    if (!result.error) {
      toast.success('Account created! Please verify your email then log in.');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="absolute inset-0 hero-pattern pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all duration-200">
              <Pizza size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-gradient">PizzaRush</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold text-white">Create an account</h1>
          <p className="mt-2 text-gray-400">Join PizzaRush and start ordering!</p>
        </div>

        <div className="card-elevated p-7 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="input-label">Full Name</label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                {...register('name')}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Full Name"
              />
              <p className="input-error">{errors.name?.message || '\u00A0'}</p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="input-label">Email address</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                placeholder="you@example.com"
              />
              <p className="input-error">{errors.email?.message || '\u00A0'}</p>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="reg-phone" className="input-label">
                Phone <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                {...register('phone')}
                className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="+91 98765 43210"
              />
              <p className="input-error">{errors.phone?.message || '\u00A0'}</p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="input-label">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  className={`input-field pr-11 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="input-error">{errors.password?.message || '\u00A0'}</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm-password" className="input-label">Confirm Password</label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className={`input-field pr-11 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Repeat your password"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="input-error">{errors.confirmPassword?.message || '\u00A0'}</p>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 text-base mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account 🍕'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
