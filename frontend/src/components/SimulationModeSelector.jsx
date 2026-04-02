import { useCrowd } from '../context/CrowdIntelligenceContext';
import { getSimModeConfig } from '../utils/engines/HybridSignalEngine';

const MODES = ['beginner', 'pro', 'event'];

export default function SimulationModeSelector() {
  const { simMode, setSimMode } = useCrowd();

  return (
    <div className="panel sim-panel" id="sim-mode-selector">
      <h2 className="panel-title">🎮 Simulation Mode</h2>
      <div className="sim-mode-grid">
        {MODES.map(mode => {
          const cfg = getSimModeConfig(mode);
          return (
            <button key={mode} id={`sim-${mode}`}
              className={`sim-card ${simMode === mode ? 'active' : ''}`}
              style={{ '--mode-color': cfg.color }}
              onClick={() => setSimMode(mode)}>
              <div className="sim-label" style={{ color: cfg.color }}>{cfg.label}</div>
              <div className="sim-desc">{cfg.desc}</div>
              <div className="sim-meta">Max multiplier: {cfg.maxMultiplier}x</div>
              {simMode === mode && <div className="sim-active-tag">✅ Active</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
