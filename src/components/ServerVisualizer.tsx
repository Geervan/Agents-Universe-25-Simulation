import React, { useEffect, useRef, useState } from 'react';
import { Kernel } from '../engine/Kernel';
import { Process } from '../engine/Process';

interface ServerVisualizerProps {
    kernel: Kernel;
}

const ServerVisualizer: React.FC<ServerVisualizerProps & { onProcessSelect: (id: string | null) => void, selectedId: string | null }> = ({ kernel, onProcessSelect, selectedId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredAgent, setHoveredAgent] = useState<Process | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const cellSize = 14;
    const gap = 1;

    const handleClick = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - 20;
        const y = e.clientY - rect.top - 20;

        const totalSize = cellSize + gap;
        const gridX = Math.floor(x / totalSize);
        const gridY = Math.floor(y / totalSize);

        if (gridX >= 0 && gridX < kernel.width && gridY >= 0 && gridY < kernel.height) {
            const pid = kernel.grid[gridY][gridX];
            onProcessSelect(pid);
        } else {
            onProcessSelect(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - 20;
        const y = e.clientY - rect.top - 20;

        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

        const totalSize = cellSize + gap;
        const gridX = Math.floor(x / totalSize);
        const gridY = Math.floor(y / totalSize);

        if (gridX >= 0 && gridX < kernel.width && gridY >= 0 && gridY < kernel.height) {
            const pid = kernel.grid[gridY][gridX];
            if (pid) {
                setHoveredAgent(kernel.processes.get(pid) || null);
            } else {
                setHoveredAgent(null);
            }
        } else {
            setHoveredAgent(null);
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = kernel.width * (cellSize + gap) + 40;
        canvas.height = kernel.height * (cellSize + gap) + 40;

        const render = () => {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const offsetX = 20;
            const offsetY = 20;

            for (let y = 0; y < kernel.height; y++) {
                for (let x = 0; x < kernel.width; x++) {
                    const pid = kernel.grid[y][x];
                    const px = offsetX + x * (cellSize + gap);
                    const py = offsetY + y * (cellSize + gap);

                    if (pid) {
                        const proc = kernel.processes.get(pid);
                        if (proc) {
                            // STABILITY HEATMAP BACKGROUND
                            const stability = proc.stats.stability;
                            const hue = (stability / 100) * 120;
                            ctx.fillStyle = `hsla(${hue}, 70%, 15%, 0.6)`;
                            ctx.fillRect(px, py, cellSize - 2, cellSize - 2);

                            const cx = px + cellSize / 2 - 1;
                            const cy = py + cellSize / 2 - 1;
                            const r = 4;

                            ctx.lineWidth = 2;
                            ctx.shadowBlur = 0;
                            ctx.shadowColor = 'transparent';

                            // VISUAL BASED ON STATE
                            if (proc.stats.cpu < 20) {
                                // STARVING - Red hollow circle
                                ctx.strokeStyle = '#ff3300';
                                ctx.beginPath();
                                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                                ctx.stroke();
                            } else if (proc.stats.stability < 30) {
                                // AGGRESSIVE - Red X
                                ctx.strokeStyle = '#ff3300';
                                ctx.beginPath();
                                ctx.moveTo(cx - r, cy - r);
                                ctx.lineTo(cx + r, cy + r);
                                ctx.moveTo(cx + r, cy - r);
                                ctx.lineTo(cx - r, cy + r);
                                ctx.stroke();
                            } else if (proc.stats.money > 60) {
                                // WEALTHY - Gold filled circle
                                ctx.fillStyle = '#ffcc00';
                                ctx.shadowColor = '#ffcc00';
                                ctx.shadowBlur = 8;
                                ctx.beginPath();
                                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.shadowBlur = 0;
                            } else {
                                // NORMAL - Cyan square
                                ctx.fillStyle = '#00ccaa';
                                ctx.fillRect(cx - r + 1, cy - r + 1, r * 2 - 2, r * 2 - 2);
                            }

                            // SELECTED EFFECT
                            if (pid === selectedId) {
                                ctx.strokeStyle = '#fff';
                                ctx.lineWidth = 2;
                                ctx.strokeRect(px - 1, py - 1, cellSize, cellSize);
                            }
                        }
                    } else {
                        // Empty cell
                        ctx.fillStyle = '#181818';
                        ctx.fillRect(px, py, cellSize - 2, cellSize - 2);
                    }
                }
            }
        };

        const animId = requestAnimationFrame(function loop() {
            render();
            requestAnimationFrame(loop);
        });

        return () => cancelAnimationFrame(animId);
    }, [kernel, selectedId]);

    return (
        <div style={{ position: 'relative', display: 'inline-block', cursor: 'crosshair' }}>
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredAgent(null)}
                style={{ borderRadius: '4px' }}
            />

            {/* HOVER TOOLTIP */}
            {hoveredAgent && (
                <div style={{
                    position: 'absolute',
                    left: mousePos.x + 15,
                    top: mousePos.y - 10,
                    background: 'rgba(0, 0, 0, 0.95)',
                    border: '1px solid #00ccaa',
                    padding: '10px 14px',
                    fontFamily: '"Share Tech Mono", monospace',
                    fontSize: '0.7rem',
                    color: '#fff',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    whiteSpace: 'nowrap',
                    maxWidth: '280px'
                }}>
                    <div style={{ color: '#00ccaa', marginBottom: '6px', fontWeight: 'bold' }}>
                        ID: {hoveredAgent.stats.id}
                    </div>
                    <div>⚡ Energy: <span style={{ color: hoveredAgent.stats.cpu < 30 ? '#f33' : '#0c0' }}>{Math.round(hoveredAgent.stats.cpu)}%</span></div>
                    <div>💰 Wealth: {Math.round(hoveredAgent.stats.money)} CR</div>
                    <div>🧠 Stability: <span style={{ color: hoveredAgent.stats.stability < 50 ? '#f80' : '#0c0' }}>{Math.round(hoveredAgent.stats.stability)}%</span></div>
                    <div>📅 Age: {hoveredAgent.stats.cycle} cycles</div>

                    {/* AI THOUGHT BUBBLE */}
                    {hoveredAgent.lastThought && (
                        <div style={{
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid #333',
                            color: '#ffcc00',
                            whiteSpace: 'normal',
                            fontStyle: 'italic'
                        }}>
                            🤖 "{hoveredAgent.lastThought}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ServerVisualizer;
