import React from 'react';

interface ThoughtItem {
    id: string;
    action: string | null;
    reasoning: string;
    at: number;
}

interface AIThoughtsPanelProps {
    thoughts: ThoughtItem[];
}

const AIThoughtsPanel: React.FC<AIThoughtsPanelProps> = ({ thoughts }) => {
    return (
        <div style={{
            width: '320px',
            height: '140px',
            border: '2px solid #004d66',
            background: '#060b10',
            color: '#66d9ff',
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: '0.8rem',
            padding: '10px',
            overflowY: 'auto',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
        }}>
            <div style={{
                fontSize: '0.7rem',
                color: '#3aaed6',
                marginBottom: '6px',
                letterSpacing: '0.5px'
            }}>
                AI REASONING STREAM
            </div>
            {thoughts.length === 0 ? (
                <div style={{ color: '#335a66' }}>NO AI SIGNAL</div>
            ) : (
                thoughts.map((t, i) => (
                    <div key={`${t.id}-${t.at}-${i}`} style={{
                        borderBottom: '1px solid #0b1a22',
                        padding: '4px 0'
                    }}>
                        <span style={{ color: '#99e6ff' }}>{t.id}</span>
                        {t.action ? (
                            <span style={{ color: '#66ffcc' }}> [{t.action}]</span>
                        ) : null}
                        <span style={{ color: '#66d9ff' }}> — {t.reasoning}</span>
                    </div>
                ))
            )}
        </div>
    );
};

export default AIThoughtsPanel;
