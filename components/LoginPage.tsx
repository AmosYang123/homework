
import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../services/supabase';
import Toast from './ui/Toast';

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'local' | 'cloud'>('local');
    const [cloudTab, setCloudTab] = useState<'signin' | 'register'>('signin');
    const [localName, setLocalName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successToast, setSuccessToast] = useState<string | null>(null);
    const [registrationComplete, setRegistrationComplete] = useState(false);

    const handleLocalLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!localName.trim()) return;

        const user: User = {
            id: crypto.randomUUID(),
            name: localName.trim(),
            isCloud: false
        };

        localStorage.setItem('homework_user', JSON.stringify(user));
        onLogin(user);
    };

    const handleCloudLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message?.toLowerCase().includes('invalid login credentials')) {
                    setError('Invalid email or password. Please check your details or register if you don\'t have an account.');
                } else {
                    setError(error.message || 'Authentication failed');
                }
                return;
            }

            if (data.user) {
                const user: User = {
                    id: data.user.id,
                    name: data.user.email?.split('@')[0] || 'User',
                    email: data.user.email,
                    isCloud: true
                };
                localStorage.setItem('homework_user', JSON.stringify(user));
                onLogin(user);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloudSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            // Show success state
            setRegistrationComplete(true);
            setSuccessToast('Account created! Check your email to verify.');
        } catch (err: any) {
            setError(err.message || 'Sign up failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-main p-6 animate-fade-in text-text-primary">
            <div className="max-w-md w-full">
                <div className="text-center mb-12">
                    <div className="text-4xl font-black tracking-tighter mb-2">Homework</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-text-secondary opacity-40">Intelligence Standard Auth</div>
                </div>

                <div className="bg-bg-surface border border-border-primary p-1 bg-accent-soft mb-8 flex">
                    <button
                        onClick={() => { setMode('local'); setError(null); }}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'local' ? 'bg-bg-main text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Local
                    </button>
                    <button
                        onClick={() => { setMode('cloud'); setError(null); }}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'cloud' ? 'bg-bg-main text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Cloud
                    </button>
                </div>

                <div className="bg-bg-main border border-border-primary p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -mr-16 -mt-16"></div>

                    {mode === 'local' ? (
                        <form onSubmit={handleLocalLogin}>
                            <h2 className="text-xl font-bold tracking-tight mb-2">Local Access</h2>
                            <p className="text-xs text-text-secondary mb-8 leading-relaxed">Your data stays strictly on this device. No account required.</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-secondary mb-2 block">Display Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={localName}
                                        onChange={(e) => setLocalName(e.target.value)}
                                        placeholder="Enter your name..."
                                        className="w-full bg-bg-surface border border-border-primary px-4 py-3 text-sm focus:border-accent outline-none transition-all font-medium"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-accent text-bg-main text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-90 transition-all active:scale-[0.98]"
                                >
                                    Enter Workspace
                                </button>
                            </div>
                        </form>
                    ) : registrationComplete ? (
                        // Success state after registration
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={32} className="text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight mb-2">Check Your Email</h2>
                            <p className="text-xs text-text-secondary mb-8 leading-relaxed">
                                We've sent a verification link to <span className="text-accent font-semibold">{email}</span>.
                                Click the link in your email, then come back here to sign in.
                            </p>
                            <button
                                onClick={() => { setRegistrationComplete(false); setCloudTab('signin'); }}
                                className="w-full py-4 bg-accent text-bg-main text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-90 transition-all active:scale-[0.98]"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-xl font-bold tracking-tight mb-2">Cloud Sync</h2>
                            <p className="text-xs text-text-secondary mb-6 leading-relaxed">Sync your chats and templates across all your devices.</p>

                            {/* Sign In / Register Tabs */}
                            <div className="flex mb-6 border-b border-border-primary">
                                <button
                                    type="button"
                                    onClick={() => { setCloudTab('signin'); setError(null); }}
                                    className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-all relative ${cloudTab === 'signin' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    Sign In
                                    {cloudTab === 'signin' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"></div>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setCloudTab('register'); setError(null); }}
                                    className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-all relative ${cloudTab === 'register' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    Register
                                    {cloudTab === 'register' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"></div>}
                                </button>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={cloudTab === 'signin' ? handleCloudLogin : handleCloudSignUp}>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-secondary mb-2 block">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@example.com"
                                            className="w-full bg-bg-surface border border-border-primary px-4 py-3 text-sm focus:border-accent outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-secondary mb-2 block">Password</label>
                                        <div className="relative group/pass">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={cloudTab === 'register' ? 'Min 6 characters' : ''}
                                                className="w-full bg-bg-surface border border-border-primary px-4 py-3 text-sm focus:border-accent outline-none transition-all font-medium pr-10"
                                                required
                                                minLength={cloudTab === 'register' ? 6 : undefined}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-accent transition-colors p-1"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        disabled={isLoading}
                                        type="submit"
                                        className="w-full py-4 bg-accent text-bg-main text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isLoading ? 'Processing...' : cloudTab === 'signin' ? 'Sign In' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                <p className="text-center mt-12 text-[9px] font-bold uppercase tracking-[0.4em] text-text-secondary opacity-30">
                    Homework Intelligence Logic Engine Standard v1.0.4
                </p>
            </div>

            {successToast && (
                <Toast
                    message={successToast}
                    type="success"
                    onClose={() => setSuccessToast(null)}
                />
            )}
        </div>
    );
};

export default LoginPage;
