
import React, { useState, useEffect, useRef } from 'react';
import { UrbanIssue, AgentActivity, ActivePanel, ChatMessage, Landmark } from '../types';
import { interactWithAgent } from '../services/geminiService';

interface DashboardProps {
  issues: UrbanIssue[];
  agents: AgentActivity[];
  onSelectIssue: (issue: UrbanIssue) => void;
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
  landmarks: Landmark[];
}

const Dashboard: React.FC<DashboardProps> = ({ 
  issues, 
  agents, 
  onSelectIssue, 
  activePanel, 
  setActivePanel,
  selectedAgentId,
  setSelectedAgentId,
  landmarks
}) => {
  
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({
    classifier: [],
    geo: [],
    predictor: []
  });
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, selectedAgentId]);

  const handleAgentClick = (id: string) => {
    setSelectedAgentId(id);
    setActivePanel('AgentShell');
  };

  const sendMessage = async () => {
    if (!currentInput.trim() || !selectedAgentId) return;

    const userMsg: ChatMessage = { role: 'user', text: currentInput, timestamp: new Date().toISOString() };
    const history = chatHistory[selectedAgentId] || [];
    
    setChatHistory(prev => ({ ...prev, [selectedAgentId]: [...history, userMsg] }));
    setCurrentInput('');
    setIsTyping(true);

    try {
      const responseText = await interactWithAgent(selectedAgentId, currentInput, history);
      const agentMsg: ChatMessage = { role: 'agent', text: responseText, timestamp: new Date().toISOString() };
      setChatHistory(prev => ({ ...prev, [selectedAgentId]: [...(prev[selectedAgentId] || []), agentMsg] }));
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsTyping(false);
    }
  };

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/);
      return (
        <span key={i} className="block min-h-[0.8em]">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-blue-400 font-black">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </span>
      );
    });
  };

  if (activePanel === 'AgentShell' && selectedAgentId) {
    const activeAgent = agents.find(a => a.id === selectedAgentId);
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 lg:p-12 animate-in fade-in zoom-in duration-300 backdrop-blur-sm bg-black/20">
        <div className="w-full max-w-6xl h-full flex flex-col bg-[#020617] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative">
           <header className="p-8 lg:p-10 border-b border-white/5 bg-slate-900/30 flex items-center justify-between relative z-10 backdrop-blur-md">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-3xl shadow-lg">
                    <i className={`fa-solid ${selectedAgentId === 'classifier' ? 'fa-scale-balanced' : selectedAgentId === 'geo' ? 'fa-earth-americas' : 'fa-chart-line'}`}></i>
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-1">{activeAgent?.name}</h2>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                       <span>{activeAgent?.role}</span>
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-2"></span>
                       <span className="text-emerald-500">ОНЛАЙН</span>
                    </div>
                 </div>
              </div>
              <button onClick={() => setActivePanel('Agents')} className="w-12 h-12 rounded-xl bg-slate-800/50 hover:bg-red-600 text-white flex items-center justify-center transition-all border border-white/10 group">
                <i className="fa-solid fa-xmark text-xl group-hover:rotate-90 transition-transform"></i>
              </button>
           </header>
           <div className="flex-1 flex overflow-hidden relative z-10">
              <aside className="w-64 border-r border-white/5 p-8 hidden lg:flex flex-col gap-8 bg-black/10">
                 <div>
                    <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">СИСТЕМНЫЕ МЕТРИКИ</h4>
                    <div className="space-y-4">
                       {[{ label: 'ЦП', val: '18%', fill: 'w-[18%]' }, { label: 'АКТ', val: '84%', fill: 'w-[84%]' }].map((m, i) => (
                         <div key={i} className="space-y-1.5">
                            <div className="flex justify-between items-center text-[8px] font-black text-slate-400">
                               <span>{m.label}</span>
                               <span className="text-white">{m.val}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                               <div className={`h-full bg-blue-500 ${m.fill}`}></div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </aside>
              <div className="flex-1 flex flex-col relative bg-black/10">
                 <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-6 custom-scrollbar">
                    {chatHistory[selectedAgentId]?.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                         <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm leading-relaxed font-medium shadow-xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800/50 text-slate-100 border border-white/10 rounded-tl-none backdrop-blur-xl'}`}>
                           {renderFormattedText(msg.text)}
                         </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                         <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/10 flex gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                         </div>
                      </div>
                    )}
                    <div ref={chatEndRef}></div>
                 </div>
                 <div className="p-8 border-t border-white/5 bg-slate-900/40 backdrop-blur-2xl">
                    <div className="flex gap-4 max-w-4xl mx-auto">
                       <input type="text" autoFocus value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={`Задайте вопрос ${activeAgent?.name}...`} className="flex-1 bg-black/60 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-blue-500 outline-none transition-all" />
                       <button onClick={sendMessage} className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl hover:bg-blue-500 transition-all shadow-lg active:scale-95"><i className="fa-solid fa-paper-plane text-sm"></i></button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (activePanel === 'None') return null;

  return (
    <div className="absolute top-20 left-20 w-[420px] max-h-[calc(100vh-140px)] flex flex-col z-[100] animate-in slide-in-from-left-6 duration-500">
      <div className="flex justify-between items-center mb-3 px-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-2">
          <i className="fa-solid fa-layer-group"></i>
          {activePanel === 'Overview' ? 'ОБЗОР ЖУРНАЛА' : activePanel === 'Agents' ? 'ЛАБОРАТОРИЯ АГЕНТОВ' : activePanel === 'Analytics' ? 'АНАЛИТИКА' : 'ОБЪЕКТЫ'}
        </h2>
        <button onClick={() => setActivePanel('None')} className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition-all border border-white/5"><i className="fa-solid fa-chevron-left text-slate-400 text-[10px]"></i></button>
      </div>

      <div className="flex-1 overflow-hidden glass-panel rounded-[2rem] border-white/10 shadow-2xl flex flex-col">
        
        {activePanel === 'Overview' && (
          <div className="flex flex-col h-full">
             <div className="p-5 border-b border-white/5 bg-slate-900/40">
                <div className="grid grid-cols-3 gap-2">
                   <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 text-center">
                      <div className="text-lg font-black text-red-500">{issues.filter(i => i.criticality === 'Critical').length}</div>
                      <div className="text-[7px] font-black text-slate-500 uppercase">КРИТИЧНО</div>
                   </div>
                   <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20 text-center">
                      <div className="text-lg font-black text-orange-500">{issues.filter(i => i.criticality === 'High').length}</div>
                      <div className="text-[7px] font-black text-slate-500 uppercase">ВЫСОКИЙ</div>
                   </div>
                   <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20 text-center">
                      <div className="text-lg font-black text-blue-500">{issues.length}</div>
                      <div className="text-[7px] font-black text-slate-500 uppercase">ВСЕГО</div>
                   </div>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {issues.length === 0 ? (
                  <div className="text-center py-10 opacity-30 text-[10px] font-black uppercase">Инцидентов не обнаружено</div>
                ) : (
                  issues.map(issue => (
                    <div key={issue.id} onClick={() => onSelectIssue(issue)} className="p-4 rounded-[1.2rem] bg-slate-800/40 hover:bg-slate-700/80 border border-white/5 cursor-pointer transition-all">
                      <p className="text-xs text-slate-200 font-bold mb-1 truncate">"{issue.description}"</p>
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{issue.location.address}</span>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {activePanel === 'Agents' && (
          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar h-full">
             {agents.map(agent => (
               <div key={agent.id} onClick={() => handleAgentClick(agent.id)} className="p-5 rounded-[1.5rem] bg-slate-900/60 border border-white/10 group hover:border-blue-500 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <i className={`fa-solid ${agent.id === 'classifier' ? 'fa-scale-balanced' : agent.id === 'geo' ? 'fa-earth-americas' : 'fa-chart-line'}`}></i>
                     </div>
                     <div className="flex-1">
                        <h4 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{agent.name}</h4>
                        <p className="text-[8px] text-slate-500 uppercase font-black">{agent.role}</p>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}

        {activePanel === 'Analytics' && (
          <div className="p-6 h-full flex flex-col gap-6 custom-scrollbar overflow-y-auto">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="fa-solid fa-bolt text-blue-400"></i> Плотность Трафика (Live)
              </h3>
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 h-44 flex items-end gap-1 relative overflow-hidden group">
                 <div className="absolute inset-0 opacity-10 bg-gradient-to-t from-blue-600 to-transparent"></div>
                 {[40, 55, 70, 50, 85, 95, 75, 60, 80, 100, 90, 70, 60, 85, 95, 80, 60].map((h, i) => (
                   <div key={i} className="flex-1 bg-blue-600/20 rounded-t-sm relative">
                      <div className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-1000 ${h > 80 ? 'bg-red-500' : h > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ height: `${h}%` }}></div>
                   </div>
                 ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Ср. Скорость</p>
                <div className="text-xl font-black text-emerald-400 tracking-tighter">54 <span className="text-[10px] text-slate-600">км/ч</span></div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Загруженность</p>
                <div className="text-xl font-black text-orange-400 tracking-tighter">7.2 <span className="text-[10px] text-slate-600">баллов</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Статус Ключевых Объектов</h3>
              <div className="space-y-3">
                {landmarks.filter(l => l.type !== 'Utility').map((asset, idx) => (
                  <div key={idx} className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-slate-800 transition-all">
                    <div className="flex items-center gap-4">
                       <div className={`w-2 h-2 rounded-full ${asset.health && asset.health > 80 ? 'bg-emerald-500' : asset.health && asset.health > 40 ? 'bg-orange-500' : 'bg-red-500'} shadow-[0_0_10px_currentColor]`}></div>
                       <div>
                          <p className="text-xs font-black text-white group-hover:text-blue-400 transition-colors">{asset.name}</p>
                          <p className="text-[8px] font-black text-slate-600 uppercase">{asset.type === 'Mall' ? 'Торговый центр' : asset.type === 'Tower' ? 'Небоскреб' : 'Жилой комплекс'}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className={`text-xs font-black ${asset.health && asset.health > 80 ? 'text-emerald-400' : asset.health && asset.health > 40 ? 'text-orange-400' : 'text-red-400'}`}>
                         {asset.health}%
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePanel === 'Infrastructure' && (
          <div className="p-6 h-full flex flex-col items-center justify-center opacity-40">
            <i className="fa-solid fa-lock text-4xl mb-4"></i>
            <p className="text-xs font-black uppercase tracking-widest">Доступ ограничен</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
