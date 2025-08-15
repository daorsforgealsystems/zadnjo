import { supabase } from './supabaseClient';
import { Item, ChartData, LiveRoute, MetricData, Anomaly, Notification, ChatMessage } from "./types";
import { ApiErrorHandler } from './error-handler';

// #############################################################################
// # Direct Data Fetching from Supabase
// #############################################################################

export const getItems = async (): Promise<Item[]> => {
    const { data, error } = await supabase.from('items').select('*');
    if (error) throw error;
    return data || [];
};

export const getLiveRoutes = async (): Promise<LiveRoute[]> => {
    const { data, error } = await supabase.from('routes').select('*');
    if (error) throw error;
    const routes = data || [];
    for (const route of routes) {
        const anomalies = await getAnomalies(route.id);
        route.anomalies = anomalies;
    }
    return routes;
};

export const getAnomalies = async (vehicleId?: string): Promise<Anomaly[]> => {
    let query = supabase.from('anomalies').select('*');
    if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const getNotifications = async (): Promise<Notification[]> => {
    const { data, error } = await supabase.from('notifications').select('*');
    if (error) throw error;
    return data || [];
};

export const getChatMessages = async (shipmentId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('timestamp', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const postChatMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> => {
    const { data, error } = await supabase
        .from('chat_messages')
        .insert(message)
        .select()
        .single();
    if (error) throw error;
    return data;
};


// #############################################################################
// # Aggregated Data (Calculated from fetched data)
// #############################################################################

export const getShipmentData = async (): Promise<ChartData[]> => {
    const items = await getItems();
    const statusCounts = items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Note: Colors and labels are hardcoded to match the original design.
    return [
        { label: "In Transit", value: statusCounts["In Transit"] || 0, color: "bg-primary" },
        { label: "Delivered", value: statusCounts["Delivered"] || 0, color: "bg-success" },
        { label: "Pending", value: statusCounts["Pending"] || 0, color: "bg-warning" },
        { label: "Delayed", value: statusCounts["Delayed"] || 0, color: "bg-destructive" },
    ];
};

// NOTE: The following data is mocked as there are no corresponding tables.
// In a real application, this data would be derived from database tables.

export const getRevenueData = async (): Promise<ChartData[]> => {
    console.warn("getRevenueData is returning mock data.");
    return [
      { label: "Jan", value: 65, color: "bg-primary" },
      { label: "Feb", value: 78, color: "bg-primary" },
      { label: "Mar", value: 92, color: "bg-primary" },
      { label: "Apr", value: 85, color: "bg-primary" },
      { label: "May", value: 99, color: "bg-primary" },
      { label: "Jun", value: 105, color: "bg-primary" }
    ];
};

export const getRouteData = async (): Promise<ChartData[]> => {
    console.warn("getRouteData is returning mock data.");
    return [
      { label: "Srbija-Bosna", value: 35, color: "bg-blue-500" },
      { label: "Hrvatska-Slovenija", value: 28, color: "bg-green-500" },
      { label: "S.Makedonija-Albanija", value: 22, color: "bg-purple-500" },
      { label: "Crna Gora-Kosovo", value: 15, color: "bg-orange-500" }
    ];
};

export const getMetricData = async (): Promise<MetricData> => {
    console.warn("getMetricData is returning mock data.");
    return {
        activeShipments: {
            value: 478,
            change: "+12% from last week",
            changeType: "positive",
        },
        totalRevenue: {
            value: 125840,
            change: "+8.2% from last month",
            changeType: "positive",
        },
        onTimeDelivery: {
            value: 94.8,
            change: "+2.1% improvement",
            changeType: "positive",
        },
        borderCrossings: {
            value: 1247,
            change: "23 active checkpoints",
            changeType: "neutral",
        },
    };
};

// #############################################################################
// # External API Fetching (OSRM for route calculation)
// #############################################################################

export const fetchRoute = async (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    const { lng: fromLng, lat: fromLat } = from;
    const { lng: toLng, lat: toLat } = to;

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch route');
    }

    const data = await response.json();
    return data.routes[0];
};
