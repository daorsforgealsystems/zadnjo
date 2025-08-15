import { supabase } from '../supabaseClient';

// Types
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  shipmentId?: string;
  invoiceId?: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  notes?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderFilters {
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  } | null;
  customer?: string;
  search?: string;
  paymentStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

/**
 * Fetch orders with optional filtering
 */
export const getOrders = async (filters?: OrderFilters): Promise<Order[]> => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `);

  // Apply filters if provided
  if (filters) {
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      query = query.eq('payment_status', filters.paymentStatus);
    }
    
    if (filters.customer && filters.customer.trim() !== '') {
      query = query.or(`customer_id.eq.${filters.customer},customer_name.ilike.%${filters.customer}%`);
    }
    
    if (filters.search && filters.search.trim() !== '') {
      query = query.or(`
        order_number.ilike.%${filters.search}%,
        customer_name.ilike.%${filters.search}%,
        notes.ilike.%${filters.search}%
      `);
    }
    
    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }
    
    // Apply sorting
    if (filters.sortBy) {
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    // Apply pagination
    if (filters.page !== undefined && filters.pageSize !== undefined) {
      const from = filters.page * filters.pageSize;
      const to = from + filters.pageSize - 1;
      query = query.range(from, to);
    }
  } else {
    // Default sorting by creation date (newest first)
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
  
  // Transform the data to match our interface
  return (data || []).map(order => ({
    id: order.id,
    orderNumber: order.order_number,
    customerId: order.customer_id,
    customerName: order.customer_name,
    status: order.status,
    items: order.items.map((item: any) => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      weight: item.weight,
      dimensions: item.dimensions,
      notes: item.notes
    })),
    totalAmount: order.total_amount,
    currency: order.currency,
    shippingAddress: order.shipping_address,
    billingAddress: order.billing_address,
    paymentStatus: order.payment_status,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    estimatedDelivery: order.estimated_delivery,
    actualDelivery: order.actual_delivery,
    shipmentId: order.shipment_id,
    invoiceId: order.invoice_id,
    notes: order.notes
  }));
};

/**
 * Fetch a single order by ID
 */
export const getOrder = async (id: string): Promise<Order> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching order ${id}:`, error);
    throw error;
  }
  
  // Transform the data to match our interface
  return {
    id: data.id,
    orderNumber: data.order_number,
    customerId: data.customer_id,
    customerName: data.customer_name,
    status: data.status,
    items: data.items.map((item: any) => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      weight: item.weight,
      dimensions: item.dimensions,
      notes: item.notes
    })),
    totalAmount: data.total_amount,
    currency: data.currency,
    shippingAddress: data.shipping_address,
    billingAddress: data.billing_address,
    paymentStatus: data.payment_status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    estimatedDelivery: data.estimated_delivery,
    actualDelivery: data.actual_delivery,
    shipmentId: data.shipment_id,
    invoiceId: data.invoice_id,
    notes: data.notes
  };
};

/**
 * Create a new order
 */
export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
  // Generate order number
  const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Extract items to insert separately
  const items = orderData.items || [];
  
  // Prepare order data for insertion
  const orderToInsert = {
    order_number: orderNumber,
    customer_id: orderData.customerId,
    customer_name: orderData.customerName,
    status: orderData.status || 'pending',
    total_amount: orderData.totalAmount,
    currency: orderData.currency,
    shipping_address: orderData.shippingAddress,
    billing_address: orderData.billingAddress,
    payment_status: orderData.paymentStatus || 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    estimated_delivery: orderData.estimatedDelivery,
    notes: orderData.notes
  };
  
  // Start a transaction
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderToInsert)
    .select()
    .single();
  
  if (orderError) {
    console.error('Error creating order:', orderError);
    throw orderError;
  }
  
  // Insert order items
  if (items.length > 0) {
    const itemsToInsert = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      weight: item.weight,
      dimensions: item.dimensions,
      notes: item.notes
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);
    
    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw itemsError;
    }
  }
  
  // Fetch the complete order with items
  return getOrder(order.id);
};

/**
 * Update an existing order
 */
export const updateOrder = async (orderData: Partial<Order> & { id: string }): Promise<Order> => {
  const { id, items, ...orderToUpdate } = orderData;
  
  // Convert to snake_case for the database
  const dbOrderData: any = {};
  
  if (orderToUpdate.status !== undefined) dbOrderData.status = orderToUpdate.status;
  if (orderToUpdate.customerName !== undefined) dbOrderData.customer_name = orderToUpdate.customerName;
  if (orderToUpdate.totalAmount !== undefined) dbOrderData.total_amount = orderToUpdate.totalAmount;
  if (orderToUpdate.currency !== undefined) dbOrderData.currency = orderToUpdate.currency;
  if (orderToUpdate.shippingAddress !== undefined) dbOrderData.shipping_address = orderToUpdate.shippingAddress;
  if (orderToUpdate.billingAddress !== undefined) dbOrderData.billing_address = orderToUpdate.billingAddress;
  if (orderToUpdate.paymentStatus !== undefined) dbOrderData.payment_status = orderToUpdate.paymentStatus;
  if (orderToUpdate.estimatedDelivery !== undefined) dbOrderData.estimated_delivery = orderToUpdate.estimatedDelivery;
  if (orderToUpdate.actualDelivery !== undefined) dbOrderData.actual_delivery = orderToUpdate.actualDelivery;
  if (orderToUpdate.shipmentId !== undefined) dbOrderData.shipment_id = orderToUpdate.shipmentId;
  if (orderToUpdate.invoiceId !== undefined) dbOrderData.invoice_id = orderToUpdate.invoiceId;
  if (orderToUpdate.notes !== undefined) dbOrderData.notes = orderToUpdate.notes;
  
  // Always update the updated_at timestamp
  dbOrderData.updated_at = new Date().toISOString();
  
  // Update the order
  const { error: orderError } = await supabase
    .from('orders')
    .update(dbOrderData)
    .eq('id', id);
  
  if (orderError) {
    console.error(`Error updating order ${id}:`, orderError);
    throw orderError;
  }
  
  // Update items if provided
  if (items && items.length > 0) {
    // First, delete existing items
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);
    
    if (deleteError) {
      console.error(`Error deleting items for order ${id}:`, deleteError);
      throw deleteError;
    }
    
    // Then, insert new items
    const itemsToInsert = items.map(item => ({
      order_id: id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      weight: item.weight,
      dimensions: item.dimensions,
      notes: item.notes
    }));
    
    const { error: insertError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);
    
    if (insertError) {
      console.error(`Error inserting items for order ${id}:`, insertError);
      throw insertError;
    }
  }
  
  // Fetch the updated order
  return getOrder(id);
};

/**
 * Delete an order
 */
export const deleteOrder = async (id: string): Promise<void> => {
  // First delete the order items (due to foreign key constraints)
  const { error: itemsError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', id);
  
  if (itemsError) {
    console.error(`Error deleting items for order ${id}:`, itemsError);
    throw itemsError;
  }
  
  // Then delete the order
  const { error: orderError } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);
  
  if (orderError) {
    console.error(`Error deleting order ${id}:`, orderError);
    throw orderError;
  }
};

/**
 * Get order history/timeline
 */
export const getOrderHistory = async (id: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('order_history')
    .select('*')
    .eq('order_id', id)
    .order('timestamp', { ascending: false });
  
  if (error) {
    console.error(`Error fetching history for order ${id}:`, error);
    throw error;
  }
  
  return data || [];
};

/**
 * Add an event to the order history
 */
export const addOrderHistoryEvent = async (
  orderId: string,
  event: string,
  details?: any
): Promise<void> => {
  const { error } = await supabase
    .from('order_history')
    .insert({
      order_id: orderId,
      event,
      details,
      timestamp: new Date().toISOString()
    });
  
  if (error) {
    console.error(`Error adding history event for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: Order['status'],
  notes?: string
): Promise<Order> => {
  // Update the order status
  const { error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);
  
  if (error) {
    console.error(`Error updating status for order ${orderId}:`, error);
    throw error;
  }
  
  // Add a history event
  await addOrderHistoryEvent(
    orderId,
    `Status changed to ${status}`,
    { notes }
  );
  
  // Return the updated order
  return getOrder(orderId);
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: Order['paymentStatus'],
  transactionId?: string
): Promise<Order> => {
  // Update the payment status
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);
  
  if (error) {
    console.error(`Error updating payment status for order ${orderId}:`, error);
    throw error;
  }
  
  // Add a history event
  await addOrderHistoryEvent(
    orderId,
    `Payment status changed to ${paymentStatus}`,
    { transactionId }
  );
  
  // Return the updated order
  return getOrder(orderId);
};

/**
 * Get order statistics
 */
export const getOrderStats = async (
  timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<OrderStats> => {
  // Calculate the start date based on the timeframe
  const startDate = new Date();
  switch (timeframe) {
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }
  
  // Fetch orders within the timeframe
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total_amount')
    .gte('created_at', startDate.toISOString());
  
  if (error) {
    console.error('Error fetching order statistics:', error);
    throw error;
  }
  
  const orders = data || [];
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Count orders by status
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const processingOrders = orders.filter(order => order.status === 'processing').length;
  const shippedOrders = orders.filter(order => order.status === 'shipped').length;
  const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
  const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
  
  return {
    totalOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    averageOrderValue
  };
};

/**
 * Get customers with orders
 */
export const getCustomersWithOrders = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('customer_id, customer_name')
    .order('customer_name');
  
  if (error) {
    console.error('Error fetching customers with orders:', error);
    throw error;
  }
  
  // Remove duplicates
  const uniqueCustomers = Array.from(
    new Map(data.map(item => [item.customer_id, item])).values()
  );
  
  return uniqueCustomers;
};

export default {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderHistory,
  addOrderHistoryEvent,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
  getCustomersWithOrders
};