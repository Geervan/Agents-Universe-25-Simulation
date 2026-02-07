import React from 'react';

const Legend: React.FC = () => {
    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid #333',
            padding: '14px 16px',
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: '0.7rem',
            color: '#888',
            maxWidth: '230px',
            zIndex: 100
        }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '0.75rem', letterSpacing: '1px' }}>
                SOCIAL HIERARCHY
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* ALPHA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: 10, height: 10,
                        background: '#fff',
                        transform: 'rotate(45deg)',
                        boxShadow: '0 0 6px #fff',
                        flexShrink: 0
                    }}></div>
                    <span style={{ color: '#fff' }}>ALPHA (Leader)</span>
                </div>
                {/* BETA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: 0, height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderBottom: '9px solid #ff9f43',
                        flexShrink: 0
                    }}></div>
                    <span>BETA (Middle class)</span>
                </div>
                {/* OMEGA - Normal Working */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 10, height: 10, background: '#00ccaa', flexShrink: 0 }}></div>
                    <span>OMEGA (Working)</span>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #333', margin: '12px 0', }}></div>

            <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '0.75rem', letterSpacing: '1px' }}>
                CONDITIONS
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffcc00', boxShadow: '0 0 6px #ffcc00', flexShrink: 0 }}></div>
                    <span>Wealthy (&gt;60 CR)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 10, height: 10, border: '2px solid #ff3300', borderRadius: '50%', background: 'transparent', boxSizing: 'border-box', flexShrink: 0 }}></div>
                    <span>Starving (&lt;20% energy)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 10, height: 10, color: '#ff3300', fontWeight: 'bold', textAlign: 'center', lineHeight: '10px', fontSize: '12px', flexShrink: 0 }}>✕</div>
                    <span>Aggressive (&lt;30% stable)</span>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #333', margin: '12px 0' }}></div>

            <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '0.75rem', letterSpacing: '1px' }}>
                TERRITORIES
            </h4>
            <div style={{ display: 'flex', height: '12px', gap: '3px', marginBottom: '6px' }}>
                <div style={{ flex: 1, background: '#ff6b6b30', border: '1px solid #ff6b6b50' }}></div>
                <div style={{ flex: 1, background: '#4ecdc430', border: '1px solid #4ecdc450' }}></div>
                <div style={{ flex: 1, background: '#ffe66d30', border: '1px solid #ffe66d50' }}></div>
                <div style={{ flex: 1, background: '#aa96da30', border: '1px solid #aa96da50' }}></div>
            </div>
            <div style={{ fontSize: '0.6rem', color: '#666' }}>
                Colored zones = ALPHA territories
            </div>
        </div>
    );
};

export default Legend;
