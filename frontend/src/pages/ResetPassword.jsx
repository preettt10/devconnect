// src/pages/ResetPassword.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; 
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Code2, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../api/axios.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Your password has been reset successfully! Please sign in.', { duration: 5000 });
      navigate('/login');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Token is invalid or expired. Request a new link.');
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-bold mb-2">Invalid Request</h2>
          <p className="text-[var(--color-text-muted)] mb-6">No password reset token was provided.</p>
          <Link to="/forgot-password" className="btn-primary inline-flex justify-center w-full">
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Code2 size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">DevConnect</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-6">Create New Password</h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Choose a new, secure password for your account
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(mutate)} className="space-y-5" id="reset-password-form">
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              id="reset-password"
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              id="reset-confirm-password"
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              isLoading={isPending}
              className="w-full justify-center"
              id="reset-submit"
            >
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
