import React, { useEffect, useRef } from 'react';

interface PopulationGraphProps {
    history: { population: number; avgStability: number; tick: number }[];
}

const PopulationGraph: React.FC<PopulationGraphProps> = ({ history }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        if (history.length < 2) return;

        // Find max values for scaling
        const maxPop = Math.max(...history.map(h => h.population), 10);

        // Draw grid lines
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw Population Line (Cyan)
        ctx.strokeStyle = '#00ccaa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const step = width / Math.max(history.length - 1, 1);
        history.forEach((point, i) => {
            const x = i * step;
            const y = height - (point.population / maxPop) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw Stability Line (Yellow/Orange)
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        history.forEach((point, i) => {
            const x = i * step;
            const y = height - (point.avgStability / 100) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Labels
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillStyle = '#00ccaa';
        ctx.fillText(`POP: ${history[history.length - 1].population}`, 5, 12);
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(`STABILITY: ${Math.round(history[history.length - 1].avgStability)}%`, 5, 24);

    }, [history]);

    return (
        <div style={{
            background: 'rgba(10, 10, 10, 0.9)',
            border: '1px solid #333',
            padding: '10px',
            borderRadius: '4px'
        }}>
            <div style={{
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: '0.7rem',
                color: '#666',
                marginBottom: '5px'
            }}>
                TIMELINE
            </div>
            <canvas
                ref={canvasRef}
                width={300}
                height={80}
                style={{ display: 'block' }}
            />
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: '0.6rem',
                color: '#444',
                marginTop: '3px'
            }}>
                <span>← PAST</span>
                <span>NOW →</span>
            </div>
        </div>
    );
};

export default PopulationGraph;
