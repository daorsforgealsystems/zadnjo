import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize Prisma client for database operations
const prisma = new PrismaClient();
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize Prisma client for database operations
const prisma = new PrismaClient();

const port = process.env.PORT || 4005;

// Health check endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// In-memory store for active vehicles (would be DB in production)
const vehicles = [
  { 
    id: 'v1', 
    name: 'Truck 1',
    type: 'delivery',
    lat: 44.787197, 
    lng: 20.457273, 
    speed: 72, 
    heading: 45,
    status: 'active',
    driverId: 'd1',
    fuelLevel: 75,
    temperature: 4.5,
    lastMaintenance: '2023-10-15',
    updatedAt: new Date().toISOString() 
  },
  { 
    id: 'v2', 
    name: 'Van 2',
    type: 'courier',
    lat: 45.815399, 
    lng: 15.966568, 
    speed: 0, 
    heading: 90,
    status: 'idle',
    driverId: 'd2',
    fuelLevel: 45,
    temperature: null,
    lastMaintenance: '2023-11-20',
    updatedAt: new Date().toISOString() 
  },
  { 
    id: 'v3', 
    name: 'Refrigerated Truck',
    type: 'refrigerated',
    lat: 44.815399, 
    lng: 20.366568, 
    speed: 65, 
    heading: 180,
    status: 'active',
    driverId: 'd3',
    fuelLevel: 60,
    temperature: -18.5,
    lastMaintenance: '2023-12-05',
    updatedAt: new Date().toISOString() 
  },
];

// Historical position data (would be DB in production)
const positionHistory = {};
vehicles.forEach(vehicle => {
  positionHistory[vehicle.id] = Array.from({ length: 20 }).map((_, i) => ({
    lat: vehicle.lat - i * 0.005 * Math.cos(vehicle.heading * Math.PI / 180),
    lng: vehicle.lng - i * 0.005 * Math.sin(vehicle.heading * Math.PI / 180),
    speed: Math.max(0, vehicle.speed - (i * 5 * Math.random())),
    ts: new Date(Date.now() - i * 60000).toISOString(),
  }));
});

// REST API endpoints
app.get('/tracking/vehicles', async (_req, res) => {
  try {
    // In production, this would fetch from database
    // const dbVehicles = await prisma.vehicle.findMany();
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vehicles' });
  }
});

app.get('/tracking/vehicles/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }
    
    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error(`Error fetching vehicle ${req.params.vehicleId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch vehicle' });
  }
});

app.get('/tracking/positions/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { limit = 10, from, to } = req.query;
    
    // In production, this would query the database with filters
    const history = positionHistory[vehicleId] || [];
    let filteredHistory = [...history];
    
    if (from) {
      filteredHistory = filteredHistory.filter(pos => new Date(pos.ts) >= new Date(from as string));
    }
    
    if (to) {
      filteredHistory = filteredHistory.filter(pos => new Date(pos.ts) <= new Date(to as string));
    }
    
    const limitedHistory = filteredHistory.slice(0, Number(limit));
    
    res.json({ 
      success: true, 
      data: { 
        vehicleId, 
        track: limitedHistory 
      } 
    });
  } catch (error) {
    console.error(`Error fetching positions for vehicle ${req.params.vehicleId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch position history' });
  }
});

// POST endpoint to update vehicle position (for testing)
app.post('/tracking/update', (req, res) => {
  try {
    const { vehicleId, lat, lng, speed, heading } = req.body;
    
    if (!vehicleId || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const vehicleIndex = vehicles.findIndex(v => v.id === vehicleId);
    if (vehicleIndex === -1) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }
    
    // Update vehicle position
    const updatedAt = new Date().toISOString();
    vehicles[vehicleIndex] = {
      ...vehicles[vehicleIndex],
      lat,
      lng,
      speed: speed !== undefined ? speed : vehicles[vehicleIndex].speed,
      heading: heading !== undefined ? heading : vehicles[vehicleIndex].heading,
      updatedAt
    };
    
    // Add to position history
    if (!positionHistory[vehicleId]) {
      positionHistory[vehicleId] = [];
    }
    
    positionHistory[vehicleId].unshift({
      lat,
      lng,
      speed: vehicles[vehicleIndex].speed,
      ts: updatedAt
    });
    
    // Limit history size
    if (positionHistory[vehicleId].length > 100) {
      positionHistory[vehicleId] = positionHistory[vehicleId].slice(0, 100);
    }
    
    // Emit update via WebSocket
    io.emit('vehicle:update', vehicles[vehicleIndex]);
    
    res.json({ success: true, data: vehicles[vehicleIndex] });
  } catch (error) {
    console.error('Error updating vehicle position:', error);
    res.status(500).json({ success: false, error: 'Failed to update vehicle position' });
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Send initial vehicle data to new client
  socket.emit('vehicles:initial', vehicles);
  
  // Handle client subscribing to specific vehicle updates
  socket.on('subscribe:vehicle', (vehicleId) => {
    console.log(`Client ${socket.id} subscribed to vehicle ${vehicleId}`);
    socket.join(`vehicle:${vehicleId}`);
  });
  
  // Handle client unsubscribing from vehicle updates
  socket.on('unsubscribe:vehicle', (vehicleId) => {
    console.log(`Client ${socket.id} unsubscribed from vehicle ${vehicleId}`);
    socket.leave(`vehicle:${vehicleId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Simulate vehicle movement for demo purposes
function simulateVehicleMovement() {
  vehicles.forEach((vehicle, index) => {
    if (vehicle.status === 'active' && vehicle.speed > 0) {
      // Calculate new position based on heading and speed
      const speedFactor = vehicle.speed / 3600; // km/h to km/s * update interval
      const latChange = speedFactor * 0.01 * Math.cos(vehicle.heading * Math.PI / 180);
      const lngChange = speedFactor * 0.01 * Math.sin(vehicle.heading * Math.PI / 180);
      
      // Update vehicle position
      vehicles[index] = {
        ...vehicle,
        lat: vehicle.lat + latChange,
        lng: vehicle.lng + lngChange,
        speed: vehicle.speed + (Math.random() * 10 - 5), // Slight speed variations
        updatedAt: new Date().toISOString()
      };
      
      // Ensure speed stays within reasonable bounds
      vehicles[index].speed = Math.max(0, Math.min(120, vehicles[index].speed));
      
      // Add to position history
      if (!positionHistory[vehicle.id]) {
        positionHistory[vehicle.id] = [];
      }
      
      positionHistory[vehicle.id].unshift({
        lat: vehicles[index].lat,
        lng: vehicles[index].lng,
        speed: vehicles[index].speed,
        ts: vehicles[index].updatedAt
      });
      
      // Limit history size
      if (positionHistory[vehicle.id].length > 100) {
        positionHistory[vehicle.id] = positionHistory[vehicle.id].slice(0, 100);
      }
      
      // Emit update via WebSocket
      io.emit('vehicle:update', vehicles[index]);
      io.to(`vehicle:${vehicle.id}`).emit('vehicle:detailed-update', {
        ...vehicles[index],
        fuelLevel: vehicles[index].fuelLevel - 0.01, // Simulate fuel consumption
      });
    }
  });
}

// Start simulation interval
const simulationInterval = setInterval(simulateVehicleMovement, 5000);

// Cleanup on server shutdown
process.on('SIGINT', () => {
  clearInterval(simulationInterval);
  prisma.$disconnect();
  process.exit(0);
});

// Start the server
server.listen(port, () => {
  console.log(`Geolocation Service listening on port ${port}`);
  console.log(`WebSocket server initialized`);
});