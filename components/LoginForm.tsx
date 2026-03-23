import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface LoginFormProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (email: string, password: string, displayName: string) => Promise<void>;
    onResetPassword: (email: string) => Promise<void>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onRegister, onResetPassword }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        if (!isLogin && !displayName) {
            toast.error('Por favor ingresa tu nombre');
            return;
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                await onLogin(email, password);
            } else {
                await onRegister(email, password, displayName);
            }
        } catch (error: unknown) {
            const firebaseError = error as { code?: string };

            // Manejo de errores específicos de Firebase
            const errorCode = firebaseError.code;
            let errorMessage = 'Ocurrió un error. Intenta de nuevo.';

            switch (errorCode) {
                case 'auth/domain-not-allowed':
                    errorMessage = 'Solo se permiten emails corporativos (@3hrconsultores.com.mx)';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'Este email ya está registrado';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña debe tener al menos 6 caracteres';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Email o contraseña incorrectos';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'Credenciales inválidas';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Demasiados intentos. Intenta más tarde.';
                    break;
            }

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error('Por favor ingresa tu email');
            return;
        }

        setIsLoading(true);
        try {
            await onResetPassword(email);
            toast.success('Email de recuperación enviado. Revisa tu bandeja de entrada.');
            setShowResetPassword(false);
        } catch (error: unknown) {
            const firebaseError = error as { code?: string };

            const errorCode = firebaseError.code;
            let errorMessage = 'Error al enviar email de recuperación';

            if (errorCode === 'auth/user-not-found') {
                errorMessage = 'No existe una cuenta con este email';
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = 'Email inválido';
            }

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (showResetPassword) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black opacity-10"></div>

                <div className="relative w-full max-w-md">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Recuperar Contraseña
                            </h2>
                            <p className="text-gray-600 mt-2">
                                Ingresa tu email para recibir instrucciones
                            </p>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div>
                                <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                                    placeholder="tu@email.com"
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        Enviando...
                                    </span>
                                ) : (
                                    'Enviar Email'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowResetPassword(false)}
                                className="w-full text-gray-600 hover:text-gray-800 font-medium transition-colors"
                            >
                                Volver al inicio de sesión
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo/Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl mb-4 border border-white/20">
                        <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Cotizador Pro</h1>
                    <p className="text-white/80 text-lg">Sistema de gestión de cotizaciones</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {isLogin ? 'Bienvenido de nuevo' : 'Crear cuenta'}
                        </h2>
                        <p className="text-gray-600 mt-2">
                            {isLogin ? 'Ingresa tus credenciales para continuar' : 'Regístrate para comenzar'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nombre completo
                                </label>
                                <input
                                    id="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                                    placeholder="Juan Pérez"
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                                placeholder="tu@email.com"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>

                        {isLogin && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setShowResetPassword(true)}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                                </span>
                            ) : (
                                isLogin ? 'Iniciar sesión' : 'Crear cuenta'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                            {' '}
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setEmail('');
                                    setPassword('');
                                    setDisplayName('');
                                }}
                                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                                disabled={isLoading}
                            >
                                {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                            </button>
                        </p>
                    </div>
                </div>

                <p className="text-center text-white/60 text-sm mt-6">
                    © 2026 CRM Pro. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
