import React from 'react';
import { Process } from '../engine/Process';

interface AgentInspectorProps {
    process: Process | null;
    onClose: () => void;
}

const AgentInspector: React.FC<AgentInspectorProps> = ({ process, onClose }) => {
    if (!process) {
        return (
            <div style={{
                width: '300px',
                padding: '2rem',
                border: '1px solid #333',
                background: 'rgba(10, 10, 10, 0.9)',
                color: '#444',
                fontFamily: '"Share Tech Mono"',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                position: 'relative'
            }}>
                NO SIGNAL DETECTED
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: '1.2rem'
                    }}
                >×</button>
            </div>
        );
    }

    const { stats } = process;

    return (
        <div style={{
            width: '300px',
            padding: '1.5rem',
            border: '2px solid #00ccaa',
            background: 'rgba(5, 10, 10, 0.95)',
            color: '#fff',
            fontFamily: '"Share Tech Mono"',
            boxShadow: '0 0 20px rgba(0, 204, 170, 0.2)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '5px',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#00ccaa',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    zIndex: 20
                }}
            >×</button>
            {/* Header */}
            <div style={{
                borderBottom: '1px solid #333',
                paddingBottom: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ color: '#00ccaa', fontSize: '1.2rem' }}>ID: {stats.id.split('_').pop()}</span>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>GEN: v{stats.generation}.0</span>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#888' }}>ENERGY (CPU)</div>
                    <div style={{ fontSize: '1.5rem', color: stats.cpu < 20 ? '#ff3300' : '#fff' }}>
                        {Math.floor(stats.cpu)}%
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#888' }}>WEALTH (CR)</div>
                    <div style={{ fontSize: '1.5rem', color: '#ffcc00' }}>
                        {Math.floor(stats.money)}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#888' }}>STABILITY</div>
                    <div style={{
                        fontSize: '1.5rem',
                        color: stats.stability < 30 ? '#ff3300' : '#00ccaa'
                    }}>
                        {Math.floor(stats.stability)}%
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#888' }}>SOCIAL RANK</div>
                    <div style={{
                        fontSize: '1.2rem',
                        color: process.socialRank === 'ALPHA' ? '#ffffff'
                            : process.socialRank === 'BETA' ? '#ff9f43'
                                : '#00ccaa',
                        textShadow: process.socialRank === 'ALPHA' ? '0 0 8px #fff' : 'none'
                    }}>
                        {process.socialRank}
                    </div>
                </div>
            </div>

            {/* Agent "State" / Mood */}
            <div style={{
                padding: '0.5rem',
                background: '#111',
                borderLeft: '4px solid #fff',
                fontSize: '0.9rem',
                color: '#aaa'
            }}>
                LOGIC_STATE: <span style={{ color: '#fff' }}>{process.state}</span>
            </div>

            {/* Scan Line Effect */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.02) 50%)',
                backgroundSize: '100% 4px',
                pointerEvents: 'none'
            }} />
        </div>
    );
};

export default AgentInspector;
