import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LoginViewProps {
  logoUrl?: string;
  companyName?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ logoUrl, companyName }) => {
  const { loginWithCredentials, loginWithGoogle, quickLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor ingresa usuario y contraseña.');
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
          'CONFIG_REQUIRED: El método Correo/Contraseña no está activado en tu consola de Firebase. Puedes ingresar con Cuenta Google o usar los Accesos Rápidos.'
        );
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Usuario o contraseña incorrectos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intenta más tarde.');
      } else {
        setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
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
      setError('Error al ingresar con Google. Puedes usar los accesos rápidos o usuario y contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-zinc-900 grid grid-cols-1 lg:grid-cols-12 selection:bg-[#ea580c] selection:text-white relative">
      {/* =========================================
          LEFT HERO PANEL (Dark / Branding)
          ========================================= */}
      <div className="lg:col-span-6 xl:col-span-7 bg-[#09090b] text-white p-8 sm:p-12 lg:p-16 xl:p-20 flex flex-col justify-between relative overflow-hidden">
        {/* Ambient subtle glow overlay */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(234, 88, 12, 0.45) 0%, rgba(220, 38, 38, 0.15) 50%, transparent 80%)',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.3) 0%, transparent 70%)',
          }}
        />

        {/* Top Tagline */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white text-black font-black text-xs flex items-center justify-center tracking-tight shadow-md select-none shrink-0">
            L2
          </div>
          <span className="text-[11px] font-semibold tracking-[0.22em] text-zinc-400 uppercase select-none">
            LUBRICENTRO 2.0 &bull; SISTEMA OFICIAL
          </span>
        </div>

        {/* Center Headline */}
        <div className="relative z-10 my-12 lg:my-0 max-w-xl">
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4.2rem] font-black tracking-tight text-white leading-[1.06] select-none">
            Gestión
            <br />
            <span className="text-[#ea580c]">inteligente</span>
            <br />
            para tu taller
          </h1>
          <p className="mt-5 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-md font-normal">
            Control total de órdenes, stock, ventas y clientes.
            <br className="hidden sm:inline" />
            Diseñado para la velocidad de Escobar y Maschwitz.
          </p>
        </div>

        {/* Bottom Key Metrics Strip */}
        <div className="relative z-10 border-t border-zinc-800/80 pt-6 grid grid-cols-3 gap-6 max-w-lg">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              1.2k+
            </div>
            <div className="text-[10px] font-bold tracking-[0.16em] text-zinc-400 uppercase mt-1">
              ÓRDENES/MES
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              99.9%
            </div>
            <div className="text-[10px] font-bold tracking-[0.16em] text-zinc-400 uppercase mt-1">
              UPTIME
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              &lt;1s
            </div>
            <div className="text-[10px] font-bold tracking-[0.16em] text-zinc-400 uppercase mt-1">
              RESPUESTA
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          RIGHT AUTH PANEL (Light / Clean Form)
          ========================================= */}
      <div className="lg:col-span-6 xl:col-span-5 bg-[#f8fafc] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img
              src="/lubricentro-original-logo.png"
              alt={companyName || 'Lubricentro 2.0'}
              className="h-20 sm:h-24 w-auto max-w-[290px] object-contain select-none drop-shadow-sm transition-transform hover:scale-102"
            />
          </div>

          {/* Titles */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              Ingresá a tu cuenta
            </h2>
            <p className="text-xs text-zinc-500 font-normal mt-1">
              Acceso seguro al sistema integral
            </p>
          </div>

          {/* Main Login Form Card */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-zinc-200/80 p-6 sm:p-7">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Usuario */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 tracking-[0.15em] uppercase mb-1.5">
                  USUARIO
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: admin, federico..."
                  disabled={isLoading}
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-hidden focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition-all"
                />
              </div>

              {/* Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-zinc-600 tracking-[0.15em] uppercase">
                    CONTRASEÑA
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-[10px] font-bold text-zinc-400 hover:text-zinc-700 tracking-[0.14em] uppercase transition-colors cursor-pointer select-none"
                  >
                    {showPassword ? 'OCULTAR' : 'MOSTRAR'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 2 caracteres"
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-hidden focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition-all"
                  />
                  <div className="absolute right-3 w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center select-none pointer-events-none">
                    {password.length}
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-[#18181b] hover:bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 select-none"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <span className="text-base font-normal leading-none">&rarr;</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <span className="relative bg-white px-3 text-[10px] font-semibold text-zinc-400 tracking-[0.18em] uppercase select-none">
                O CONTINUÁ CON
              </span>
            </div>

            {/* Google sign-in */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogle}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50 select-none"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Continuar con Google</span>
            </button>
          </div>

          {/* Quick Access Grid */}
          <div className="mt-6 w-full">
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase text-center mb-3 select-none">
              ACCESO RÁPIDO POR SUCURSAL
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Lubricentro */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuick('lubricentro')}
                className="p-3 rounded-xl bg-[#18181b] hover:bg-black text-left border border-zinc-800 transition-all cursor-pointer group shadow-2xs disabled:opacity-50"
              >
                <div className="text-xs font-bold text-white group-hover:text-zinc-100">
                  Lubricentro
                </div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                  Central &bull; click para ent...
                </div>
              </button>

              {/* Escobar */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuick('escobar')}
                className="p-3 rounded-xl bg-white hover:bg-zinc-50 hover:border-zinc-300 text-left border border-zinc-200 transition-all cursor-pointer group shadow-2xs disabled:opacity-50"
              >
                <div className="text-xs font-bold text-zinc-900">
                  Escobar
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                  Sucursal 1 &bull; click para ...
                </div>
              </button>

              {/* Maschwitz */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuick('maschwitz')}
                className="p-3 rounded-xl bg-white hover:bg-zinc-50 hover:border-zinc-300 text-left border border-zinc-200 transition-all cursor-pointer group shadow-2xs disabled:opacity-50"
              >
                <div className="text-xs font-bold text-zinc-900">
                  Maschwitz
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                  Sucursal 2 &bull; click para ...
                </div>
              </button>

              {/* Fede */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuick('fede')}
                className="p-3 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-left text-white transition-all cursor-pointer group shadow-2xs disabled:opacity-50"
              >
                <div className="text-xs font-bold text-white">
                  Fede
                </div>
                <div className="text-[10px] text-orange-100 truncate mt-0.5">
                  Admin &bull; click para entrar
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Small desktop view toggle in the bottom right corner */}
        <div className="w-full max-w-[420px] lg:max-w-none flex justify-end mt-6 lg:mt-0 lg:absolute lg:bottom-4 lg:right-6">
          <button
            type="button"
            onClick={() => handleQuick('lubricentro')}
            className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 bg-white hover:bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer select-none"
          >
            Mostrar escritorio...
          </button>
        </div>
      </div>
    </div>
  );
};
