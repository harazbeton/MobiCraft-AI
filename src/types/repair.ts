export type DeviceCategory = 'smartphone' | 'laptop' | 'tablet' | 'smartwatch' | 'all';

export type TicketStatus = 
  | 'received' 
  | 'pending_repair'
  | 'under_diagnosis' 
  | 'waiting_component' 
  | 'testing' 
  | 'repaired' 
  | 'delivered';

export interface DeviceIntakeCondition {
  powersOn: boolean;
  displayCracked: boolean;
  liquidDamaged: boolean;
  missingScrews: boolean;
  batterySwollen: boolean;
  priorRepairAttempt: boolean;
}

export interface IdentifiedComponent {
  refDesignator: string; // e.g., C103, U3300, L0900
  partType: string; // Capacitor, PMIC, Mosfet, Diode
  condition: 'damaged' | 'suspect' | 'normal' | 'corroded';
  symptomFound: string;
}

export interface MultimeterCheck {
  testPoint: string;
  measurementMode: 'diode_mode' | 'voltage_mode' | 'resistance';
  expectedValue: string;
  faultIndicator: string;
}

export interface RepairStepAction {
  step: number;
  title: string;
  heatGunSettings?: string; // e.g., 340°C, 35% Airflow
  instructions: string;
  cautionNote?: string;
}

export interface DiagnosticReport {
  targetCircuit: string;
  confidenceLevel: number;
  faultSummary: string;
  visualDefects: string[];
  identifiedComponents: IdentifiedComponent[];
  multimeterChecks: MultimeterCheck[];
  repairActionPlan: RepairStepAction[];
  toolsRequired: string[];
}

export interface VideoInspectionReport {
  overallAssessment: string;
  safetyScore: number;
  phaseBreakdown: {
    frameIndex: number;
    phaseName: string;
    observation: string;
    qualityRating: string;
  }[];
  recommendations: string[];
}

export interface TicketTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor: 'customer' | 'technician' | 'system';
  type: 'intake' | 'dispatch' | 'diagnosis' | 'probing' | 'part_change' | 'payment' | 'delivery';
}

export interface TestPoint3D {
  id: string;
  name: string;
  stage: number; // 1 to 5
  boardSection: 'sub_board' | 'flex_cable' | 'main_board';
  position3D: [number, number, number];
  wireColor: string;
  expectedVoltage: string;
  measuredVoltage: string;
  readingStatus: 'normal' | 'fault' | 'pending';
  instruction: string;
  schematicNote: string;
}

export interface DeviceRepairTicket {
  id: string;
  ticketNumber: string;
  category: 'smartphone' | 'laptop' | 'tablet';
  brand: string;
  modelName: string;
  deviceColor?: string;
  serialOrImei: string;
  customerName: string;
  customerPhone: string;
  customerNationalId?: string;
  lockType: 'pin' | 'pattern' | 'password' | 'none';
  lockCode?: string;
  symptoms: string[];
  intakeCondition: DeviceIntakeCondition;
  status: TicketStatus;
  currentConsumptionAmp?: number;
  createdAt: string;
  updatedAt: string;
  estimatedCost?: number;
  finalCost?: number;
  paymentStatus?: 'unpaid' | 'paid' | 'deposit';
  technicianNotes?: string;
  diagnosticReport?: DiagnosticReport;
  devicePhotoUrl?: string;
  timeline?: TicketTimelineEvent[];
  testPoints?: TestPoint3D[];
  dispatchedReceipt?: {
    channel: 'sms' | 'whatsapp' | 'telegram';
    sentAt: string;
    trackingUrl: string;
  };
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  email?: string;
  address?: string;
  totalVisits: number;
  totalSpent: number;
  createdAt: string;
  pastRepairs: {
    ticketNumber: string;
    date: string;
    deviceModel: string;
    issue: string;
    cost: number;
    status: TicketStatus;
  }[];
}

export interface RepairSOP {
  id: string;
  title: string;
  deviceModel: string;
  estimatedTimeMin: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  safetyWarnings: string[];
  toolsNeeded: string[];
  steps: {
    stepNumber: number;
    title: string;
    action: string;
    heatOrTorque?: string;
    visualTip?: string;
    criticalCaution?: string;
  }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionFa: string;
  options: { label: string; labelFa: string }[];
  correctIndex: number;
  explanation: string;
  explanationFa: string;
}
