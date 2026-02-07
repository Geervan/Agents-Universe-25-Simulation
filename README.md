# Agents-Universe-25-Simulation

A React-based agentic simulation based on John Calhoun's "Universe 25" experiment. The project simulates a colony of digital agents interacting on a grid, managing resources, trading in a marketplace, and responding to environmental stressors like crowding and social contagion.

## About the Project
This simulation recreates the behavioral dynamics of the original mouse experiment in a digital environment. Each agent is an independent process with its own stats (CPU/Energy, Money, Stability, RAM). 

As the population grows, agents experience "crowding stress" which affects their behavior—leading to aggression, withdrawal (the "Beautiful Ones" syndrome), and reduced fertility.

### Key Features
- **Deterministic Engine**: A local kernel managing 100+ concurrent processes.
- **LLM Integration**: Uses Gemini 2.5 Flash to drive high-level agent reasoning and decision-making.
- **Dynamic Marketplace**: A simulated economy where agents buy energy and sell data tokens to survive.
- **Visual Analytics**: Real-time grid visualization, population graphs, and agent-specific thought logs.
- **Behavioral Sink Models**: Implementation of social contagion, territoriality, and chronic stress effects.

## Tech Stack
- **Framework**: React + Vite
- **Language**: TypeScript
- **AI**: Google Gemini API (Generative AI SDK)
- **State Management**: React Hooks + Custom Engine Kernel
- **Styling**: Vanilla CSS (Cyber/Terminal aesthetic)

## Getting Started

1. **Clone & Install**
   ```bash
   git clone https://github.com/Geervan/Agents-Universe-25-Simulation.git
   cd Agents-Universe-25-Simulation
   npm install
   ```

2. **API Key**
   Create a `.env` file in the root and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_key_here
   ```

3. **Development**
   ```bash
   npm run dev
   ```

## Engine Overview
- `Kernel.ts`: Handles the tick loop, grid management, and marketplace logic.
- `Process.ts`: Manages individual agent states, metabolism, and behavioral logic.
- `AgentAI.ts`: Interfaces with Gemini for reasoning with a global rate-limiting cache.
