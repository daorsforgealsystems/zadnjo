import { supabase } from './supabaseClient';
import { ROLES } from './types';

// Demo users for testing
export const demoUsers = [
  {
    email: 'admin@daors.com',
    password: 'admin123',
    username: 'Admin User',
    role: ROLES.ADMIN
  },
  {
    email: 'manager@daors.com',
    password: 'manager123',
    username: 'Manager User',
    role: ROLES.MANAGER
  },
  {
    email: 'driver@daors.com',
    password: 'driver123',
    username: 'Driver User',
    role: ROLES.DRIVER
  },
  {
    email: 'client@daors.com',
    password: 'client123',
    username: 'Client User',
    role: ROLES.CLIENT
  }
];

// Demo items for testing
export const demoItems = [
  {
    id: 'item-1',
    name: 'Electronics Package',
    status: 'In Transit',
    location: 'Belgrade, Serbia',
    coordinates: { lat: 44.8176, lng: 20.4633 },
    history: [
      { status: 'Picked up', timestamp: '2024-01-15T08:00:00Z' },
      { status: 'In Transit', timestamp: '2024-01-15T10:30:00Z' }
    ],
    documents: [
      { name: 'Invoice.pdf', url: '/documents/invoice-1.pdf' },
      { name: 'Customs.pdf', url: '/documents/customs-1.pdf' }
    ],
    routeId: 'route-1'
  },
  {
    id: 'item-2',
    name: 'Medical Supplies',
    status: 'Delivered',
    location: 'Zagreb, Croatia',
    coordinates: { lat: 45.8150, lng: 15.9819 },
    history: [
      { status: 'Picked up', timestamp: '2024-01-14T09:00:00Z' },
      { status: 'In Transit', timestamp: '2024-01-14T11:00:00Z' },
      { status: 'Delivered', timestamp: '2024-01-15T14:30:00Z' }
    ],
    documents: [
      { name: 'Medical_Certificate.pdf', url: '/documents/medical-cert-1.pdf' }
    ]
  },
  {
    id: 'item-3',
    name: 'Automotive Parts',
    status: 'Pending',
    location: 'Sarajevo, Bosnia',
    coordinates: { lat: 43.8563, lng: 18.4131 },
    history: [
      { status: 'Order Received', timestamp: '2024-01-16T07:00:00Z' }
    ],
    documents: [],
    routeId: 'route-2'
  }
];

// Demo routes for testing
export const demoRoutes = [
  {
    id: 'route-1',
    from: 'Belgrade, Serbia',
    to: 'Munich, Germany',
    status: 'Active',
    progress: 65,
    eta: '2024-01-17T18:00:00Z',
    driver: 'Marko Petrović',
    predictedEta: {
      time: '2024-01-17T17:45:00Z',
      confidence: 92
    },
    anomalies: [],
    currentPosition: { lat: 45.2671, lng: 19.8335 }, // Novi Sad
    speed: 85,
    lastMoved: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    plannedRoute: [
      { lat: 44.8176, lng: 20.4633 }, // Belgrade
      { lat: 45.2671, lng: 19.8335 }, // Novi Sad
      { lat: 46.0569, lng: 14.5058 }, // Ljubljana
      { lat: 48.1351, lng: 11.5820 }  // Munich
    ]
  },
  {
    id: 'route-2',
    from: 'Sarajevo, Bosnia',
    to: 'Vienna, Austria',
    status: 'Planning',
    progress: 0,
    eta: '2024-01-18T12:00:00Z',
    driver: 'Ana Nikolić',
    predictedEta: {
      time: '2024-01-18T11:30:00Z',
      confidence: 88
    },
    anomalies: [],
    currentPosition: { lat: 43.8563, lng: 18.4131 }, // Sarajevo
    speed: 0,
    lastMoved: new Date().toISOString(),
    plannedRoute: [
      { lat: 43.8563, lng: 18.4131 }, // Sarajevo
      { lat: 45.8150, lng: 15.9819 }, // Zagreb
      { lat: 48.2082, lng: 16.3738 }  // Vienna
    ]
  }
];

export const setupDemoData = async () => {
  try {
    console.log('Setting up demo data...');
    
    // Insert demo items
    const { error: itemsError } = await supabase
      .from('items')
      .upsert(demoItems, { onConflict: 'id' });
    
    if (itemsError) {
      console.error('Error inserting demo items:', itemsError);
    } else {
      console.log('Demo items inserted successfully');
    }

    // Insert demo routes
    const { error: routesError } = await supabase
      .from('routes')
      .upsert(demoRoutes, { onConflict: 'id' });
    
    if (routesError) {
      console.error('Error inserting demo routes:', routesError);
    } else {
      console.log('Demo routes inserted successfully');
    }

    console.log('Demo data setup completed!');
    return { success: true };
  } catch (error) {
    console.error('Error setting up demo data:', error);
    return { success: false, error };
  }
};

// Function to create demo users (call this manually when needed)
export const createDemoUsers = async () => {
  console.log('Demo users available for manual creation:');
  demoUsers.forEach(user => {
    console.log(`${user.role}: ${user.email} / ${user.password}`);
  });
  
  console.log('\nTo create these users, use the signup form in the application or Supabase dashboard.');
};