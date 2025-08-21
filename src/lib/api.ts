import { supabase } from './supabaseClient';
import { Item, ChartData, LiveRoute, MetricData, Anomaly, Notification, ChatMessage } from "./types";
import { ApiErrorHandler } from './error-handler';
import { getOrderStats } from './api/orders';

// #############################################################################
// # Direct Data Fetching from Supabase
// #############################################################################

export const getItems = async (): Promise<Item[]> => {
    // Use the new items table that will be added to LogiCore schema
    const { data, error } = await supabase
        .from('items')
        .select('id, name, description, status, route_id, created_at');
    if (error) throw error;
    
    // Map to Item interface
    return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        status: item.status || 'pending',
        location: 'In Transit', // Default location
        coordinates: { lat: 44.8176, lng: 20.4633 }, // Default to Belgrade
        history: [{ status: 'created', timestamp: item.created_at }],
        documents: [],
        routeId: item.route_id,
        predictedEta: undefined
    }));
};

export const getLiveRoutes = async (): Promise<LiveRoute[]> => {
    // Use delivery_routes from LogiCore schema
    const { data, error } = await supabase
        .from('delivery_routes')
        .select('id, route_number, status, driver_id, total_distance_km, planned_start, planned_end, actual_start, stops');
    if (error) throw error;
    
    const routes = data || [];
    const liveRoutes: LiveRoute[] = [];
    
    for (const route of routes) {
        const anomalies = await getAnomalies(route.id);
        
        // Parse stops to get from/to locations
        const stops = route.stops ? JSON.parse(route.stops) : [];
        const firstStop = stops[0];
        const lastStop = stops[stops.length - 1];
        
        liveRoutes.push({
            id: route.id,
            from: firstStop?.address || 'Unknown',
            to: lastStop?.address || 'Unknown',
            status: route.status || 'planned',
            progress: route.status === 'completed' ? 100 : (route.actual_start ? 50 : 0),
            eta: route.planned_end || new Date().toISOString(),
            driver: `Driver ${route.driver_id?.slice(0, 8) || 'Unknown'}`,
            predictedEta: {
                time: route.planned_end || new Date().toISOString(),
                confidence: 85
            },
            anomalies,
            currentPosition: { lat: 44.8176, lng: 20.4633 }, // Default position
            speed: 60, // Default speed
            lastMoved: new Date().toISOString(),
            plannedRoute: [{ lat: 44.8176, lng: 20.4633 }] // Default route
        });
    }
    
    return liveRoutes;
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

export const getMetricData = async (
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<MetricData> => {
    // Support different timeframes, use getOrderStats for revenue summary and additional queries for deltas
    const calcPeriodRanges = (tf: string) => {
        const now = new Date();
    const startCurr = new Date(now);
        switch (tf) {
            case 'day': startCurr.setDate(now.getDate() - 1); break;
            case 'week': startCurr.setDate(now.getDate() - 7); break;
            case 'month': startCurr.setMonth(now.getMonth() - 1); break;
            case 'year': startCurr.setFullYear(now.getFullYear() - 1); break;
            default: startCurr.setMonth(now.getMonth() - 1);
        }
        const endCurr = now;
        const startPrev = new Date(startCurr);
        switch (tf) {
            case 'day': startPrev.setDate(startCurr.getDate() - 1); break;
            case 'week': startPrev.setDate(startCurr.getDate() - 7); break;
            case 'month': startPrev.setMonth(startCurr.getMonth() - 1); break;
            case 'year': startPrev.setFullYear(startCurr.getFullYear() - 1); break;
        }
        const endPrev = new Date(startCurr);
        return { startCurr, endCurr, startPrev, endPrev };
    };

    try {
        const { startCurr, endCurr, startPrev, endPrev } = calcPeriodRanges(timeframe);

        // Active shipments: current count of items in active statuses
        const { data: itemsData, error: itemsError } = await supabase
            .from('items')
            .select('id, status');
        if (itemsError) throw itemsError;
        const items = (itemsData as { id: string; status: string }[]) || [];
        const activeStatuses = ['in_transit', 'processing', 'shipped'];
        const activeCount = items.filter((item) => activeStatuses.includes(item.status)).length;

        // Revenue: use getOrderStats for current period
    const stats = await getOrderStats(timeframe);
        const totalRevenueValue = stats?.totalRevenue || 0;

        // Revenue previous period: sum orders in previous range
        let prevRevenue = 0;
        try {
            const { data: prevOrders, error: prevErr } = await supabase
                .from('orders')
                .select('total_amount')
                .gte('created_at', startPrev.toISOString())
                .lt('created_at', endPrev.toISOString());
            if (!prevErr && prevOrders) prevRevenue = (prevOrders as { total_amount?: number }[]).reduce((s: number, o) => s + (o.total_amount || 0), 0);
        } catch (e) {
            console.warn('getMetricData: orders table not found, using fallback data', e);
            // Fallback: use mock data if orders table doesn't exist
            prevRevenue = 0;
        }
        const revenueChange = prevRevenue > 0
            ? `${(Math.round(((totalRevenueValue - prevRevenue) / prevRevenue) * 1000) / 10)}% from last period`
            : (totalRevenueValue > 0 ? 'No previous data' : '');

        // On-time delivery: delivered orders in current period
        let onTimeRate = 0;
        let prevOnTimeRate = 0;
        try {
            const { data: delivered, error: deliveredErr } = await supabase
                .from('orders')
                .select('estimated_delivery, actual_delivery')
                .eq('status', 'delivered')
                .gte('created_at', startCurr.toISOString())
                .lte('created_at', endCurr.toISOString());
            if (!deliveredErr && delivered && delivered.length > 0) {
                const totalDelivered = delivered.length;
                const onTimeCount = (delivered as { estimated_delivery?: string; actual_delivery?: string }[]).reduce((acc: number, ord) => {
                    if (!ord.estimated_delivery || !ord.actual_delivery) return acc;
                    return acc + (new Date(ord.actual_delivery).getTime() <= new Date(ord.estimated_delivery).getTime() ? 1 : 0);
                }, 0);
                onTimeRate = Math.round((onTimeCount / totalDelivered) * 1000) / 10;
            }

            // previous period
            const { data: prevDelivered, error: prevDeliveredErr } = await supabase
                .from('orders')
                .select('estimated_delivery, actual_delivery')
                .eq('status', 'delivered')
                .gte('created_at', startPrev.toISOString())
                .lt('created_at', endPrev.toISOString());
            if (!prevDeliveredErr && prevDelivered && prevDelivered.length > 0) {
                const totalPrev = prevDelivered.length;
                const onTimePrevCount = (prevDelivered as { estimated_delivery?: string; actual_delivery?: string }[]).reduce((acc: number, ord) => {
                    if (!ord.estimated_delivery || !ord.actual_delivery) return acc;
                    return acc + (new Date(ord.actual_delivery).getTime() <= new Date(ord.estimated_delivery).getTime() ? 1 : 0);
                }, 0);
                prevOnTimeRate = Math.round((onTimePrevCount / totalPrev) * 1000) / 10;
            }
        } catch (e) {
            console.warn('getMetricData: orders table not found for on-time delivery calculation, using fallback', e);
            // Fallback: use mock data based on items table
            onTimeRate = 85.5; // Mock on-time delivery rate
            prevOnTimeRate = 82.3; // Mock previous rate
        }
        const onTimeChange = prevOnTimeRate > 0 ? `${(Math.round((onTimeRate - prevOnTimeRate) * 10) / 10)}% vs prev` : '';

        // Border crossings: approximate via route stops count (using LogiCore schema)
        let borderCrossingsValue = 0;
        try {
            const { data: routeStops, error: stopsErr } = await supabase
                .from('route_stops')
                .select('id');
            if (!stopsErr && routeStops) borderCrossingsValue = routeStops.length;
        } catch (e) {
            console.warn('getMetricData: failed to compute borderCrossings', e);
        }

        return {
            activeShipments: {
                value: activeCount,
                change: '',
                changeType: 'positive',
            },
            totalRevenue: {
                value: totalRevenueValue,
                change: revenueChange,
                changeType: totalRevenueValue >= prevRevenue ? 'positive' : 'negative',
            },
            onTimeDelivery: {
                value: onTimeRate,
                change: onTimeChange,
                changeType: onTimeRate >= prevOnTimeRate ? 'positive' : 'negative',
            },
            borderCrossings: {
                value: borderCrossingsValue,
                change: '',
                changeType: 'neutral',
            },
        };
    } catch (err) {
        ApiErrorHandler.handle(err, 'getMetricData');
        return {
            activeShipments: { value: 0, change: '', changeType: 'neutral' },
            totalRevenue: { value: 0, change: '', changeType: 'neutral' },
            onTimeDelivery: { value: 0, change: '', changeType: 'neutral' },
            borderCrossings: { value: 0, change: '', changeType: 'neutral' },
        };
    }
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
