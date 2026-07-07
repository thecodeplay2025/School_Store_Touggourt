import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  ShieldAlert, 
  CheckCircle,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '../types';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export default function AuthView({ onAuthSuccess, onClose }: AuthViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password.trim();

    if (!cleanedEmail || !cleanedPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    // Default accounts check
    if (cleanedEmail === 'bougrinatmohammedkhaled@gmail.com' && cleanedPassword === 'khaled0672073876') {
      const adminUser: User = {
        id: 'admin-1',
        name: 'مدير المتجر الرئيسي',
        email: 'bougrinatmohammedkhaled@gmail.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      onAuthSuccess(adminUser);
      setSuccess('تم تسجيل دخول المسؤول بنجاح! جاري تحويلك لوحة التحكم...');
      return;
    }

    setError('البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق والمحاولة مجدداً.');
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-8 relative overflow-hidden" id="auth-panel-container">
      {/* Visual Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex bg-rose-50 border border-rose-100 p-3 rounded-2xl text-rose-600 mb-3">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">
          تسجيل دخول الإدارة والمسؤولين
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
          هذه البوابة مخصصة فقط لمدير ومسؤولي متجر School Store لإدارة المخزون وتتبع الطلبات وتحديث الأسعار بولاية توقرت.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-5 bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-shake animate-duration-200">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-500 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Admin Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">البريد الإلكتروني للمسؤول</label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-11 pl-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-right"
            />
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">كلمة المرور</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="•••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-11 pl-11 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-right"
            />
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
        >
          <span>تسجيل دخول المسؤول</span>
          <ArrowRight className="h-4 w-4 rotate-180" />
        </button>
      </form>

      {/* Close button */}
      <button 
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
        title="إغلاق"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
