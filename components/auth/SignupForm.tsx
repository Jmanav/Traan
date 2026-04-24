'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Building, Mail, Phone, Lock, ShieldCheck, ChevronDown, Loader2 } from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  ngoName: z.string().min(2, 'Organisation name required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  password: z.string().min(8, 'Minimum 8 characters required'),
  confirmPassword: z.string(),
  role: z.enum(['coordinator', 'field_supervisor', 'admin'], {
    errorMap: () => ({ message: 'Select a role' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Codes do not match',
  path: ['confirmPassword'],
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    router.push('/dashboard');
  };

  const fieldClass = "input-tactical";
  const labelClass = "flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted mb-2";
  const errorClass = "text-critical text-xs font-mono mt-1.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}><User size={12} />Full Name</label>
        <input {...register('fullName')} placeholder="Enter name..." className={fieldClass} />
        {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
      </div>

      <div>
        <label className={labelClass}><Building size={12} />NGO / Organisation</label>
        <input {...register('ngoName')} placeholder="Organisation name..." className={fieldClass} />
        {errors.ngoName && <p className={errorClass}>{errors.ngoName.message}</p>}
      </div>

      <div>
        <label className={labelClass}><Mail size={12} />Email</label>
        <input type="email" {...register('email')} placeholder="operator@ngo.org" className={fieldClass} />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      <div>
        <label className={labelClass}><Phone size={12} />Phone</label>
        <div className="flex gap-2">
          <span className="flex items-center px-3 bg-elevated border border-border rounded-md text-xs font-mono text-muted">+91</span>
          <input {...register('phone')} placeholder="9876543210" className={fieldClass} />
        </div>
        {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}><Lock size={12} />Code</label>
          <input type="password" {...register('password')} placeholder="••••••••" className={fieldClass} />
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        </div>
        <div>
          <label className={labelClass}><ShieldCheck size={12} />Confirm</label>
          <input type="password" {...register('confirmPassword')} placeholder="••••••••" className={fieldClass} />
          {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}><ChevronDown size={12} />Role</label>
        <select {...register('role')} className={fieldClass} defaultValue="">
          <option value="" disabled>Select clearance level...</option>
          <option value="coordinator">Coordinator</option>
          <option value="field_supervisor">Field Supervisor</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && <p className={errorClass}>{errors.role.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-orange hover:bg-orange/90 text-white text-base font-space-grotesk font-bold uppercase tracking-wider rounded transition-all hover:shadow-glow-orange disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}
