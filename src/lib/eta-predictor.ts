import { LiveRoute } from "./types";

// This is a placeholder for a real ML model.
// It simulates ETA prediction with some variability.

export const predictEta = (route: LiveRoute): { time: string, confidence: number } => {
    if (route.status === "završena") {
        return { time: "Dostavljeno", confidence: 100 };
    }

    // A very basic simulation of factors affecting ETA
    const now = new Date();
    const hour = now.getHours();

    // Simulate rush hour (7-9 AM and 4-6 PM)
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);

    // Simulate weather effect (random factor)
    const weatherFactor = Math.random(); // 0 to 1

    // Convert ETA string (e.g., "2s 15m") to minutes
    const parts = route.eta.split(" ");
    let baseMinutes = 0;
    parts.forEach(part => {
        if (part.includes('s')) {
            baseMinutes += parseInt(part.replace('s', '')) * 60;
        } else if (part.includes('m')) {
            baseMinutes += parseInt(part.replace('m', ''));
        }
    });

    if (isNaN(baseMinutes)) {
        return { time: route.eta, confidence: 50 }; // fallback
    }

    let variability = 0; // in minutes

    if (isRushHour) {
        variability += baseMinutes * 0.1; // Add up to 10% for rush hour
    }

    if (weatherFactor > 0.8) { // "Bad" weather
        variability += baseMinutes * 0.15 * weatherFactor; // Add up to 15% for weather
    }

    const randomNoise = (Math.random() - 0.5) * 5; // Add +/- 2.5 minutes of random noise

    const newEtaMinutes = baseMinutes - variability + randomNoise;

    const confidence = Math.max(50, 100 - (variability / baseMinutes * 100));

    const hours = Math.floor(newEtaMinutes / 60);
    const minutes = Math.round(newEtaMinutes % 60);

    let newEtaString = "";
    if (hours > 0) {
        newEtaString += `${hours}s `;
    }
    newEtaString += `${minutes}m`;

    return {
        time: newEtaString.trim(),
        confidence: Math.round(confidence),
    };
};
