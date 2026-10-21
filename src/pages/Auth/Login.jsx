import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion';
import {
  ShieldCheck, Radar, GitBranch, BrainCircuit,
  Eye, EyeOff, AlertCircle
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const features = [
  {
    icon: Radar,
    title: '5-Node Sensor Network',
    description: 'Real-time water level monitoring across campus',
  },
  {
    icon: GitBranch,
    title: '4-Layer Connectivity',
    description: '4G → 2G SMS → LoRa → SD Card — zero data loss',
  },
  {
    icon: BrainCircuit,
    title: 'ML Flood Prediction',
    description: 'LSTM model forecasts flood risk 6–12 hours ahead',
  },
];

const FeatureItem = ({ icon: Icon, title, description, isLast }) => (
  <div
    className={`flex items-start gap-3 py-4 ${!isLast ? 'border-b border-white/[0.08]' : ''
      }`}
  >
    <div className="w-8 h-8 rounded-md bg-white/[0.08] flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-[#60A5FA]" />
    </div>
    <div>
      <p className="text-white/90 text-sm font-medium">{title}</p>
      <p className="text-white/40 text-xs mt-0.5">{description}</p>
    </div>
  </div>
);

const StatusPill = ({ color, label }) => (
  <div className="flex items-center gap-1.5 text-xs text-white/60">
    <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
    <span>{label}</span>
  </div>
);

const PillSeparator = () => <div className="w-px h-3 bg-white/[0.15]" />;

const Login = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const motion_config = useMotion();

  const onSubmit = async (data) => {
    setAuthError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Admin credentials
      if (data.email === 'admin@idms.svce.in' && data.password === 'idms2025') {
        setAuth(
          { name: 'Vinay Kumar', email: data.email },
          'admin-token-placeholder',
          'admin'
        );
        navigate('/dashboard');
        return;
      }

      // Coordinator credentials
      if (data.email === 'coord@idms.svce.in' && data.password === 'coord2025') {
        setAuth(
          { name: 'Geethika Reddy', email: data.email },
          'coord-token-placeholder',
          'coordinator'
        );
        navigate('/dashboard');
        return;
      }

      // Citizen / User credentials
      if (data.email === 'user@idms.in' && data.password === 'user2025') {
        setAuth(
          { name: 'Ravi Kumar', email: data.email },
          'user-token-placeholder',
          'citizen'
        );
        navigate('/user/dashboard');
        return;
      }

      setAuthError('Invalid credentials. Please check your email and password.');
    } catch (err) {
      setAuthError('Connection error. Please check your network and retry.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel — Brand & Context ── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-10 h-screen bg-[#0F172A]">
        {/* Top — Logo + Tagline */}
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={28} className="text-[#2563EB]" />
            <span className="text-white text-xl font-semibold tracking-tight">
              IDMS
            </span>
          </div>

          <h1 className="mt-12 text-white/90 text-[22px] font-semibold leading-tight tracking-tight">
            Integrated Disaster
            <br />
            Management System
          </h1>
          <p className="mt-3 text-white/50 text-sm leading-relaxed max-w-xs">
            Real-time flood monitoring, early warning, and coordinated rescue
            response — built for India's flood-prone regions.
          </p>
        </div>

        {/* Middle — Feature Highlights */}
        <motion.div
          variants={motion_config.staggerContainer}
          initial="initial"
          animate="animate"
          className="mt-10 space-y-0"
        >
          {features.map((f, i) => (
            <motion.div key={f.title} variants={motion_config.staggerItem}>
              <FeatureItem
                icon={f.icon}
                title={f.title}
                description={f.description}
                isLast={i === features.length - 1}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom — Status Strip */}
        <div>
          <div className="flex items-center gap-4 flex-wrap">
            <StatusPill color="bg-[#34D399]" label="System Online" />
            <PillSeparator />
            <StatusPill color="bg-[#34D399]" label="5 Nodes Active" />
            <PillSeparator />
            <StatusPill color="bg-[#60A5FA]" label="v1.0.0" />
          </div>
          <p className="mt-4 text-white/25 text-xs">
            IDMS Platform · Disaster Management
          </p>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div className="w-full lg:w-[58%] bg-[#FFFFFF] flex flex-col items-center justify-center min-h-screen px-6 py-12 lg:px-8">
        <motion.div
          {...motion_config.fadeSlideUp}
          className="w-full max-w-[360px]"
        >
          {/* Header */}
          <h2 className="text-[22px] font-semibold text-[#0F172A] tracking-tight">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Sign in to your IDMS account
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#374151] mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@svce.edu.in"
                autoComplete="email"
                className={`w-full h-10 px-3 text-sm text-[#0F172A] bg-white border rounded-md
                  placeholder:text-[#94A3B8] transition-all duration-150
                  focus:outline-none focus:ring-2
                  ${errors.email
                    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/12'
                    : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]/12'
                  }`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#DC2626]">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#374151] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full h-10 px-3 pr-10 text-sm text-[#0F172A] bg-white border rounded-md
                    placeholder:text-[#94A3B8] transition-all duration-150
                    focus:outline-none focus:ring-2
                    ${errors.password
                      ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/12'
                      : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]/12'
                    }`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[#DC2626]">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] accent-[#2563EB] cursor-pointer"
                />
                <span className="text-sm text-[#475569]">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Auth Error Banner */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  {...motion_config.fadeSlideDown}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-md
                             bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]"
                >
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span className="text-sm">{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-6 h-10 w-full rounded-md bg-[#2563EB] text-white text-sm font-semibold
                transition-all duration-150 cursor-pointer active:scale-[0.98] transition-transform duration-100
                focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:ring-offset-2
                ${isSubmitting
                  ? 'opacity-80 cursor-not-allowed'
                  : 'hover:bg-[#1D4ED8] active:bg-[#1E40AF]'
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#F1F5F9]" />
            <span className="text-xs text-[#94A3B8] font-medium">
              Development
            </span>
            <div className="flex-1 h-px bg-[#F1F5F9]" />
          </div>

          {/* Demo Credentials Panel */}
          <div className="mt-3 p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
            <p className="text-[11px] font-semibold text-[#475569] mb-2">Demo credentials</p>
            <div className="space-y-2">
              {/* Admin */}
              <div className="pb-2 border-b border-[#F1F5F9]">
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase mb-1">
                  Admin Portal
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#94A3B8]">Email</span>
                  <button type="button"
                    onClick={() => setValue('email', 'admin@idms.svce.in')}
                    className="text-[10px] font-mono text-[#2563EB] hover:underline">
                    admin@idms.svce.in
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#94A3B8]">Password</span>
                  <button type="button"
                    onClick={() => setValue('password', 'idms2025')}
                    className="text-[10px] font-mono text-[#2563EB] hover:underline">
                    idms2025
                  </button>
                </div>
              </div>
              {/* Citizen */}
              <div>
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase mb-1">
                  Citizen Portal
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#94A3B8]">Email</span>
                  <button type="button"
                    onClick={() => setValue('email', 'user@idms.in')}
                    className="text-[10px] font-mono text-[#2563EB] hover:underline">
                    user@idms.in
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#94A3B8]">Password</span>
                  <button type="button"
                    onClick={() => setValue('password', 'user2025')}
                    className="text-[10px] font-mono text-[#2563EB] hover:underline">
                    user2025
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-[#94A3B8] mt-2">
              Click to auto-fill · Admin → Admin Portal · Citizen → Citizen Portal
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-[#94A3B8]">
              Restricted access. Authorised personnel only.
            </p>
            <p className="text-xs text-[#CBD5E1] mt-1">
              IDMS v1.0 · Disaster Management Platform
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
