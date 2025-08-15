export interface Item {
    id: string;
    name: string;
    status: string;
    location: string;
    coordinates: { lat: number; lng: number };
    history: { status: string; timestamp: string }[];
    documents: { name: string; url: string }[];
    routeId?: string; // To link item to a live route
    predictedEta?: {
        time: string;
        confidence: number;
    };
}

export interface ChartData {
    label: string;
    value: number;
    color: string;
}

export type NotificationType = "anomaly" | "status_change" | "system_message";

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    timestamp: string; // ISO string
    read: boolean;
    relatedId?: string; // e.g., item ID or route ID
}

export interface ChatMessage {
    id: string;
    shipmentId: string;
    userId: string;
    username: string;
    message: string;
    timestamp: string; // ISO string
}
export type AnomalyType = "UNSCHEDULED_STOP" | "ROUTE_DEVIATION" | "SPEED_ANOMALY" | "TEMPERATURE_BREACH";

export interface Anomaly {
    id: string;
    type: AnomalyType;
    timestamp: string;
    severity: "low" | "medium" | "high";
    description: string;
    vehicleId: string;
}

export interface LiveRoute {
    id: string;
    from: string;
    to: string;
    status: string;
    progress: number;
    eta: string;
    driver: string;
    predictedEta: {
        time: string;
        confidence: number; // e.g., 90 for 90%
    };
    anomalies: Anomaly[];
    currentPosition: { lat: number; lng: number };
    speed: number; // in km/h
    lastMoved: string; // ISO string
    plannedRoute: { lat: number; lng: number }[];
}

export interface Metric {
    value: number;
    change: string;
    changeType: "positive" | "negative" | "neutral";
}

export interface MetricData {
    activeShipments: Metric;
    totalRevenue: Metric;
    onTimeDelivery: Metric;
    borderCrossings: Metric;
}

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  DRIVER: 'DRIVER',
  CLIENT: 'CLIENT',
  GUEST: 'GUEST',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export interface User {
  id: string;
  username: string;
  role: Role;
  avatarUrl?: string;
  associatedItemIds?: string[];
}
