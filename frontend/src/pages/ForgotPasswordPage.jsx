import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Pizza, ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
      toast.success('Reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="absolute inset-0 hero-pattern pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center shadow-brand">
              <Pizza size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-gradient">PizzaRush</span>
          </Link>
        </div>

        <div className="card-elevated p-7">
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
              <div className="w-16 h-16 bg-brand-500/15 rounded-full flex items-center justify-center mx-auto">
                <Mail size={28} className="text-brand-400" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white">Check your email</h2>
              <p className="text-gray-400 text-sm">
                We&apos;ve sent a password reset link to <strong className="text-white">{getValues('email')}</strong>.
                Check your inbox and follow the instructions.
              </p>
              <p className="text-gray-500 text-xs">Didn&apos;t receive it? Check your spam folder.</p>
              <Link to="/login" className="btn-secondary mt-4 inline-flex">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-white mb-2">Forgot password?</h1>
                <p className="text-gray-400 text-sm">No worries! Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="input-label">Email address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    {...register('email')}
                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="input-error">{errors.email.message}</p>}
                </div>

                <button id="forgot-submit-btn" type="submit" disabled={isLoading} className="btn-primary w-full py-3.5">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <Link to="/login" className="flex items-center justify-center gap-1.5 mt-5 text-sm text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={15} /> Back to Login
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
