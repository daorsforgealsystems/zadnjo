import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(morgan('combined'));

const port = process.env.PORT || 4006;

// Type definitions
interface Notification {
  id: string;
  type: 'order' | 'shipment' | 'system' | 'alert' | 'info';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  recipient: {
    userId?: string;
    email?: string;
    role?: string;
  };
  read: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, any>;
}

// In-memory storage for notifications (would be database in production)
const notifications: Notification[] = [];
let notificationIdCounter = 1;

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'notification-service',
    totalNotifications: notifications.length
  });
});

// Create a new notification
app.post('/notifications', (req: Request, res: Response) => {
  try {
    const { type, priority, title, message, recipient, metadata } = req.body;

    // Validate required fields
    if (!type || !title || !message || !recipient) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: type, title, message, recipient' 
      });
    }

    const validTypes = ['order', 'shipment', 'system', 'alert', 'info'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid notification type' 
      });
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const notificationPriority = validPriorities.includes(priority) ? priority : 'medium';

    const newNotification: Notification = {
      id: `notification-${notificationIdCounter++}`,
      type,
      priority: notificationPriority,
      title,
      message,
      recipient,
      read: false,
      createdAt: new Date().toISOString(),
      metadata
    };

    notifications.push(newNotification);

    // In a real implementation, this would send actual notifications
    // For now, we'll just log it
    console.log(`Notification created: ${title} for ${recipient.userId || recipient.email}`);

    res.status(201).json({ 
      success: true, 
      data: newNotification 
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create notification' 
    });
  }
});

// Get notifications with filtering and pagination
app.get('/notifications', (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      type, 
      priority, 
      read,
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Filter notifications
    let filteredNotifications = [...notifications];
    
    if (userId) {
      filteredNotifications = filteredNotifications.filter(n => 
        n.recipient.userId === userId
      );
    }
    
    if (type) {
      filteredNotifications = filteredNotifications.filter(n => 
        n.type === type
      );
    }
    
    if (priority) {
      filteredNotifications = filteredNotifications.filter(n => 
        n.priority === priority
      );
    }
    
    if (read !== undefined) {
      const isRead = read === 'true';
      filteredNotifications = filteredNotifications.filter(n => n.read === isRead);
    }

    // Sort by creation date (newest first)
    filteredNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const paginatedNotifications = filteredNotifications.slice(offset, offset + limitNum);

    res.json({
      success: true,
      data: paginatedNotifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredNotifications.length,
        totalPages: Math.ceil(filteredNotifications.length / limitNum),
        hasNext: pageNum < Math.ceil(filteredNotifications.length / limitNum),
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
    });
  }
});

// Get notification by ID
app.get('/notifications/:notificationId', (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    const notification = notifications.find(n => n.id === notificationId);

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    res.json({ success: true, data: notification });

  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notification' 
    });
  }
});

// Mark notification as read
app.patch('/notifications/:notificationId/read', (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    const notification = notifications[notificationIndex];
    notification.read = true;
    notification.readAt = new Date().toISOString();

    res.json({ success: true, data: notification });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark notification as read' 
    });
  }
});

// Mark multiple notifications as read
app.patch('/notifications/read', (req: Request, res: Response) => {
  try {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'notificationIds must be an array' 
      });
    }

    const readNotifications = [];
    const notFoundIds = [];

    for (const id of notificationIds) {
      const notificationIndex = notifications.findIndex(n => n.id === id);
      
      if (notificationIndex !== -1) {
        const notification = notifications[notificationIndex];
        notification.read = true;
        notification.readAt = new Date().toISOString();
        readNotifications.push(notification);
      } else {
        notFoundIds.push(id);
      }
    }

    res.json({ 
      success: true, 
      data: {
        read: readNotifications,
        notFound: notFoundIds
      }
    });

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark notifications as read' 
    });
  }
});

// Get notification statistics
app.get('/notifications/stats', (req: Request, res: Response) => {
  try {
    const stats = notifications.reduce((acc, notification) => {
      // Count by type
      acc.byType[notification.type] = (acc.byType[notification.type] || 0) + 1;
      
      // Count by priority
      acc.byPriority[notification.priority] = (acc.byPriority[notification.priority] || 0) + 1;
      
      // Count read/unread
      acc.byReadStatus[notification.read ? 'read' : 'unread'] = 
        (acc.byReadStatus[notification.read ? 'read' : 'unread'] || 0) + 1;
      
      return acc;
    }, {
      total: notifications.length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byReadStatus: {} as Record<string, number>
    });

    res.json({ success: true, data: stats });

  } catch (error) {
    console.error('Error fetching notification statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notification statistics' 
    });
  }
});

// Delete notification
app.delete('/notifications/:notificationId', (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    notifications.splice(notificationIndex, 1);

    res.json({ success: true, message: 'Notification deleted' });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete notification' 
    });
  }
});

// Error handling middleware
app.use((error: Error, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(port, () => {
  console.log(`Notification Service listening on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Add some sample notifications for demo
  if (notifications.length === 0) {
    const sampleNotifications: Notification[] = [
      {
        id: 'notification-1',
        type: 'order',
        priority: 'high',
        title: 'New Order Received',
        message: 'You have received a new order #ORD-2023-001',
        recipient: { userId: 'user-1' },
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notification-2',
        type: 'shipment',
        priority: 'medium',
        title: 'Shipment Update',
        message: 'Your shipment #SH-2023-001 is out for delivery',
        recipient: { userId: 'user-1' },
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }
    ];
    
    notifications.push(...sampleNotifications);
    console.log('Added sample notifications for demo');
  }
});