
import React, { useState, useRef } from 'react';
import { processCivicIssue } from '../services/geminiService';
import { UrbanIssue, AgentActivity, Landmark } from '../types';

interface ReportingPanelProps {
  onNewIssue: (issue: UrbanIssue) => void;
  agents: AgentActivity[];
  updateAgent: (id: string, updates: Partial<AgentActivity>) => void;
  setIsSelectingLocation: (val: boolean) => void;
  isSelectingLocation: boolean;
  manualSelection: { x: number, y: number, landmarkId?: string } | null;
  setManualSelection: (val: { x: number, y: number, landmarkId?: string } | null) => void;
  landmarks: Landmark[];
}

const ReportingPanel: React.FC<ReportingPanelProps> = ({ 
  onNewIssue, 
  agents, 
  updateAgent, 
  setIsSelectingLocation, 
  isSelectingLocation, 
  manualSelection,
  setManualSelection,
  landmarks
}) => {
  const [isReporting, setIsReporting] = useState(false);
  const [reportText, setReportText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedLandmark = manualSelection?.landmarkId 
    ? landmarks.find(l => l.id === manualSelection.landmarkId) 
    : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!reportText && !image) return;

    setIsProcessing(true);
    agents.forEach(a => updateAgent(a.id, { status: 'Idle', lastAction: 'Waiting...', thoughts: '' }));

    try {
      updateAgent('classifier', { status: 'Processing', lastAction: 'Interpreting report semantics...' });
      
      // Inject landmark name into text if selected to help AI
      const enhancedText = selectedLandmark 
        ? `[Связано с: ${selectedLandmark.name}] ${reportText}` 
        : reportText;

      const result = await processCivicIssue(enhancedText, image || undefined);

      updateAgent('classifier', { status: 'Completed', lastAction: `Classified: ${result.category}` });

      updateAgent('geo', { status: 'Processing', lastAction: 'Validating spatial coordinates...' });
      await new Promise(r => setTimeout(r, 600));
      updateAgent('geo', { status: 'Completed', lastAction: `Location Fixed: ${result.location?.address}` });

      updateAgent('predictor', { status: 'Processing', lastAction: 'Running flow simulation...' });
      await new Promise(r => setTimeout(r, 800));
      updateAgent('predictor', { status: 'Completed', lastAction: `Risk Score: ${result.impactScore}%` });
      
      // Map manual selection back to coordinates if available
      let finalLocation = result.location || { lat: 43.22, lng: 76.92, address: "Al-Farabi Corridor" };
      if (manualSelection && !manualSelection.landmarkId) {
         // Scale manual X back to Lng for visual consistency
         const manualLng = 76.85 + (manualSelection.x + 1500) * (76.95 - 76.85) / 5000;
         finalLocation = { ...finalLocation, lng: manualLng };
      }

      const newIssue: UrbanIssue = {
        id: `CIVIC-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        category: result.category || 'Road Surface',
        criticality: result.criticality || 'Medium',
        description: result.description || reportText,
        location: finalLocation,
        targetLandmarkId: manualSelection?.landmarkId,
        status: 'Received',
        timestamp: new Date().toISOString(),
        impactScore: result.impactScore || 50,
        prediction: result.prediction,
        duplicateCount: result.duplicateCount || 1,
        accidentRisk: result.accidentRisk || 'Low',
        slaDeadline: new Date(Date.now() + 24 * 3600000).toISOString(),
        imageUrl: image || undefined,
        agentThoughts: result.agentThoughts
      };

      onNewIssue(newIssue);
      setIsProcessing(false);
      resetForm();
    } catch (error) {
      setIsProcessing(false);
      updateAgent('classifier', { status: 'Error', lastAction: 'Orchestration Timeout' });
    }
  };

  const resetForm = () => {
    setIsReporting(false);
    setReportText('');
    setImage(null);
    setIsProcessing(false);
    setManualSelection(null);
    setIsSelectingLocation(false);
  };

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-6">
      {!isReporting ? (
        <button
          onClick={() => setIsReporting(true)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-5 transition-all transform hover:-translate-y-2 group border-t border-white/20"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <i className="fa-solid fa-bullhorn text-2xl"></i>
          </div>
          <span className="text-xl tracking-tighter uppercase">СООБЩИТЬ О ПРОБЛЕМЕ</span>
        </button>
      ) : (
        <div className="glass-panel p-8 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,1)] border-white/10 animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black flex items-center gap-3">
              <i className="fa-solid fa-file-pen text-blue-500"></i>
              НОВЫЙ ОТЧЕТ
            </h3>
            <button onClick={resetForm} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors border border-white/5">
              <i className="fa-solid fa-xmark text-slate-400"></i>
            </button>
          </div>

          <div className="space-y-6">
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Что произошло? (например, 'Яма на повороте' или 'Сломан забор у Есентая')"
              className="w-full h-32 bg-slate-950/70 border border-slate-700/50 rounded-2xl p-6 text-white text-sm focus:border-blue-500 outline-none transition-all resize-none shadow-inner"
              disabled={isProcessing}
            />

            <div className="flex gap-4">
               <button
                  onClick={() => setIsSelectingLocation(!isSelectingLocation)}
                  className={`flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border ${
                    manualSelection 
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                      : isSelectingLocation 
                        ? 'bg-blue-600 border-blue-400 text-white animate-pulse' 
                        : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-slate-800'
                  }`}
                  disabled={isProcessing}
               >
                  <i className={`fa-solid ${manualSelection ? 'fa-check-double' : 'fa-map-pin'}`}></i>
                  {manualSelection 
                    ? (selectedLandmark ? `ВЫБРАНО: ${selectedLandmark.name}` : 'МЕСТО УКАЗАНО') 
                    : isSelectingLocation ? 'ВЫБЕРИТЕ НА КАРТЕ...' : 'УКАЗАТЬ МЕСТО'}
               </button>

               <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 h-14 flex items-center justify-center gap-3 rounded-2xl border transition-all ${
                  image ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-slate-800'
                }`}
                disabled={isProcessing}
              >
                <i className={`fa-solid ${image ? 'fa-image' : 'fa-camera'}`}></i>
                <span className="font-black uppercase tracking-widest text-[10px]">{image ? 'ФОТО ГОТОВО' : 'ДОБАВИТЬ ФОТО'}</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isProcessing || (!reportText && !image)}
              className={`w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                isProcessing 
                ? 'bg-slate-800 text-slate-500' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl'
              }`}
            >
              {isProcessing ? <i className="fa-solid fa-dna fa-spin"></i> : 'ОТПРАВИТЬ В CivicOS'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportingPanel;
