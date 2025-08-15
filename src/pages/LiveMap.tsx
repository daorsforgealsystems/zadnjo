import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Map } from "lucide-react";
import MapView, { Vehicle } from "@/components/MapView";
import { LiveRoute, Anomaly } from "@/lib/types";
import { predictEta } from "@/lib/eta-predictor";
import { detectAnomalies } from "@/lib/anomaly-detector";
import { useQuery } from "@tanstack/react-query";
import { GeoAPI } from "@/lib/api/gateway";

const LiveMap = () => {
  const { t } = useTranslation();
  const [liveRoutes, setLiveRoutes] = useState<LiveRoute[]>([]);
  const { data: vehiclesResp } = useQuery({ queryKey: ['vehicles'], queryFn: GeoAPI.vehicles });

  // Build routes from gateway vehicles for now (mock live routes)
  useEffect(() => {
    if (!vehiclesResp?.data) return;
    const routes: LiveRoute[] = vehiclesResp.data.map(v => ({
      id: v.id,
      from: 'Unknown',
      to: 'Unknown',
      status: v.speed > 0 ? 'In Progress' : 'Stopped',
      progress: 0,
      eta: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      driver: v.id,
      predictedEta: { time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), confidence: 80 },
      anomalies: [],
      currentPosition: { lat: v.lat, lng: v.lng },
      speed: v.speed,
      lastMoved: v.updatedAt,
      plannedRoute: [
        { lat: v.lat, lng: v.lng },
        { lat: v.lat + 0.2, lng: v.lng + 0.2 },
      ],
    }));
    setLiveRoutes(routes);
  }, [vehiclesResp]);

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedRoutes = liveRoutes.map(route => {
        const newPredictedEta = predictEta(route);
        const newAnomaly = detectAnomalies(route);

        let anomalies = route.anomalies;
        if (newAnomaly && !route.anomalies.some(a => a.type === newAnomaly.type)) {
          anomalies = [...route.anomalies, newAnomaly];
        }

        return {
          ...route,
          predictedEta: newPredictedEta,
          anomalies,
        };
      });
      setLiveRoutes(updatedRoutes);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [liveRoutes]);

  const vehicles: Vehicle[] = liveRoutes.map(route => ({
    id: route.id,
    position: [route.currentPosition.lat, route.currentPosition.lng],
    driver: route.driver,
    status: route.status,
    hasAnomaly: route.anomalies.length > 0,
    popupInfo: {
      "Predicted ETA": `${route.predictedEta.time} (Confidence: ${route.predictedEta.confidence}%)`,
      "Anomalies": route.anomalies.map(a => a.type).join(", ") || "None",
    }
  }));

  const routes = liveRoutes.map(route => ({
    id: route.id,
    path: route.plannedRoute.map(p => [p.lat, p.lng] as [number, number]),
  }));

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-background/80 backdrop-blur-sm border-b p-4 z-10">
        <h1 className="text-2xl font-bold flex items-center gradient-text">
          <Map className="mr-2" />
          {t('liveMap.title', 'Live Map Tracking')}
        </h1>
      </header>
      <main className="flex-grow bg-muted relative">
        <MapView
          vehicles={vehicles}
          routes={routes}
        />
      </main>
    </div>
  );
};

export default LiveMap;
