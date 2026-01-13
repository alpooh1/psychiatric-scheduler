import React, { useState } from 'react';

const TARGET_HASH = 'a915292d853812acd4d1aee7bf66139bc55a07b7bcf47aea73a2e56209e504d9';

export default function LoginOverlay({ onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Hash the password
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (hashHex === TARGET_HASH) {
            onLogin();
        } else {
            setError(true);
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">PT Time</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            placeholder="비밀번호 입력"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-xs font-bold animate-pulse">
                            비밀번호가 일치하지 않습니다.
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/30"
                    >
                        접속하기
                    </button>

                    <div className="text-[10px] text-slate-400 mt-4">
                        Authorized Personnel Only
                    </div>
                </form>
            </div>
        </div>
    );
}
