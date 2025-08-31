import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(morgan('combined'));

const port = process.env.PORT || 4003;

// In-memory storage for demo purposes (would be database in production)
interface OrderItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateOrderRequest {
  customerId: string;
  items: {
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod?: string;
}

const orders: Order[] = [];
let orderIdCounter = 1;

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'order-service'
  });
});

// Get all orders with pagination and filtering
app.get('/orders', (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      status, 
      customerId,
      fromDate,
      toDate 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Filter orders
    let filteredOrders = [...orders];
    
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    if (customerId) {
      filteredOrders = filteredOrders.filter(order => order.customerId === customerId);
    }
    
    if (fromDate) {
      const fromDateObj = new Date(fromDate as string);
      filteredOrders = filteredOrders.filter(order => new Date(order.createdAt) >= fromDateObj);
    }
    
    if (toDate) {
      const toDateObj = new Date(toDate as string);
      filteredOrders = filteredOrders.filter(order => new Date(order.createdAt) <= toDateObj);
    }

    // Apply pagination
    const paginatedOrders = filteredOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limitNum);

    res.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / limitNum),
        hasNext: pageNum < Math.ceil(filteredOrders.length / limitNum),
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch orders' 
    });
  }
});

// Get order by ID
app.get('/orders/:orderId', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    res.json({ success: true, data: order });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch order' 
    });
  }
});

// Create new order
app.post('/orders', (req: Request, res: Response) => {
  try {
    const orderData: CreateOrderRequest = req.body;

    // Validate required fields
    if (!orderData.customerId || !orderData.items || !orderData.shippingAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: customerId, items, shippingAddress' 
      });
    }

    // Calculate total amount
    const totalAmount = orderData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );

    // Create order items
    const orderItems: OrderItem[] = orderData.items.map((item, index) => ({
      id: `item-${orderIdCounter}-${index}`,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice
    }));

    // Create order
    const now = new Date().toISOString();
    const newOrder: Order = {
      id: `order-${orderIdCounter++}`,
      customerId: orderData.customerId,
      status: 'pending',
      items: orderItems,
      totalAmount,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      paymentStatus: 'pending',
      paymentMethod: orderData.paymentMethod,
      createdAt: now,
      updatedAt: now
    };

    orders.push(newOrder);

    res.status(201).json({ success: true, data: newOrder });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create order' 
    });
  }
});

// Update order status
app.patch('/orders/:orderId/status', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, estimatedDelivery } = req.body;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status is required' 
      });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status' 
      });
    }

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    const order = orders[orderIndex];
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    order.updatedAt = new Date().toISOString();

    res.json({ success: true, data: order });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update order status' 
    });
  }
});

// Update payment status
app.patch('/orders/:orderId/payment', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, paymentMethod } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment status is required' 
      });
    }

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payment status' 
      });
    }

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    const order = orders[orderIndex];
    order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    order.updatedAt = new Date().toISOString();

    res.json({ success: true, data: order });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update payment status' 
    });
  }
});

// Get orders by customer
app.get('/customers/:customerId/orders', (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let customerOrders = orders.filter(o => o.customerId === customerId);
    
    if (status) {
      customerOrders = customerOrders.filter(o => o.status === status);
    }

    const paginatedOrders = customerOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limitNum);

    res.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: customerOrders.length,
        totalPages: Math.ceil(customerOrders.length / limitNum),
        hasNext: pageNum < Math.ceil(customerOrders.length / limitNum),
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customer orders' 
    });
  }
});

// Get order statistics
app.get('/orders/stats', (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodOrders = orders.filter(o => new Date(o.createdAt) >= startDate);

    const ordersByStatus = periodOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRevenue = periodOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      success: true,
      data: {
        totalOrders: periodOrders.length,
        totalRevenue,
        ordersByStatus
      }
    });

  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch order statistics' 
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
  console.log(`Order Service listening on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Add some sample data for demo
  if (orders.length === 0) {
    const sampleOrder: Order = {
      id: 'order-sample-1',
      customerId: 'customer-1',
      status: 'processing',
      items: [
        {
          id: 'item-1',
          sku: 'PROD-001',
          name: 'Logistics Software License',
          quantity: 1,
          unitPrice: 999,
          totalPrice: 999
        }
      ],
      totalAmount: 999,
      shippingAddress: {
        street: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA'
      },
      billingAddress: {
        street: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA'
      },
      paymentStatus: 'paid',
      paymentMethod: 'credit_card',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    orders.push(sampleOrder);
    console.log('Added sample order for demo');
  }
});