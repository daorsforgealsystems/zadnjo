import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const port = process.env.PORT || 4004;

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Route optimization placeholder
app.post('/routes/optimize', (req, res) => {
  const { stops = [], vehicles = 1 } = req.body || {};
  // Naive assignment: 1 vehicle, preserve order
  const routeId = `route_${Date.now()}`;
  const result = {
    id: routeId,
    vehicles,
    stops: stops.map((s: any, idx: number) => ({ ...s, sequence: idx + 1 })),
    eta: new Date(Date.now() + stops.length * 15 * 60 * 1000).toISOString(),
  };
  res.json({ success: true, data: result });
});

app.listen(port, () => {
  console.log(`Routing Service listening on ${port}`);
});