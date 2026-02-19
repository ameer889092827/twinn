
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { UrbanIssue, Landmark } from '../types';

interface DigitalTwinProps {
  issues: UrbanIssue[];
  onIssueClick: (issue: UrbanIssue) => void;
  activeLayers: {
    traffic: boolean;
    weather: boolean;
  };
  is2D: boolean;
  landmarks: Landmark[];
  isSelectingLocation?: boolean;
  onLocationSelect?: (x: number, y: number, landmarkId?: string) => void;
  tempPin?: { x: number, y: number, landmarkId?: string } | null;
}

const DigitalTwin: React.FC<DigitalTwinProps> = ({ 
  issues, 
  onIssueClick, 
  activeLayers, 
  is2D, 
  landmarks,
  isSelectingLocation,
  onLocationSelect,
  tempPin
}) => {
  const viewAngle3D = { x: 55, z: -25 };
  const viewAngle2D = { x: 0, z: 0 };
  
  const [cameraPos, setCameraPos] = useState({ x: 1500, y: 0 });
  const [zoom, setZoom] = useState(0.65);
  const isDragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const startCamera = useRef({ x: 1500, y: 0 });

  const baselineY = 1500; 

  const issuePoints = useMemo(() => {
    return issues.map(issue => {
      const x = -1500 + (issue.location.lng - 76.85) * (5000 / (76.95 - 76.85));
      const y = baselineY + 140; 
      return { ...issue, x, y };
    });
  }, [issues, baselineY]);

  const lampNodes = useMemo(() => {
    const nodes = [];
    for (let x = -2000; x <= 6000; x += 400) {
      nodes.push({ id: `lamp-north-${x}`, x, y: baselineY - 20, side: 'north' });
      nodes.push({ id: `lamp-south-${x}`, x, y: baselineY + 300, side: 'south' });
    }
    return nodes;
  }, [baselineY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startMouse.current = { x: e.pageX, y: e.pageY };
    startCamera.current = { ...cameraPos };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const dx = (e.pageX - startMouse.current.x) * (is2D ? 1 : 1.2) / zoom;
    const dy = (e.pageY - startMouse.current.y) * (is2D ? 1 : 1.2) / zoom;
    setCameraPos({
      x: startCamera.current.x - dx,
      y: startCamera.current.y - dy
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isSelectingLocation) return;
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.2), 2));
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isSelectingLocation || !onLocationSelect) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mapX = (e.clientX - rect.left - rect.width / 2) / zoom + cameraPos.x + rect.width / 2;
    const mapY = (e.clientY - rect.top - rect.height / 2) / zoom + cameraPos.y + rect.height / 2;
    onLocationSelect(mapX, mapY);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cameraPos, is2D, zoom]);

  const angle = is2D ? viewAngle2D : viewAngle3D;
  const viewTransform = `rotateX(${angle.x}deg) rotateZ(${angle.z}deg) scale3d(${zoom}, ${zoom}, ${zoom}) translate(${-cameraPos.x}px, ${-cameraPos.y}px)`;

  const getTrafficColor = (index: number) => {
    const xPos = -2000 + (index * 40); 
    const hasNearbyIssue = issues.some(issue => {
        const issueX = -1500 + (issue.location.lng - 76.85) * (5000 / (76.95 - 76.85));
        return Math.abs(xPos - issueX) < 600;
    });
    if (hasNearbyIssue) return 'bg-red-500 shadow-[0_0_15px_red]';
    return 'bg-emerald-400 shadow-[0_0_15px_#10b981]';
  };

  return (
    <div 
      className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#010409] digital-twin-grid transition-all ${isSelectingLocation ? 'cursor-crosshair ring-4 ring-blue-500/50' : 'cursor-grab active:cursor-grabbing'}`}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onClick={handleMapClick}
      style={{ perspective: '2000px' }}
    >
      <div 
        className="w-[10000px] h-[5000px] relative transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1)"
        style={{ 
          transform: viewTransform,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* ДОРОГА */}
        <div 
          className="absolute left-[-4000px] w-[18000px] h-80 road-surface"
          style={{ top: `${baselineY}px`, transform: 'translateZ(1px)' }}
        >
          <div className="absolute inset-0 bg-[#1e2029] road-texture shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] border-y-[6px] border-[#373a45]"></div>
          <div className="absolute inset-0 flex flex-col justify-between py-6">
             <div className="w-full h-1 bg-white/20 border-t border-dashed border-white/40"></div>
             <div className="w-full h-4 bg-white/5 border-y border-white/20"></div>
             <div className="w-full h-1 bg-white/20 border-t border-dashed border-white/40"></div>
          </div>
          <div className="absolute -top-14 left-0 w-full h-14 bg-[#2c2f3a] border-y border-white/10 shadow-xl flex flex-col justify-end">
             <div className="w-full h-2 bg-black/30"></div>
          </div>
          <div className="absolute -bottom-14 left-0 w-full h-14 bg-[#2c2f3a] border-y border-white/10 shadow-xl flex flex-col justify-start">
             <div className="w-full h-2 bg-black/30"></div>
          </div>

          {activeLayers.traffic && (
             <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                <div className="flex animate-[traffic-flow_25s_linear_infinite]">
                  {[...Array(200)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-20 h-4 rounded-full mx-24 blur-[1px] opacity-80 ${getTrafficColor(i)}`}
                      style={{ marginTop: `${(i % 2 === 0 ? 35 : 205) + (Math.random() * 20)}px` }}
                    ></div>
                  ))}
                </div>
             </div>
           )}
        </div>

        {/* ФОНАРНЫЕ СТОЛБЫ */}
        {!is2D && lampNodes.map((lamp) => (
          <div
            key={lamp.id}
            className="absolute z-[450] group"
            style={{ 
              left: lamp.x, 
              top: lamp.y,
              transformStyle: 'preserve-3d'
            }}
          >
            <div 
              className="w-2 h-48 bg-gradient-to-t from-[#1a1c23] via-[#475569] to-[#94a3b8] relative"
              style={{ 
                transform: 'rotateX(-90deg)', 
                transformOrigin: 'bottom'
              }}
            >
              <div className="absolute -top-4 -left-4 w-12 h-4 bg-[#64748b] rounded-full flex items-center justify-end pr-2">
                <div className="w-6 h-3 bg-amber-100/90 rounded-full shadow-[0_0_25px_rgba(251,191,36,0.8)] glow-pulse"></div>
              </div>
              <div 
                className="absolute top-48 left-1 w-24 h-4 bg-black/40 blur-md rounded-full"
                style={{ transform: 'rotateX(90deg) translateZ(-1px)', transformOrigin: 'top' }}
              ></div>

              <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 pointer-events-none z-[1000]">
                <div className="bg-[#0f172a]/95 border border-amber-500/50 px-4 py-2 rounded-2xl shadow-3xl backdrop-blur-xl">
                   <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest whitespace-nowrap mb-0.5">УЗЕЛ: ФОНАРЬ</div>
                   <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Статус: Активен (Сеть исправна)</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ЗДАНИЯ И ОБЪЕКТЫ */}
        {landmarks.map((landmark, idx) => {
          const adjustedY = landmark.y + (baselineY - 500);
          const health = landmark.health || 100;
          const isTargetedBySelection = tempPin?.landmarkId === landmark.id;
          
          return (
            <div
              key={idx}
              className={`absolute flex flex-col items-center justify-end landmark-node group ${isSelectingLocation ? 'cursor-pointer hover:scale-105' : ''}`}
              style={{
                left: landmark.x,
                top: adjustedY,
                width: landmark.width,
                height: is2D ? landmark.width : landmark.height,
                zIndex: Math.floor(adjustedY) + 10,
                transformStyle: 'preserve-3d'
              }}
              onClick={(e) => {
                if (isSelectingLocation && onLocationSelect) {
                  e.stopPropagation();
                  onLocationSelect(landmark.x, adjustedY, landmark.id);
                }
              }}
            >
              <div 
                className={`w-full h-full relative transition-all duration-1000 ${isTargetedBySelection ? 'ring-4 ring-blue-400 ring-offset-4 ring-offset-slate-900 shadow-[0_0_50px_rgba(59,130,246,0.6)]' : ''}`}
                style={{
                  backgroundColor: is2D ? landmark.color + '44' : landmark.color,
                  border: `1px solid rgba(255,255,255,${is2D ? 0.3 : 0.1})`,
                  borderRadius: is2D ? '8px' : '2px',
                  transform: is2D ? 'none' : `translateY(-${landmark.height/2}px) rotateX(-90deg)`,
                  transformOrigin: 'bottom',
                  opacity: health < 40 ? 0.7 : 1
                }}
              >
                <div className="absolute -bottom-1 left-0 w-full h-1 bg-slate-800">
                   <div className={`h-full transition-all duration-1000 ${health < 40 ? 'bg-red-500' : health < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${health}%` }}></div>
                </div>

                <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100 z-[1000] pointer-events-none">
                  <div className="bg-[#020617]/95 border border-blue-500/30 p-3 rounded-2xl shadow-3xl backdrop-blur-3xl min-w-[220px]">
                    <div className="text-sm font-black text-white whitespace-nowrap">{landmark.name.toUpperCase()}</div>
                    <div className={`text-[9px] font-black mt-1 ${health < 50 ? 'text-red-400' : 'text-emerald-400'}`}>Здоровье актива: {health}%</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* МЕТКИ ПРОБЛЕМ */}
        {issuePoints.map((issue) => (
          <div
            key={issue.id}
            onClick={(e) => { e.stopPropagation(); onIssueClick(issue as UrbanIssue); }}
            className="absolute cursor-pointer group z-[5000]"
            style={{ left: issue.x, top: issue.y, transform: is2D ? 'none' : 'translateZ(180px)', transformStyle: 'preserve-3d' }}
          >
            <div className={`w-12 h-12 rounded-full relative z-10 border-[4px] border-white shadow-[0_25px_50px_rgba(0,0,0,0.8)] flex items-center justify-center transition-transform hover:scale-125 ${issue.criticality === 'Critical' ? 'bg-red-600' : 'bg-blue-600'}`}>
               <i className={`fa-solid ${issue.criticality === 'Critical' ? 'fa-triangle-exclamation' : 'fa-circle-info'} text-white text-sm`}></i>
            </div>
          </div>
        ))}

        {/* ВРЕМЕННЫЙ ПИН ВЫБОРА */}
        {tempPin && (
          <div
            className="absolute z-[6000]"
            style={{ left: tempPin.x, top: tempPin.y, transform: 'translateZ(200px) translate(-50%, -50%)', transformStyle: 'preserve-3d' }}
          >
            <div className="w-14 h-14 bg-blue-500 rounded-full border-4 border-white shadow-[0_0_40px_rgba(59,130,246,0.9)] flex items-center justify-center animate-bounce">
              <i className="fa-solid fa-location-dot text-white text-2xl"></i>
            </div>
          </div>
        )}
      </div>

      {/* ПАНЕЛЬ УПРАВЛЕНИЯ КАРТОЙ */}
      <div className="absolute bottom-40 right-10 flex flex-col gap-4 z-[150]">
         <div className="glass-panel p-4 rounded-[2.5rem] border border-blue-500/20 flex flex-col gap-4 shadow-2xl backdrop-blur-3xl">
            <div className="flex flex-col gap-2">
               <button 
                 onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
                 className="w-14 h-14 bg-slate-800/80 hover:bg-blue-600 text-white rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90"
                 title="Приблизить"
               >
                 <i className="fa-solid fa-plus text-lg"></i>
               </button>
               <button 
                 onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.2))}
                 className="w-14 h-14 bg-slate-800/80 hover:bg-blue-600 text-white rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90"
                 title="Отдалить"
               >
                 <i className="fa-solid fa-minus text-lg"></i>
               </button>
            </div>
            <div className="h-px bg-white/10 mx-2"></div>
            <div className="grid grid-cols-2 gap-2">
               <button 
                 onClick={() => setCameraPos(prev => ({ ...prev, x: prev.x - 500 }))} 
                 className="w-11 h-11 bg-slate-800/80 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center transition-all shadow-xl active:scale-90"
                 title="Влево"
               >
                 <i className="fa-solid fa-arrow-left text-xs"></i>
               </button>
               <button 
                 onClick={() => setCameraPos(prev => ({ ...prev, x: prev.x + 500 }))} 
                 className="w-11 h-11 bg-slate-800/80 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center transition-all shadow-xl active:scale-90"
                 title="Вправо"
               >
                 <i className="fa-solid fa-arrow-right text-xs"></i>
               </button>
            </div>
            <button 
              onClick={() => {
                setCameraPos({ x: 1500, y: 0 });
                setZoom(0.65);
              }} 
              className="w-full h-12 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-all shadow-xl active:scale-90 text-[9px] font-black uppercase tracking-widest"
            >
              СБРОС КАМЕРЫ
            </button>
         </div>
      </div>

      <style>{`
        @keyframes traffic-flow { from { transform: translateX(-2000px); } to { transform: translateX(6000px); } }
        .landmark-node { transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 1s; }
        .road-surface {
          background: linear-gradient(to bottom, #1a1c23 0%, #252830 50%, #1a1c23 100%);
        }
        .road-texture {
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 4px 4px, 50px 50px;
        }
        .glow-pulse {
          animation: glow-pulse 3s infinite ease-in-out;
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); box-shadow: 0 0 15px rgba(251,191,36,0.6); }
          50% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 35px rgba(251,191,36,0.9); }
        }
      `}</style>
    </div>
  );
};

export default DigitalTwin;
