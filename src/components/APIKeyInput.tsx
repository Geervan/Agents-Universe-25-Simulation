import React, { useState } from 'react';
import { initializeAI, isAIReady } from '../engine/AgentAI';

interface APIKeyInputProps {
    onReady: () => void;
}

const APIKeyInput: React.FC<APIKeyInputProps> = ({ onReady }) => {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(false);

    const handleSubmit = async () => {
        if (!apiKey.trim()) {
            setError('Please enter an API key');
            return;
        }

        setStatus('loading');
        setError('');

        try {
            initializeAI(apiKey.trim());

            if (isAIReady()) {
                setStatus('ready');
                localStorage.setItem('gemini_api_key', apiKey.trim());
                setExpanded(false);
                setTimeout(onReady, 500);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to initialize AI');
            setStatus('error');
        }
    };

    // Check .env first, then localStorage
    React.useEffect(() => {
        const envKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (envKey && envKey !== 'your_api_key_here') {
            initializeAI(envKey);
            setStatus('ready');
            return;
        }

        const stored = localStorage.getItem('gemini_api_key');
        if (stored) {
            setApiKey(stored);
            initializeAI(stored);
            setStatus('ready');
        }
    }, []);

    // Compact "ready" state
    if (status === 'ready') {
        return (
            <div style={{
                background: 'rgba(0, 50, 30, 0.8)',
                border: '1px solid #00cc66',
                padding: '6px 12px',
                borderRadius: '4px',
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: '0.7rem',
                color: '#00cc66',
                cursor: 'pointer'
            }} onClick={() => setExpanded(!expanded)}>
                🤖 AI ON
            </div>
        );
    }

    // Compact "idle" button that expands on click
    if (!expanded) {
        return (
            <div
                onClick={() => setExpanded(true)}
                style={{
                    background: 'rgba(50, 50, 50, 0.8)',
                    border: '1px solid #666',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontFamily: '"Share Tech Mono", monospace',
                    fontSize: '0.7rem',
                    color: '#888',
                    cursor: 'pointer'
                }}
            >
                🔌 Connect AI
            </div>
        );
    }

    // Expanded input form
    return (
        <div style={{
            background: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid #444',
            padding: '12px',
            borderRadius: '4px',
            fontFamily: '"Share Tech Mono", monospace',
            width: '280px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#fff', fontSize: '0.8rem' }}>🔑 GEMINI API KEY</span>
                <span
                    onClick={() => setExpanded(false)}
                    style={{ color: '#666', cursor: 'pointer' }}
                >✕</span>
            </div>

            <div style={{ color: '#666', marginBottom: '8px', fontSize: '0.65rem' }}>
                Free key: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#00ccaa' }}>aistudio.google.com</a>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste API key..."
                    style={{
                        flex: 1,
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        color: '#fff',
                        padding: '6px 10px',
                        fontFamily: 'inherit',
                        fontSize: '0.7rem',
                        borderRadius: '4px'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                    onClick={handleSubmit}
                    disabled={status === 'loading'}
                    style={{
                        background: '#00ccaa',
                        color: '#000',
                        border: 'none',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        fontSize: '0.7rem'
                    }}
                >
                    GO
                </button>
            </div>

            {error && (
                <div style={{ color: '#ff3300', marginTop: '6px', fontSize: '0.65rem' }}>
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
};

export default APIKeyInput;
