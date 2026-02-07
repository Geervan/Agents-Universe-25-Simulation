import React, { useState, useEffect, useRef } from 'react';

const Knob = ({ label, value, onChange, min, max }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = (e: React.MouseEvent) => {
        setIsDragging(true);
        const startY = e.clientY;
        const startVal = value;

        const onMove = (moveEvent: MouseEvent) => {
            const diff = startY - moveEvent.clientY;
            // Increased sensitivity (100px range instead of 200px)
            let newVal = startVal + diff * ((max - min) / 100);
            newVal = Math.max(min, Math.min(max, newVal));
            onChange(newVal);
        };

        const onUp = () => {
            setIsDragging(false);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleWheel = (e: React.WheelEvent) => {
        const step = (max - min) / 50;
        const change = e.deltaY < 0 ? step : -step;
        const newVal = Math.max(min, Math.min(max, value + change));
        onChange(newVal);
    };

    const rotation = ((value - min) / (max - min)) * 270 - 135; // -135 to +135 deg

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }} title="Drag Up/Down or Scroll">
            <div
                onMouseDown={handleDrag}
                onWheel={handleWheel}
                style={{
                    width: '60px', height: '60px', // Bigger Hit Area
                    borderRadius: '50%',
                    background: 'linear-gradient(145deg, #222, #111)',
                    border: isDragging ? '2px solid #00ccaa' : '2px solid #333', // Active State
                    boxShadow: isDragging ? '0 0 15px rgba(0, 204, 170, 0.2)' : '0 5px 10px rgba(0,0,0,0.5)',
                    position: 'relative',
                    cursor: 'ns-resize',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'border 0.2s, box-shadow 0.2s'
                }}
            >
                {/* Indicator Line */}
                <div style={{
                    position: 'absolute', top: '5px', left: '50%',
                    width: '4px', height: '15px',
                    background: isDragging ? '#fff' : '#00ccaa',
                    transform: 'translateX(-50%)',
                    borderRadius: '2px'
                }} />
            </div>
            <div style={{
                fontFamily: '"Share Tech Mono"',
                fontSize: '12px',
                color: isDragging ? '#fff' : '#666',
                fontWeight: 'bold',
                userSelect: 'none'
            }}>{label}</div>
        </div>
    );
};

const WaveMonitor = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wordIndexRef = useRef(0);
    const tickRef = useRef(0);

    // KNOB STATE
    const [freq, setFreq] = useState(0.008); // 0.001 to 0.05
    const [amp, setAmp] = useState(60);      // 10 to 120

    // Refs for animation loop to access latest state without re-binding
    const paramsRef = useRef({ freq, amp });
    useEffect(() => { paramsRef.current = { freq, amp }; }, [freq, amp]);

    const words = ["UNIVERSE-25", "ARCHITECT: GEERVAN", "STATUS: ONLINE", "AWAITING INJECTION"];

    useEffect(() => {
        const interval = setInterval(() => {
            wordIndexRef.current = (wordIndexRef.current + 1) % words.length;
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize
        canvas.width = canvas.parentElement?.clientWidth || 400;
        canvas.height = canvas.parentElement?.clientHeight || 400;

        const render = () => {
            tickRef.current++;
            const tick = tickRef.current;
            const { freq, amp } = paramsRef.current;

            // 1. CLEAN CLEAR
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const w = canvas.width;
            const h = canvas.height;
            const centerY = h / 2;

            // 2. GRID
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#222';
            ctx.beginPath();
            const gridSize = 40;
            for (let x = 0; x < w; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
            for (let y = 0; y < h; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
            ctx.stroke();

            // Axis
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
            ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
            ctx.stroke();

            // 3. TEXT READOUTS
            ctx.fillStyle = '#00ccaa';
            ctx.font = 'bold 20px "Share Tech Mono"';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText("CH-1: SINE", w - 20, 20);

            ctx.font = '14px "Share Tech Mono"';
            ctx.fillStyle = '#888';
            ctx.fillText(`FREQ: ${(freq * 100).toFixed(2)} Hz`, w - 20, 50);
            ctx.fillText(`AMP: ${amp.toFixed(1)} mV`, w - 20, 70);

            // Center Message
            ctx.fillStyle = 'rgba(0, 204, 170, 0.5)';
            ctx.font = 'bold 24px "Share Tech Mono"';
            ctx.textAlign = 'center';
            ctx.fillText(words[wordIndexRef.current], w / 2, h - 50);

            // 4. DRAW WAVE
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00ccaa';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00ccaa';

            ctx.beginPath();
            for (let x = 0; x < w; x++) {
                // Use params from ref

                // Add velocity to tick based on freq to keep speed relative
                const speed = tick * (freq * 2.5);

                let y = centerY + Math.sin(x * freq + speed) * amp;

                // Harmonics scale with Amp
                y += Math.sin(x * (freq * 2.5) - speed * 1.5) * (amp * 0.15);

                ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            requestAnimationFrame(render);
        };
        render();

    }, []);

    return (
        <div style={{
            width: '100%', height: '100%',
            position: 'relative',
            background: '#1a1a1a',
            border: '1px solid #444',
            overflow: 'hidden',
        }}>
            <canvas ref={canvasRef} />

            {/* KNOBS UI */}
            <div style={{
                position: 'absolute', bottom: '20px', left: '20px',
                display: 'flex', gap: '20px',
                padding: '10px',
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid #333',
                borderRadius: '8px',
                zIndex: 10
            }}>
                <Knob
                    label="FREQ" value={freq}
                    min={0.001} max={0.05}
                    onChange={setFreq}
                />
                <Knob
                    label="AMP" value={amp}
                    min={0} max={150}
                    onChange={setAmp}
                />
            </div>

            {/* Vignette Overlay */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(circle, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)',
                pointerEvents: 'none'
            }} />
        </div>
    );
};

const LandingPage: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const [textIndex, setTextIndex] = useState(0);
    const descriptions = [
        "SUBJECT: AUTONOMOUS AI AGENTS",
        "ENV: FINITE RESOURCE GRID",
        "HYPOTHESIS: BEHAVIORAL COLLAPSE",
        "STATUS: AWAITING INPUT"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex(prev => (prev + 1) % descriptions.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: 'minmax(400px, 1fr) 1fr',
            padding: '4rem',
            gap: '4rem',
            alignItems: 'center',
            // ALIVE BACKGROUND: Dark Grid + Vignette + Grain
            backgroundColor: '#050505', // Deep Black
            backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(20, 24, 28, 0) 0%, rgba(0, 0, 0, 0.8) 100%),
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
            position: 'relative',
            overflow: 'hidden' // Contain the noise
        }}>
            {/* GRAIN OVERLAY */}
            <div style={{
                position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                opacity: 0.08,
                pointerEvents: 'none',
                zIndex: 0,
                filter: 'contrast(150%) brightness(100%)',
                animation: 'grain 8s steps(10) infinite'
            }} />

            {/* LEFT: CONTROLS */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                    borderLeft: '4px solid var(--color-primary)',
                    paddingLeft: '2rem',
                    marginBottom: '3rem'
                }}>
                    <h1 style={{ fontSize: '3.5rem', lineHeight: '1', marginBottom: '1rem' }}>
                        UNIVERSE <br /> 25
                    </h1>
                    <div style={{
                        fontFamily: 'var(--font-data)',
                        color: 'var(--color-secondary)',
                        fontSize: '1.2rem',
                        height: '1.5em' // Fixed height for ticker
                    }}>
                        {'>'} {descriptions[textIndex]} <span className="blink">_</span>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', color: '#888', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '400px' }}>
                    The 1968 'Universe 25' experiment, resurrected in <strong style={{ color: '#ccc' }}>Silicon</strong>.
                    <br /><br />
                    We replaced mice with <strong style={{ color: '#ccc' }}>Autonomous AI Agents</strong>, granting them perfect logic and infinite energy.
                    Observe if <strong style={{ color: '#ccc' }}>Machine Intelligence</strong>  can survive the inevitable collapse.
                </div>

                <button
                    onClick={onStart}
                    className="btn-main"
                >
                    <span>INITIATE EXPERIMENT</span>
                    <span>→</span>
                </button>

                {/* CREDITS FOOTER */}
                <div style={{
                    marginTop: '4rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #333',
                    fontFamily: '"Share Tech Mono"',
                    color: '#444',
                    fontSize: '0.8rem',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>V.1.0.4 [STABLE]</span>
                    <a
                        href="https://www.linkedin.com/in/geervan/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="credit-link"
                    >
                        ARCHITECT: <span>GEERVAN</span>
                    </a>
                </div>
            </div>

            {/* RIGHT: LIVE VISUALIZER */}
            <div className="panel" style={{
                height: '500px',
                padding: 0,
                overflow: 'hidden',
                background: '#111',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px #333',
                zIndex: 2
            }}>
                <WaveMonitor />
            </div>

            <style>{`
        .blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        
        @keyframes grain {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-5%, -10%); }
            20% { transform: translate(-15%, 5%); }
            30% { transform: translate(7%, -25%); }
            40% { transform: translate(-5%, 25%); }
            50% { transform: translate(-15%, 10%); }
            60% { transform: translate(15%, 0%); }
            70% { transform: translate(0%, 15%); }
            80% { transform: translate(3%, 35%); }
            90% { transform: translate(-10%, 10%); }
        }

        .credit-link {
            text-decoration: none;
            color: #666;
            transition: all 0.3s ease;
            cursor: pointer;
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
        .credit-link span {
            color: #888;
            font-weight: bold;
            border-bottom: 2px solid transparent; /* Prepare for underline */
            transition: all 0.3s ease;
        }
        .credit-link:hover span {
            color: #00ccaa;
            text-shadow: 0 0 10px rgba(0, 204, 170, 0.6);
            border-bottom: 2px solid #00ccaa;
            letter-spacing: 2px;
        }

        .btn-main {
            padding: 1.5rem 3rem;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            background: transparent;
            border: 2px solid #444;
            color: #888;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Share Tech Mono', monospace;
            letter-spacing: 1px;
        }
        .btn-main:hover {
            border-color: #00ccaa;
            color: #00ccaa;
            background: rgba(0, 204, 170, 0.1);
            box-shadow: 0 0 30px rgba(0, 204, 170, 0.2);
            transform: translateX(10px);
        }
      `}</style>
        </div>
    );
};

export default LandingPage;
