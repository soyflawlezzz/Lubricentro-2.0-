import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Fuel, Lock, User, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  logoUrl?: string;
  companyName?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ logoUrl, companyName }) => {
  const { loginWithCredentials, loginWithGoogle, quickLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await loginWithCredentials(username, password);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(
          'CONFIG_REQUIRED: El método Correo/Contraseña aún no está activado en tu consola de Firebase. Debes habilitarlo en la consola para usar usuarios y contraseñas, o puedes ingresar ahora mismo con tu Cuenta Google.'
        );
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Usuario o contraseña incorrectos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intenta más tarde.');
      } else {
        setError(err.message || 'Error al iniciar sesión. Verifica la conexión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuick = async (preset: 'lubricentro' | 'escobar' | 'maschwitz' | 'fede') => {
    setIsLoading(true);
    setError(null);
    try {
      await quickLogin(preset);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con acceso rápido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError('Error al ingresar con Google. Puedes usar usuario y contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-red-600 selection:text-white relative overflow-hidden">
      {/* Decorative gradient backdrops */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-slate-800/20 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName || 'Lubricentro 2.0'}
                className="h-20 sm:h-24 w-auto max-w-[260px] object-contain drop-shadow-xl select-none"
              />
            ) : (
              <img
                src="/lubricentro-logo.svg"
                alt="Lubricentro 2.0"
                className="h-20 sm:h-24 w-auto max-w-[260px] object-contain drop-shadow-xl select-none"
              />
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Sistema de Gestión Integral &bull; Escobar e Ing. Maschwitz
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Usuario
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Lubricentro, Escobar, Maschwitz o Fede"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-950/50 hover:shadow-red-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-3 text-slate-500 font-semibold tracking-wider">
              Acceso Rápido con 1 Clic
            </span>
          </div>
        </div>

        {/* Quick user access grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuick('lubricentro')}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-center transition-all group cursor-pointer"
          >
            <div className="text-[11px] font-bold text-slate-200 group-hover:text-red-400">
              Lubricentro
            </div>
            <div className="text-[9px] text-red-400 font-semibold">Admin Total</div>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuick('escobar')}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-center transition-all group cursor-pointer"
          >
            <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-400">
              Escobar
            </div>
            <div className="text-[9px] text-slate-500">Sucursal</div>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuick('maschwitz')}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-center transition-all group cursor-pointer"
          >
            <div className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-400">
              Maschwitz
            </div>
            <div className="text-[9px] text-slate-500">Sucursal</div>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuick('fede')}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-center transition-all group cursor-pointer"
          >
            <div className="text-[11px] font-bold text-slate-200 group-hover:text-red-400">
              Fede
            </div>
            <div className="text-[9px] text-red-400 font-semibold">Admin Total</div>
          </button>
        </div>

        {/* Google sign-in */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogle}
          className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Ingresar con Cuenta Google</span>
        </button>
      </div>
    </div>
  );
};
