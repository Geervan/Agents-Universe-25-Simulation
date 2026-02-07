import React from 'react';

const Legend: React.FC = () => {
    return (
        <div style={{
            position: 'absolute',
            bottom: '140px',
            left: '20px',
            background: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid #333',
            padding: '12px',
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: '0.7rem',
            color: '#888',
            maxWidth: '200px'
        }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '0.75rem' }}>
                AGENT STATUS
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 10, height: 10, background: '#00ccaa' }}></div>
                    <span>Normal (working)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffcc00', boxShadow: '0 0 6px #ffcc00' }}></div>
                    <span>Wealthy (&gt;60 CR)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 10, height: 10, border: '2px solid #ff3300', borderRadius: '50%', background: 'transparent', boxSizing: 'border-box' }}></div>
                    <span>Starving (&lt;20%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 10, height: 10, color: '#ff3300', fontWeight: 'bold', textAlign: 'center', lineHeight: '10px', fontSize: '12px' }}>✕</div>
                    <span>Aggressive (&lt;30% stable)</span>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #333', marginTop: '10px', paddingTop: '8px' }}>
                <div style={{ color: '#666', marginBottom: '4px' }}>CELL COLOR = Stability</div>
                <div style={{ display: 'flex', height: '8px', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ flex: 1, background: 'hsl(0, 70%, 15%)' }}></div>
                    <div style={{ flex: 1, background: 'hsl(40, 70%, 15%)' }}></div>
                    <div style={{ flex: 1, background: 'hsl(80, 70%, 15%)' }}></div>
                    <div style={{ flex: 1, background: 'hsl(120, 70%, 15%)' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#555' }}>
                    <span>Stressed</span>
                    <span>Stable</span>
                </div>
            </div>
        </div>
    );
};

export default Legend;
