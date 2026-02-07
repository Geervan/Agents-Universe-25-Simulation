import React, { useEffect, useRef, useState } from 'react';

interface SessionData {
    totalBirths: number;
    totalDeaths: number;
    totalAttacks: number;
    totalTrades: number;
    peakPopulation: number;
    peakPopulationTick: number;
    peakGDP: number;
    highestGeneration: number;
    extinctionTick: number;
    totalTicks: number;
    totalLifespanTicks?: number;
    populationTimeline?: { tick: number; pop: number; avgStability: number }[];
}

interface SessionSummaryProps {
    data: SessionData;
    onRestart: () => void;
}

const MiniGraph: React.FC<{ timeline: { tick: number; pop: number; avgStability: number }[] }> = ({ timeline }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || timeline.length < 2) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cw = canvas.width;
        const ch = canvas.height;
        const marginL = 32; // left margin for Y labels
        const marginB = 16; // bottom margin for X labels
        const w = cw - marginL;
        const h = ch - marginB;

        ctx.fillStyle = '#0a0808';
        ctx.fillRect(0, 0, cw, ch);

        const maxPop = Math.max(...timeline.map(t => t.pop), 10);
        const maxTick = timeline[timeline.length - 1]?.tick || 1;
        const step = w / Math.max(timeline.length - 1, 1);

        // Y-axis grid lines + labels (population scale)
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= 4; i++) {
            const yPos = h - (i / 4) * h * 0.9;
            const popVal = Math.round((i / 4) * maxPop);

            ctx.strokeStyle = '#1a1111';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(marginL, yPos);
            ctx.lineTo(cw, yPos);
            ctx.stroke();

            // Pop label (left, cyan)
            ctx.fillStyle = '#00ccaa66';
            ctx.fillText(`${popVal}`, marginL - 4, yPos);
        }

        // Stability % labels (right side)
        ctx.textAlign = 'left';
        for (let i = 0; i <= 2; i++) {
            const pct = i * 50;
            const yPos = h - (pct / 100) * h * 0.9;
            ctx.fillStyle = '#ffcc0044';
            ctx.fillText(`${pct}%`, cw - 24, yPos);
        }

        // X-axis tick labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#444';
        const xLabels = 5;
        for (let i = 0; i <= xLabels; i++) {
            const tickVal = Math.round((i / xLabels) * maxTick);
            const xPos = marginL + (i / xLabels) * w;
            ctx.fillText(`${tickVal}`, xPos, h + 3);
        }

        // Population area fill
        ctx.beginPath();
        ctx.moveTo(marginL, h);
        timeline.forEach((p, i) => {
            const x = marginL + i * step;
            const y = h - (p.pop / maxPop) * h * 0.9;
            ctx.lineTo(x, y);
        });
        ctx.lineTo(marginL + (timeline.length - 1) * step, h);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,204,170,0.06)';
        ctx.fill();

        // Population line
        ctx.strokeStyle = '#00ccaa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        timeline.forEach((p, i) => {
            const x = marginL + i * step;
            const y = h - (p.pop / maxPop) * h * 0.9;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Stability line
        ctx.strokeStyle = '#ffcc0088';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        timeline.forEach((p, i) => {
            const x = marginL + i * step;
            const y = h - (p.avgStability / 100) * h * 0.9;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
    }, [timeline]);

    return <canvas ref={canvasRef} width={520} height={110} style={{ display: 'block', width: '100%', height: '110px' }} />;
};

const SessionSummary: React.FC<SessionSummaryProps> = ({ data, onRestart }) => {
    const [visible, setVisible] = useState(false);
    const [statsRevealed, setStatsRevealed] = useState(false);
    const [buttonRevealed, setButtonRevealed] = useState(false);

    useEffect(() => {
        setTimeout(() => setVisible(true), 100);
        setTimeout(() => setStatsRevealed(true), 600);
        setTimeout(() => setButtonRevealed(true), 1200);
    }, []);

    // Smart cause-of-death: compare attacks vs trades, curve shape, population scale
    const cooperationRatio = data.totalTrades / Math.max(data.totalAttacks, 1);
    const declinePhase = data.extinctionTick - data.peakPopulationTick;
    const growthPhase = data.peakPopulationTick;

    const causeOfDeath = data.totalAttacks > data.totalTrades
        ? { icon: '⚔️', title: 'VIOLENCE', desc: 'Aggression overwhelmed cooperation. The colony tore itself apart.' }
        : data.peakPopulation > 40 && declinePhase > growthPhase * 1.5
            ? { icon: '🏚️', title: 'BEHAVIORAL SINK', desc: 'Overcrowding triggered a long, irreversible decline.' }
            : data.peakPopulation < 8
                ? { icon: '🔬', title: 'FAILURE TO THRIVE', desc: 'The colony never reached critical mass.' }
                : cooperationRatio < 2
                    ? { icon: '📉', title: 'ECONOMIC COLLAPSE', desc: 'Trade networks couldn\'t sustain the population.' }
                    : { icon: '💀', title: 'RESOURCE EXHAUSTION', desc: 'Energy demands outpaced supply.' };

    // Verdict based on population curve shape
    const verdict = declinePhase > growthPhase * 3
        ? 'LONG DECAY'
        : declinePhase < growthPhase * 0.5
            ? 'SUDDEN COLLAPSE'
            : declinePhase > growthPhase * 1.2
                ? 'SLOW DECLINE'
                : 'RISE AND FALL';

    const avgLifespan = Math.round((data.totalLifespanTicks || 0) / Math.max(data.totalDeaths, 1));

    const bdRatio = data.totalBirths / Math.max(data.totalDeaths, 1);

    const stats: { label: string; value: string | number; color: string }[] = [
        { label: 'PEAK POP', value: data.peakPopulation, color: '#00ff41' },
        { label: 'APEX TICK', value: data.peakPopulationTick, color: '#00ff41' },
        { label: 'BIRTHS', value: data.totalBirths, color: '#66d9ff' },
        { label: 'DEATHS', value: data.totalDeaths, color: '#ff4444' },
        { label: 'PEAK GDP', value: Math.round(data.peakGDP), color: '#ffcc00' },
        { label: 'ATTACKS', value: data.totalAttacks, color: '#ff6b35' },
        { label: 'TRADES', value: data.totalTrades, color: '#ffcc00' },
        { label: 'AVG LIFE', value: `${avgLifespan}t`, color: '#cc66ff' },
        { label: 'LINEAGE', value: `GEN ${data.highestGeneration}`, color: '#cc66ff' },
        { label: 'B/D RATIO', value: bdRatio.toFixed(2), color: bdRatio >= 1 ? '#66d9ff' : '#ff4444' },
    ];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: visible ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, fontFamily: '"Share Tech Mono", monospace',
            transition: 'background 0.8s ease',
        }}>
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)',
                pointerEvents: 'none', zIndex: 10000
            }} />

            <div style={{
                width: '530px', maxHeight: '100vh', overflowY: 'auto',
                background: 'linear-gradient(180deg, #0d0a0a 0%, #0a0808 50%, #0d0a0a 100%)',
                border: '1px solid #2a1515',
                opacity: visible ? 1 : 0,
                transform: visible ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden',
                boxShadow: '0 0 80px rgba(255,30,0,0.08), inset 0 1px 0 rgba(255,255,255,0.03)'
            }}>
                {/* Top stripe */}
                <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #ff3300, #ff6600, #ff3300, transparent)', opacity: 0.8 }} />

                {/* Header */}
                <div style={{ padding: '22px 28px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#997766', letterSpacing: '5px' }}>◈ SESSION TERMINATED ◈</div>
                    <div style={{
                        fontSize: '1.8rem', color: '#ff3300', letterSpacing: '3px',
                        textShadow: '0 0 30px rgba(255,51,0,0.4)', fontWeight: 'bold', marginTop: '6px'
                    }}>EXTINCTION</div>
                    <div style={{ fontSize: '0.65rem', color: '#888', marginTop: '4px', letterSpacing: '2px' }}>{verdict}</div>
                </div>

                {/* Cause */}
                <div style={{
                    margin: '0 28px', padding: '12px 16px',
                    background: 'linear-gradient(135deg, rgba(255,51,0,0.06) 0%, rgba(0,0,0,0) 100%)',
                    borderLeft: '2px solid #ff330066', marginBottom: '16px'
                }}>
                    <div style={{ fontSize: '1rem', color: '#ff9966' }}>{causeOfDeath.icon} {causeOfDeath.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '3px' }}>{causeOfDeath.desc}</div>
                </div>

                {/* Stats grid */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                    gap: '0', margin: '0 28px 16px', border: '1px solid #1a1111',
                    opacity: statsRevealed ? 1 : 0,
                    transform: statsRevealed ? 'translateY(0)' : 'translateY(6px)',
                    transition: 'all 0.5s ease'
                }}>
                    {stats.map((s, i) => (
                        <div key={s.label} style={{
                            padding: '10px 12px',
                            borderBottom: i < 5 ? '1px solid #1a1111' : 'none',
                            borderRight: (i + 1) % 5 !== 0 ? '1px solid #1a1111' : 'none',
                        }}>
                            <div style={{ fontSize: '0.5rem', color: '#888', letterSpacing: '1px', marginBottom: '3px' }}>{s.label}</div>
                            <div style={{ fontSize: '1.15rem', color: s.color, fontWeight: 'bold' }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Graph */}
                {data.populationTimeline && data.populationTimeline.length > 2 && (
                    <div style={{
                        margin: '0 28px 12px',
                        opacity: statsRevealed ? 1 : 0,
                        transition: 'opacity 0.5s ease 0.2s'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '0.55rem', color: '#888', letterSpacing: '1.5px' }}>POPULATION &amp; STABILITY</span>
                            <span style={{ fontSize: '0.55rem' }}>
                                <span style={{ color: '#00ccaa' }}>━ POP</span>
                                {'  '}
                                <span style={{ color: '#ffcc0088' }}>┅ STABILITY</span>
                            </span>
                        </div>
                        <div style={{ border: '1px solid #1a1111', overflow: 'hidden' }}>
                            <MiniGraph timeline={data.populationTimeline} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                            <span style={{ fontSize: '0.5rem', color: '#777' }}>GENESIS</span>
                            <span style={{ fontSize: '0.5rem', color: '#ff330099' }}>EXTINCTION</span>
                        </div>
                    </div>
                )}

                {/* Timeline bar + ratio */}
                <div style={{ margin: '0 28px 12px', display: 'flex', gap: '18px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.5rem', color: '#888', letterSpacing: '1px', marginBottom: '5px' }}>SURVIVED</div>
                        <div style={{
                            height: '20px', background: '#111', border: '1px solid #1a1111',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: `${(data.peakPopulationTick / Math.max(data.extinctionTick, 1)) * 100}%`,
                                top: 0, bottom: 0, width: '2px', background: '#00ff41', opacity: 0.5
                            }} />
                            <div style={{
                                width: '100%', height: '100%',
                                background: 'linear-gradient(90deg, #003311 0%, #00ff4122 30%, #ff330022 70%, #330000 100%)',
                            }} />
                        </div>
                        <div style={{ fontSize: '1rem', color: '#888', marginTop: '3px' }}>
                            {data.extinctionTick} <span style={{ fontSize: '0.55rem', color: '#888' }}>TICKS</span>
                        </div>
                    </div>
                    <div style={{ width: '130px' }}>
                        <div style={{ fontSize: '0.5rem', color: '#888', letterSpacing: '1px', marginBottom: '5px' }}>COOPERATION</div>
                        <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: '#111', marginBottom: '5px' }}>
                            <div style={{
                                width: `${(data.totalTrades / Math.max(data.totalTrades + data.totalAttacks, 1)) * 100}%`,
                                background: 'linear-gradient(90deg, #ffcc00, #ff9900)',
                            }} />
                            <div style={{ flex: 1, background: 'linear-gradient(90deg, #cc3333, #ff4444)' }} />
                        </div>
                        <div style={{
                            fontSize: '1.35rem', fontWeight: 'bold', textAlign: 'center',
                            color: cooperationRatio >= 1 ? '#ffcc00' : '#ff4444',
                        }}>{cooperationRatio.toFixed(1)}×</div>
                    </div>
                </div>

                {/* Reboot button */}
                <div style={{ padding: '10px 28px 20px' }}>
                    <button onClick={onRestart} style={{
                        width: '100%', padding: '12px', background: 'transparent',
                        border: '1px solid #331111', color: '#ff3300', cursor: 'pointer',
                        fontFamily: '"Share Tech Mono", monospace', fontSize: '0.8rem',
                        letterSpacing: '3px',
                        opacity: buttonRevealed ? 1 : 0,
                        transition: 'all 0.4s ease, background 0.2s ease, border-color 0.2s ease',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,51,0,0.08)'; e.currentTarget.style.borderColor = '#ff3300'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#331111'; }}
                    >
                        REBOOT SIMULATION
                    </button>
                </div>

                <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #ff330044, transparent)' }} />
            </div>
        </div>
    );
};

export default SessionSummary;
