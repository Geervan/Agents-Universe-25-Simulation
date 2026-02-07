import { useState, useEffect, useRef, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import ServerVisualizer from './components/ServerVisualizer';
import { Kernel } from './engine/Kernel';
import AgentInspector from './components/AgentInspector';
import EventLog from './components/EventLog';
import Legend from './components/Legend';
import PopulationGraph from './components/PopulationGraph';
import APIKeyInput from './components/APIKeyInput';
import AIThoughtsPanel from './components/AIThoughtsPanel';
import SessionSummary from './components/SessionSummary';


function App() {
  const [appState, setAppState] = useState<'LANDING' | 'SIMULATION'>('LANDING');
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({ processCount: 0, tick: 0, totalMoney: 0, events: [] as string[] });
  const [aiThoughts, setAiThoughts] = useState<{ id: string; reasoning: string; action: string | null; at: number }[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ population: number; avgStability: number; tick: number }[]>([]);
  const [sessionSummary, setSessionSummary] = useState<null | typeof kernelRef.current.session>(null);

  const kernelRef = useRef<Kernel>(new Kernel(40, 25));

  // Helper to get fresh process data for UI
  const selectedProcess = selectedProcessId ? kernelRef.current.processes.get(selectedProcessId) ?? null : null;

  useEffect(() => {
    let interval: number;
    if (isRunning && appState === 'SIMULATION') {
      interval = setInterval(() => {
        kernelRef.current.tick();

        // Stats Calculation
        let money = 0;
        let totalStability = 0;
        kernelRef.current.processes.forEach(p => {
          money += p.stats.money;
          totalStability += p.stats.stability;
        });
        const avgStability = kernelRef.current.processes.size > 0
          ? totalStability / kernelRef.current.processes.size
          : 100;

        setStats({
          processCount: kernelRef.current.processes.size,
          tick: kernelRef.current.tickCount,
          totalMoney: money,
          events: [...kernelRef.current.events]
        });

        const thoughts = Array.from(kernelRef.current.processes.values())
          .filter(p => p.lastThought && p.lastThoughtAt)
          .map(p => ({
            id: p.stats.id,
            reasoning: p.lastThought as string,
            action: p.getAIRecommendation(),
            at: p.lastThoughtAt as number
          }))
          .sort((a, b) => b.at - a.at)
          .slice(0, 8);

        setAiThoughts(thoughts);

        // Update history (keep last 100 points)
        setHistory(prev => {
          const newPoint = {
            population: kernelRef.current.processes.size,
            avgStability,
            tick: kernelRef.current.tickCount
          };
          const updated = [...prev, newPoint];
          return updated.slice(-100); // Keep last 100
        });

        // Detect extinction
        if (kernelRef.current.session.extinctionTick !== null && !sessionSummary) {
          setSessionSummary({ ...kernelRef.current.session });
          setIsRunning(false);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, appState]);

  const handleInject = useCallback(() => {
    const kernel = kernelRef.current;
    let x: number, y: number;

    // If there are existing agents, spawn near one of them
    if (kernel.processes.size > 0) {
      const agents = Array.from(kernel.processes.values());
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];

      // Try to find an empty spot near this agent
      const offsets = [
        { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
        { x: -1, y: 0 }, { x: 1, y: 0 },
        { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 },
        { x: -2, y: 0 }, { x: 2, y: 0 }, { x: 0, y: -2 }, { x: 0, y: 2 }
      ];

      // Shuffle offsets for variety
      offsets.sort(() => Math.random() - 0.5);

      let found = false;
      for (const off of offsets) {
        const nx = randomAgent.position.x + off.x;
        const ny = randomAgent.position.y + off.y;
        if (nx >= 0 && nx < kernel.width && ny >= 0 && ny < kernel.height && !kernel.grid[ny][nx]) {
          x = nx;
          y = ny;
          found = true;
          break;
        }
      }

      // If no spot near agent, spawn randomly
      if (!found) {
        x = Math.floor(Math.random() * kernel.width);
        y = Math.floor(Math.random() * kernel.height);
      }
    } else {
      // No agents - spawn in center
      x = Math.floor(kernel.width / 2) + Math.floor(Math.random() * 5) - 2;
      y = Math.floor(kernel.height / 2) + Math.floor(Math.random() * 5) - 2;
    }

    kernel.spawnProcess({ x: x!, y: y! });
    // Update count immediately so it's visible even when paused
    setStats(prev => ({ ...prev, processCount: kernel.processes.size }));
  }, []);

  const handleRestart = useCallback(() => {
    kernelRef.current = new Kernel(40, 25);
    setSessionSummary(null);
    setHistory([]);
    setStats({ processCount: 0, tick: 0, totalMoney: 0, events: [] as string[] });
    setAiThoughts([]);
    setSelectedProcessId(null);
    setIsRunning(true);
  }, []);

  return (
    <>
      {appState === 'LANDING' ? (
        <LandingPage onStart={() => {
          setAppState('SIMULATION');
          setIsRunning(false);
        }} />
      ) : (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#1a1c21',
          padding: '20px'
        }}>
          {/* --- TOP CONTROL PANEL (Brutalist Rack) --- */}
          <header style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 1fr',
            gap: '20px',
            background: '#121418',
            border: '4px solid #333',
            padding: '15px',
            marginBottom: '20px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
          }}>
            {/* LEFT: STATUS METERS */}
            <div style={{ borderRight: '2px solid #333', paddingRight: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>SYSTEM STATUS</div>
              <div style={{
                color: isRunning ? 'var(--color-phosphor)' : '#888',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textShadow: isRunning ? '0 0 10px var(--color-phosphor)' : 'none'
              }}>
                {isRunning ? '● ONLINE' : '○ STANDBY'}
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
                TICK_RATE: 10Hz
              </div>
            </div>

            {/* CENTER: COUNTERS (Nixie Tube Logic) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>ACTIVE AGENTS</div>
                <div style={{
                  fontFamily: 'Courier New',
                  fontSize: '2.5rem',
                  color: '#e6e6e6',
                  background: '#000',
                  padding: '5px 15px',
                  border: '1px solid #444',
                  marginTop: '5px'
                }}>
                  {stats.processCount.toString().padStart(3, '0')}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>GDP (TOKENS)</div>
                <div style={{
                  fontFamily: 'Courier New',
                  fontSize: '2.5rem',
                  color: '#ffcc00', // Gold color for Money
                  background: '#000',
                  padding: '5px 15px',
                  border: '1px solid #444',
                  marginTop: '5px'
                }}>
                  {Math.round(stats.totalMoney).toString().padStart(5, '0')}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>ELAPSED CYCLES</div>
                <div style={{
                  fontFamily: 'Courier New',
                  fontSize: '2.5rem',
                  color: '#e6e6e6',
                  background: '#000',
                  padding: '5px 15px',
                  border: '1px solid #444',
                  marginTop: '5px'
                }}>
                  {stats.tick.toString().padStart(5, '0')}
                </div>
              </div>
            </div>

            {/* RIGHT: PHYSICAL TOGGLES */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderLeft: '2px solid #333',
              paddingLeft: '20px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setIsRunning(!isRunning)}
                style={{
                  background: isRunning ? '#1a1c21' : '#003300',
                  borderColor: isRunning ? '#666' : '#00ff41',
                  color: isRunning ? '#666' : '#00ff41'
                }}
              >
                {isRunning ? '[ DISENGAGE ]' : '[ INITIATE ]'}
              </button>

              <button
                onClick={handleInject}
                style={{ borderColor: 'var(--color-phosphor)', color: 'var(--color-phosphor)' }}
              >
                + INJECT AGENT
              </button>
            </div>
          </header>

          {/* --- MAIN MONITOR AREA --- */}
          <main style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column', // Stack Visualizer and Log
            justifyContent: 'center', // Center vertically
            alignItems: 'center',
            position: 'relative',
            gap: '10px', // Tighten gap
            overflow: 'hidden', // PREVENT SCROLL
            padding: '10px'
          }}>
            {/* Decorative Bezel screws removed */}

            <ServerVisualizer
              kernel={kernelRef.current}
              onProcessSelect={setSelectedProcessId}
              selectedId={selectedProcessId}
            />

            <EventLog events={stats.events} />


            {/* INSPECTOR PANEL */}
            {selectedProcessId && (
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 100
              }}>
                <AgentInspector
                  process={selectedProcess}
                  onClose={() => setSelectedProcessId(null)}
                />
              </div>
            )}

            <Legend />

            {/* POPULATION GRAPH */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 100
            }}>
              <PopulationGraph history={history} />
            </div>

            {/* API KEY INPUT - Bottom Right */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              zIndex: 100
            }}>
              <APIKeyInput onReady={() => console.log('AI Ready!')} />
            </div>

            {/* AI REASONING - Right Side */}
            <div style={{
              position: 'absolute',
              top: '220px',
              right: '20px',
              zIndex: 90
            }}>
              <AIThoughtsPanel thoughts={aiThoughts} />
            </div>

            {sessionSummary && (
              <SessionSummary
                data={{
                  ...sessionSummary,
                  extinctionTick: sessionSummary.extinctionTick ?? 0,
                  totalTicks: sessionSummary.extinctionTick ?? 0,
                }}
                onRestart={handleRestart}
              />
            )}

          </main>
        </div>
      )}
    </>
  );
}

export default App;
