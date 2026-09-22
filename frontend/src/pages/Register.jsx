// src/pages/Register.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, User, Mail, Lock, AtSign, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  username: z
    .string()
    .min(3, 'Username must be 3-30 characters')
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (formData) => {
      const { username, email, password, name } = formData;
      const { data } = await api.post('/auth/register', { username, email, password, name });
      return data.data;
    },
    onSuccess: ({ user, accessToken }) => {
      login(user, accessToken);
      toast.success(`Welcome to DevConnect, ${user.name}! 🎉`);
      navigate('/');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Registration failed');
    },
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Code2 size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">DevConnect</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-6">Join DevConnect</h1>
          <p className="text-[var(--color-text-muted)] mt-1">Build your developer profile today</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(mutate)} className="space-y-4" id="register-form">
            <Input
              label="Full Name"
              type="text"
              id="register-name"
              placeholder="Jane Doe"
              autoComplete="name"
              leftIcon={<User size={16} />}
              error={errors.name?.message}
              required
              {...register('name')}
            />

            <Input
              label="Username"
              type="text"
              id="register-username"
              placeholder="janedoe"
              autoComplete="username"
              leftIcon={<AtSign size={16} />}
              hint="Lowercase letters, numbers, underscores only"
              error={errors.username?.message}
              required
              {...register('username')}
            />

            <Input
              label="Email"
              type="email"
              id="register-email"
              placeholder="you@example.com"
              autoComplete="email"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              required
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="register-password"
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              required
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              id="register-confirm-password"
              placeholder="Repeat password"
              autoComplete="new-password"
              leftIcon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              required
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              isLoading={isPending}
              className="w-full justify-center mt-2"
              id="register-submit"
            >
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
