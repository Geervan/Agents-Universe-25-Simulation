import React, { useEffect, useRef } from 'react';

interface EventLogProps {
    events: string[];
}

const EventLog: React.FC<EventLogProps> = ({ events }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of log
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [events]);

    return (
        <div style={{
            width: '100%',
            maxWidth: '600px',
            height: '150px',
            border: '2px solid #333',
            background: '#0a0a0a',
            color: '#00ff41',
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: '0.8rem',
            padding: '10px',
            overflowY: 'auto',
            boxShadow: ' inset 0 0 20px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column-reverse' // Newest at bottom visually if we map normally? 
            // Actually Kernel.log unshifts (newest first). 
            // So we want Newest at TOP.
        }}>
            {events.map((log, i) => (
                <div key={i} style={{
                    borderBottom: '1px solid #111',
                    padding: '2px 0',
                    opacity: 1 - (i / 50), // Fade out older logs
                    color: log.includes('ATTACK') ? '#ff3300' :
                        log.includes('TRADE') ? '#ffcc00' :
                            log.includes('SIGKILL') ? '#ff00aa' : '#00ff41'
                }}>
                    {log}
                </div>
            ))}
        </div>
    );
};

export default EventLog;
