
import React, { useState, useCallback, useMemo } from 'react';
import DigitalTwin from './components/DigitalTwin';
import ReportingPanel from './components/ReportingPanel';
import Dashboard from './components/Dashboard';
import { UrbanIssue, AgentActivity, ActivePanel, Landmark } from './types';
import { INITIAL_ISSUES, AL_FARABI_LANDMARKS } from './constants';

const INITIAL_AGENTS: AgentActivity[] = [
  { 
    id: 'classifier', 
    name: 'Agent-Classifier', 
    role: 'Аналитик Контекста', 
    status: 'Idle', 
    lastAction: 'Мониторинг отчетов',
    descriptionRu: 'Специализируется на муниципальных законах Алматы, правилах дорожного покрытия и SLA.'
  },
  { 
    id: 'geo', 
    name: 'Agent-GeoAnalyst', 
    role: 'Пространственный Валидатор', 
    status: 'Idle', 
    lastAction: 'Сканирование коридора',
    descriptionRu: 'Эксперт по географии Алматы. Помогает понять пространственные связи и обнаруживает дубликаты.'
  },
  { 
    id: 'predictor', 
    name: 'Agent-Predictor', 
    role: 'Моделировщик Потоков', 
    status: 'Idle', 
    lastAction: 'Прогноз трафика',
    descriptionRu: 'Моделирует последствия инцидентов для транспортных потоков и безопасности.'
  },
];

const App: React.FC = () => {
  const [issues, setIssues] = useState<UrbanIssue[]>(INITIAL_ISSUES);
  const [agents, setAgents] = useState<AgentActivity[]>(INITIAL_AGENTS);
  const [selectedIssue, setSelectedIssue] = useState<UrbanIssue | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>('None');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [is2D, setIs2D] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    traffic: true,
    weather: true
  });

  // Location selection state for the report
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [manualSelection, setManualSelection] = useState<{ x: number, y: number, landmarkId?: string } | null>(null);

  // Calculate dynamic landmark health based on nearby issues
  const reactiveLandmarks = useMemo(() => {
    return AL_FARABI_LANDMARKS.map(landmark => {
      let currentHealth = 100;
      
      issues.forEach(issue => {
        // Direct link penalty (severe)
        if (issue.targetLandmarkId === landmark.id) {
          currentHealth -= 40;
        } else {
          // Proximity penalty (normal)
          const issueX = -1500 + (issue.location.lng - 76.85) * (5000 / (76.95 - 76.85));
          const distance = Math.abs(landmark.x - issueX);
          
          if (distance < 500) {
            const penalty = issue.criticality === 'Critical' ? 15 : 
                           issue.criticality === 'High' ? 8 : 3;
            currentHealth -= penalty;
          }
        }
      });

      return {
        ...landmark,
        health: Math.max(currentHealth, 5),
        status: currentHealth < 30 ? 'Offline' : currentHealth < 70 ? 'Maintenance' : 'Active'
      } as Landmark;
    });
  }, [issues]);

  const handleNewIssue = useCallback((issue: UrbanIssue) => {
    setIssues(prev => [issue, ...prev]);
    setSelectedIssue(issue);
    setActivePanel('Overview');
    setManualSelection(null);
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<AgentActivity>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const isShellOpen = activePanel === 'AgentShell';

  return (
    <div className="w-full h-screen bg-[#020617] relative overflow-hidden flex flex-col text-slate-100 font-['Inter']">
      
      {/* BACKGROUND LAYER */}
      <div className={`absolute inset-0 z-0 transition-all duration-700 flex flex-col ${isShellOpen ? 'blur-[10px] grayscale opacity-40' : 'blur-0 opacity-100'}`}>
        
        {/* HUD Header */}
        <header className="absolute top-0 left-0 w-full h-16 px-6 flex items-center justify-between z-[110] bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg border border-white/10">
              <i className="fa-solid fa-city text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none italic">
                Tveen
              </h1>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-0.5">Al-Farabi • Алматы</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <button 
              onClick={() => setIs2D(!is2D)}
              className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-500/30 bg-blue-900/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-xl"
            >
              {is2D ? 'Режим 3D' : 'Режим 2D'}
            </button>
          </div>
        </header>

        {/* Digital Twin Background */}
        <DigitalTwin 
          issues={issues} 
          onIssueClick={(issue) => setSelectedIssue(issue)} 
          activeLayers={activeLayers}
          is2D={is2D}
          landmarks={reactiveLandmarks}
          isSelectingLocation={isSelectingLocation}
          onLocationSelect={(x, y, landmarkId) => {
            setManualSelection({ x, y, landmarkId });
            setIsSelectingLocation(false);
          }}
          tempPin={manualSelection}
        />

        {/* Side Nav */}
        <nav className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-[120]">
          {[
            { id: 'Overview', icon: 'fa-list-ul', label: 'ЖУРНАЛ' },
            { id: 'Agents', icon: 'fa-robot', label: 'АГЕНТЫ' },
            { id: 'Analytics', icon: 'fa-chart-pie', label: 'АНАЛИЗ' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(activePanel === tab.id ? 'None' : tab.id as ActivePanel)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all group relative border-2 ${
                activePanel === tab.id 
                  ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                  : 'bg-slate-900/80 text-slate-400 border-white/5 hover:border-blue-500/50 backdrop-blur-xl'
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-lg`}></i>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <footer className="mt-auto h-10 bg-black/90 backdrop-blur-3xl border-t border-white/10 px-6 flex items-center justify-between">
           <div className="flex gap-8">
              <div className="flex items-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                 SYSTEM OK
              </div>
           </div>
        </footer>
      </div>

      {/* OVERLAY LAYER */}
      <div className="absolute inset-0 z-[150] pointer-events-none">
        
        {/* Selected Issue Panel */}
        {selectedIssue && !isShellOpen && (
          <div className="absolute top-20 right-6 w-[360px] glass-panel rounded-[2rem] shadow-2xl p-6 border-white/10 pointer-events-auto flex flex-col max-h-[calc(100vh-140px)] animate-in slide-in-from-right-10 duration-500">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className={`px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest inline-flex mb-2 ${
                  selectedIssue.criticality === 'Critical' ? 'bg-red-600 text-white' : 
                  selectedIssue.criticality === 'High' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {selectedIssue.category}
                </div>
                <h2 className="text-xl font-black leading-tight text-white">{selectedIssue.location.address}</h2>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-all border border-white/5">
                <i className="fa-solid fa-xmark text-slate-400 text-sm"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mt-4">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 italic font-medium text-slate-300 text-xs leading-relaxed">
                "{selectedIssue.description}"
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-auto">
          <Dashboard 
            issues={issues} 
            agents={agents} 
            onSelectIssue={setSelectedIssue}
            activePanel={activePanel}
            setActivePanel={setActivePanel}
            selectedAgentId={selectedAgentId}
            setSelectedAgentId={setSelectedAgentId}
            landmarks={reactiveLandmarks}
          />
        </div>

        {!isShellOpen && (
          <div className="pointer-events-auto">
            <ReportingPanel 
              onNewIssue={handleNewIssue} 
              agents={agents}
              updateAgent={updateAgent}
              setIsSelectingLocation={setIsSelectingLocation}
              isSelectingLocation={isSelectingLocation}
              manualSelection={manualSelection}
              setManualSelection={setManualSelection}
              landmarks={AL_FARABI_LANDMARKS}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
