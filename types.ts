
export type Category = 'Road Surface' | 'Utilities' | 'Street Lighting' | 'Public Spaces' | 'Sanitation' | 'Traffic Signals';
export type Status = 'Received' | 'In Progress' | 'Resolved' | 'Escalated';
export type Criticality = 'Low' | 'Medium' | 'High' | 'Critical';
export type ActivePanel = 'None' | 'Overview' | 'Agents' | 'Analytics' | 'Infrastructure' | 'AgentShell';

export interface UrbanIssue {
  id: string;
  category: Category;
  criticality: Criticality;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  targetLandmarkId?: string; // Links a report directly to a building
  status: Status;
  timestamp: string;
  imageUrl?: string;
  impactScore: number;
  prediction?: string;
  assignedTo?: string;
  slaDeadline: string;
  predictedCongestionIncrease?: string;
  duplicateCount: number;
  accidentRisk: 'Low' | 'Medium' | 'High';
  agentThoughts?: {
    classifier: string;
    geo: string;
    predictor: string;
  };
}

export interface AgentActivity {
  id: string;
  name: string;
  status: 'Idle' | 'Processing' | 'Completed' | 'Error';
  lastAction: string;
  role: string;
  thoughts?: string;
  descriptionRu?: string;
}

export interface Landmark {
  id: string;
  name: string;
  x: number;
  y: number;
  height: number;
  width: number;
  depth: number;
  color: string;
  type: 'Tower' | 'Mall' | 'Complex' | 'Greenery' | 'Utility';
  status?: 'Active' | 'Maintenance' | 'Offline';
  health?: number;
}

export interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}
