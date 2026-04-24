'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, LogIn, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid operator ID format'),
  password: z.string().min(6, 'Security code must be at least 6 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async () => {
    setIsLoading(true);
    // Simulated auth delay
    await new Promise((r) => setTimeout(r, 1200));
    router.push('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email field */}
      <div>
        <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted mb-2">
          <Shield size={12} />
          Operator ID / Email
        </label>
        <input
          type="email"
          {...register('email')}
          placeholder="Enter designation..."
          className="input-tactical"
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-critical text-xs font-mono mt-1.5">{errors.email.message}</p>
        )}
      </div>

      {/* Password field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted">
            <Lock size={12} />
            Security Code
          </label>
          <button type="button" className="text-xs font-mono uppercase tracking-wider text-orange hover:text-orange/80 transition-colors">
            Reset Code
          </button>
        </div>
        <input
          type="password"
          {...register('password')}
          placeholder="••••••••"
          className="input-tactical"
          autoComplete="current-password"
        />
        {errors.password && (
          <p className="text-critical text-xs font-mono mt-1.5">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange hover:bg-orange/90 text-white text-base font-space-grotesk font-bold uppercase tracking-wider rounded transition-all hover:shadow-glow-orange disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            <LogIn size={16} />
            Authenticate
          </>
        )}
      </button>
    </form>
  );
}
