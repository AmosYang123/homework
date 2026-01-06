
import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'local' | 'cloud'>('local');
    const [localName, setLocalName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

            if (error) throw error;

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

    const handleCloudSignUp = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;
            alert('Sign up successful! Please check your email for confirmation or sign in.');
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
                        onClick={() => setMode('local')}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'local' ? 'bg-bg-main text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Local Workspace
                    </button>
                    <button
                        onClick={() => setMode('cloud')}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'cloud' ? 'bg-bg-main text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Cloud Synchronization
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
                    ) : (
                        <form onSubmit={handleCloudLogin}>
                            <h2 className="text-xl font-bold tracking-tight mb-2">Supabase Sync</h2>
                            <p className="text-xs text-text-secondary mb-8 leading-relaxed">Sync your chats and templates across all your devices.</p>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                                    {error}
                                </div>
                            )}

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
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-bg-surface border border-border-primary px-4 py-3 text-sm focus:border-accent outline-none transition-all font-medium"
                                        required
                                    />
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        disabled={isLoading}
                                        type="submit"
                                        className="flex-1 py-4 bg-accent text-bg-main text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isLoading ? 'Processing...' : 'Sign In'}
                                    </button>
                                    <button
                                        disabled={isLoading}
                                        type="button"
                                        onClick={handleCloudSignUp}
                                        className="flex-1 py-4 border border-accent text-accent text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-accent hover:text-bg-main transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        Register
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center mt-12 text-[9px] font-bold uppercase tracking-[0.4em] text-text-secondary opacity-30">
                    Homework Intelligence Logic Engine Standard v1.0.4
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
