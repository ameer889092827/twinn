
import { UrbanIssue, Landmark } from './types';

export const AL_FARABI_LANDMARKS: Landmark[] = [
  // West to East sequence on Al-Farabi
  { id: 'l1', name: 'Mega Center Almaty', x: -500, y: 350, height: 35, width: 220, depth: 100, color: '#1e293b', type: 'Mall', status: 'Active', health: 98 },
  { id: 'l2', name: 'Presidential Park', x: 200, y: 320, height: 10, width: 450, depth: 250, color: '#064e3b', type: 'Greenery', status: 'Active', health: 100 },
  { id: 'l3', name: 'Villa Boutiques', x: 900, y: 340, height: 25, width: 140, depth: 40, color: '#0f172a', type: 'Mall', status: 'Active', health: 92 },
  
  // Esentai Segment
  { id: 'l4', name: 'Esentai Mall', x: 1400, y: 330, height: 45, width: 180, depth: 120, color: '#334155', type: 'Mall', status: 'Active', health: 95 },
  { id: 'l5', name: 'Esentai Tower', x: 1450, y: 280, height: 280, width: 45, depth: 45, color: '#94a3b8', type: 'Tower', status: 'Active', health: 99 },
  { id: 'l6', name: 'Haileybury Almaty', x: 1800, y: 320, height: 30, width: 120, depth: 100, color: '#475569', type: 'Complex', status: 'Active', health: 91 },
  
  // Financial District
  { id: 'l7', name: 'Nurly-Tau Complex', x: 2700, y: 350, height: 140, width: 350, depth: 60, color: '#cbd5e1', type: 'Complex', status: 'Active', health: 91 },
  { id: 'l8', name: 'Ritz-Carlton Almaty', x: 1520, y: 290, height: 200, width: 50, depth: 50, color: '#64748b', type: 'Tower', status: 'Active', health: 97 },
  { id: 'l9', name: 'Almaty Financial Center', x: 3100, y: 310, height: 180, width: 60, depth: 60, color: '#94a3b8', type: 'Tower', status: 'Active', health: 89 },
  
  // Dostyk End
  { id: 'l10', name: 'Dostyk Plaza', x: 4000, y: 350, height: 50, width: 200, depth: 150, color: '#1e293b', type: 'Mall', status: 'Active', health: 99 },
  
  // Smart Infrastructure Nodes
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: `node-${101 + i}`,
    name: `Node #${i + 101}`,
    x: -800 + (i * 450),
    y: 410,
    height: 80,
    width: 2,
    depth: 2,
    color: '#3b82f6',
    type: 'Utility' as const,
    status: Math.random() > 0.1 ? 'Active' : 'Maintenance' as any,
    health: Math.floor(Math.random() * 30) + 70
  }))
];

export const INITIAL_ISSUES: UrbanIssue[] = [
  {
    id: '1',
    category: 'Road Surface',
    criticality: 'High',
    description: 'Глубокая выбоина на полосе в сторону Достык, провоцирует резкое торможение.',
    location: { lat: 43.2201, lng: 76.9287, address: 'Аль-Фараби / Достык' },
    status: 'In Progress',
    timestamp: new Date().toISOString(),
    impactScore: 82,
    prediction: 'Затор в час пик увеличится на 22%.',
    slaDeadline: new Date(Date.now() + 8 * 3600000).toISOString(),
    duplicateCount: 8,
    accidentRisk: 'High'
  }
];
