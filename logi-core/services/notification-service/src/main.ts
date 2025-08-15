import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const port = process.env.PORT || 4006;

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Notifications (mock queue)
let notifications: any[] = [];

app.post('/notifications', (req, res) => {
  const payload = req.body || {};
  const item = {
    id: `ntf_${Date.now()}`,
    channel: payload.channel || 'in-app',
    to: payload.to,
    title: payload.title,
    message: payload.message,
    createdAt: new Date().toISOString(),
  };
  notifications.push(item);
  res.status(201).json({ success: true, data: item });
});

app.get('/notifications', (_req, res) => {
  res.json({ success: true, data: notifications });
});

app.listen(port, () => {
  console.log(`Notification Service listening on ${port}`);
});