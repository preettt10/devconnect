// src/pages/ForgotPassword.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Code2, Mail, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../api/axios.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

const ForgotPassword = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/auth/forgot-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('If the email matches a user, a reset link was generated!', { duration: 5000 });
      reset();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send reset request');
    },
  });

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
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-6">Reset Password</h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(mutate)} className="space-y-5" id="forgot-password-form">
            <Input
              label="Email"
              type="email"
              id="forgot-email"
              placeholder="you@example.com"
              autoComplete="email"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Button
              type="submit"
              isLoading={isPending}
              className="w-full justify-center"
              id="forgot-submit"
            >
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-indigo-400 transition-colors">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
