# 🗺️ Live Tracking Implementation Plan

## 📋 Overview

**Live Tracking** allows customers to see their rider's real-time location on a map as they deliver the order. This feature significantly improves customer experience by reducing anxiety about delivery timing and providing transparency.

---

## 🎯 How It Works

### User Flow

```
1. Customer Places Order
   ↓
2. Admin Assigns Rider
   ↓
3. Customer Sees "Track Order" Button
   ↓
4. Opens Live Tracking Page
   ↓
5. Map Shows:
   - Customer's delivery address (🏠 pin)
   - Rider's current location (🏍️ moving pin)
   - Route between them (blue line)
   - Estimated arrival time
   - Rider details (name, phone, photo)
   ↓
6. Updates Every 10-30 seconds
   ↓
7. When Rider Arrives:
   - Push notification
   - "Rider has arrived!" message
```

---

## 🛠️ Technical Architecture

### Components Needed

#### 1. **Backend (API)**
- Rider location storage endpoint
- Rider location retrieval endpoint
- WebSocket server (for real-time updates)
- Distance/ETA calculation service

#### 2. **Frontend (Customer)**
- Map component (Google Maps or Mapbox)
- Live location updates via WebSocket or polling
- Route display
- ETA calculation and display
- Rider info card

#### 3. **Rider App/Dashboard**
- GPS location capture
- Background location tracking
- Location update to server every 10-30 seconds
- Battery optimization

---

## 📱 Implementation Options

### **Option 1: Full Implementation (Best UX)**

**Technology Stack:**
- **Maps**: Google Maps API or Mapbox
- **Real-time**: Socket.io or WebSocket
- **Location**: HTML5 Geolocation API
- **Backend**: MongoDB for location storage

**Pros:**
- ✅ True real-time tracking
- ✅ Smooth experience
- ✅ Professional appearance
- ✅ Battery efficient with WebSockets

**Cons:**
- ⚠️ Requires Google Maps API key (costs money after free tier)
- ⚠️ WebSocket infrastructure needed
- ⚠️ Complex implementation

**Estimated Time**: 2-3 weeks  
**Cost**: $50-200/month (Google Maps API)

---

### **Option 2: Polling-Based (Simple & Cost-Effective)**

**Technology Stack:**
- **Maps**: Leaflet.js (free, open-source)
- **Real-time**: HTTP polling every 15 seconds
- **Location**: HTML5 Geolocation API
- **Backend**: MongoDB + REST API

**Pros:**
- ✅ No ongoing costs (free maps)
- ✅ Simpler implementation
- ✅ Works with existing infrastructure
- ✅ Good enough UX

**Cons:**
- ⚠️ Slight delay (15s polling)
- ⚠️ Higher server load than WebSockets
- ⚠️ Not "true" real-time

**Estimated Time**: 1 week  
**Cost**: Free

---

### **Option 3: SMS-Based (Minimal)**

**Technology Stack:**
- **No maps**: Text-based updates
- **Communication**: SMS notifications
- **Location**: Text descriptions

**Pros:**
- ✅ Works on any phone
- ✅ No app/data required
- ✅ Very simple
- ✅ Low cost

**Cons:**
- ⚠️ Poor UX
- ⚠️ Not visual
- ⚠️ SMS costs add up
- ⚠️ Not competitive

**Estimated Time**: 2-3 days  
**Cost**: SMS fees (₦2-5 per message)

---

## 🚀 Recommended: Option 2 (Polling with Leaflet)

I recommend **Option 2** because:
- ✅ Free and open-source
- ✅ Professional appearance
- ✅ Easy to implement
- ✅ Good enough for MVP

---

## 📦 Step-by-Step Implementation

### Phase 1: Database Schema (1 day)

#### Add to DeliveryPartner Model

```typescript
// models/DeliveryPartner.ts
interface IDeliveryPartner {
  // ... existing fields
  
  // Live Tracking Fields
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number; // in meters
    lastUpdated: Date;
  };
  
  isLocationSharing: boolean; // Privacy toggle
  activeDelivery?: {
    orderId: string;
    customerId: string;
    startTime: Date;
    estimatedArrival?: Date;
  };
}
```

#### Add to Order Model

```typescript
// models/Order.ts
interface IOrder {
  // ... existing fields
  
  // Tracking Fields
  trackingEnabled: boolean;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address: string; // parsed from deliveryAddress
  };
  
  estimatedArrival?: Date;
  actualArrival?: Date;
}
```

---

### Phase 2: Backend API (2 days)

#### 1. Rider Location Update Endpoint

```typescript
// src/app/api/rider/location/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import DeliveryPartner from '@/models/DeliveryPartner';

/**
 * POST /api/rider/location
 * Rider updates their current location
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'rider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { latitude, longitude, accuracy, orderId } = await request.json();

    // Validate coordinates
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Update rider location
    const rider = await DeliveryPartner.findOne({ userId: session.user.id });
    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    rider.currentLocation = {
      latitude,
      longitude,
      accuracy,
      lastUpdated: new Date(),
    };

    if (orderId) {
      // Calculate ETA (optional - can use Google Directions API)
      const estimatedMinutes = calculateETA(
        { latitude, longitude },
        rider.activeDelivery?.destination
      );
      
      rider.activeDelivery = {
        ...rider.activeDelivery,
        estimatedArrival: new Date(Date.now() + estimatedMinutes * 60000),
      };
    }

    await rider.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Location update error:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

// Simple ETA calculation (straight line distance)
function calculateETA(from: any, to: any): number {
  if (!from || !to) return 30; // default 30 mins
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  // Assume average speed of 20 km/h in city traffic
  const minutes = (distance / 20) * 60;
  return Math.ceil(minutes);
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
```

#### 2. Get Rider Location Endpoint

```typescript
// src/app/api/orders/[id]/tracking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Order from '@/models/Order';
import DeliveryPartner from '@/models/DeliveryPartner';

/**
 * GET /api/orders/[id]/tracking
 * Get rider's current location for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get order and verify customer owns it
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.customerId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if order has assigned rider
    if (!order.assignedRider?.riderId) {
      return NextResponse.json(
        { error: 'No rider assigned yet' },
        { status: 400 }
      );
    }

    // Get rider's current location
    const rider = await DeliveryPartner.findById(order.assignedRider.riderId);
    if (!rider || !rider.currentLocation) {
      return NextResponse.json(
        { error: 'Rider location not available' },
        { status: 404 }
      );
    }

    // Check if location is stale (>5 minutes old)
    const locationAge =
      Date.now() - rider.currentLocation.lastUpdated.getTime();
    const isStale = locationAge > 5 * 60 * 1000;

    return NextResponse.json({
      riderLocation: {
        latitude: rider.currentLocation.latitude,
        longitude: rider.currentLocation.longitude,
        accuracy: rider.currentLocation.accuracy,
        lastUpdated: rider.currentLocation.lastUpdated,
        isStale,
      },
      deliveryAddress: order.deliveryAddress,
      riderInfo: {
        name: order.assignedRider.name,
        phone: order.assignedRider.phone,
        image: order.assignedRider.image,
      },
      estimatedArrival: rider.activeDelivery?.estimatedArrival,
    });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to get tracking info' },
      { status: 500 }
    );
  }
}
```

---

### Phase 3: Rider Dashboard - Location Sharing (1 day)

```typescript
// src/app/rider/dashboard/page.tsx (Add to existing)

'use client';

import { useState, useEffect } from 'react';

export default function RiderDashboard() {
  const [locationSharing, setLocationSharing] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Start location sharing
  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        // Send location to server every time it changes
        sendLocationUpdate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000, // Cache for 10 seconds
      }
    );

    setWatchId(id);
    setLocationSharing(true);
  };

  // Stop location sharing
  const stopLocationSharing = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLocationSharing(false);
    }
  };

  // Send location to server
  const sendLocationUpdate = async (coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }) => {
    try {
      await fetch('/api/rider/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coords),
      });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  return (
    <div>
      {/* Location Sharing Toggle */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Location Sharing</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Share your location with customers during deliveries
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {locationSharing
                ? '🟢 Location sharing active'
                : '🔴 Location sharing inactive'}
            </p>
          </div>
          <button
            onClick={locationSharing ? stopLocationSharing : startLocationSharing}
            className={`px-4 py-2 rounded-lg font-medium ${
              locationSharing
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {locationSharing ? 'Stop Sharing' : 'Start Sharing'}
          </button>
        </div>
      </div>

      {/* Rest of dashboard... */}
    </div>
  );
}
```

---

### Phase 4: Customer Tracking Page (2 days)

```typescript
// src/app/orders/[id]/track/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

interface TrackingData {
  riderLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    lastUpdated: string;
    isStale: boolean;
  };
  deliveryAddress: any;
  riderInfo: {
    name: string;
    phone: string;
    image?: string;
  };
  estimatedArrival?: string;
}

export default function TrackOrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mapRef = useRef<any>(null);

  // Fetch tracking data
  const fetchTracking = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/tracking`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load tracking');
        return;
      }

      setTracking(data);
      setError('');
    } catch (err) {
      setError('Failed to load tracking');
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates every 15 seconds
  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Center map on rider location
  useEffect(() => {
    if (tracking && mapRef.current) {
      const map = mapRef.current;
      map.setView(
        [tracking.riderLocation.latitude, tracking.riderLocation.longitude],
        15
      );
    }
  }, [tracking]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchTracking}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!tracking) return null;

  // Rider icon
  const riderIcon = new L.Icon({
    iconUrl: '/rider-icon.png', // Add rider motorcycle icon
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  // Home icon
  const homeIcon = new L.Icon({
    iconUrl: '/home-icon.png', // Add home icon
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  // Calculate route line between rider and destination
  const routeCoordinates: [number, number][] = [
    [tracking.riderLocation.latitude, tracking.riderLocation.longitude],
    // Add destination coordinates here when available
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Map */}
      <div className="h-[60vh] relative">
        <MapContainer
          ref={mapRef}
          center={[tracking.riderLocation.latitude, tracking.riderLocation.longitude]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Rider Marker */}
          <Marker
            position={[tracking.riderLocation.latitude, tracking.riderLocation.longitude]}
            icon={riderIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{tracking.riderInfo.name}</p>
                <p className="text-sm text-gray-600">Your delivery rider</p>
              </div>
            </Popup>
          </Marker>

          {/* Route Line */}
          {routeCoordinates.length > 1 && (
            <Polyline positions={routeCoordinates} color="blue" weight={3} />
          )}
        </MapContainer>

        {/* Refresh Indicator */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-4 py-2">
          <p className="text-sm text-gray-600">
            {tracking.riderLocation.isStale ? (
              <span className="text-orange-600">⚠️ Location outdated</span>
            ) : (
              <span className="text-green-600">🟢 Live</span>
            )}
          </p>
        </div>
      </div>

      {/* Rider Info Card */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            {tracking.riderInfo.image && (
              <img
                src={tracking.riderInfo.image}
                alt={tracking.riderInfo.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-bold">{tracking.riderInfo.name}</h2>
              <p className="text-gray-600">Your delivery rider</p>
            </div>
            <a
              href={`tel:${tracking.riderInfo.phone}`}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              📞 Call
            </a>
          </div>

          {tracking.estimatedArrival && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Estimated Arrival</p>
              <p className="text-2xl font-bold text-blue-600">
                {new Date(tracking.estimatedArrival).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            <p>
              Last updated:{' '}
              {new Date(tracking.riderLocation.lastUpdated).toLocaleTimeString()}
            </p>
            <p className="mt-1">Updates every 15 seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 5: Install Required Packages

```bash
# Install Leaflet (free open-source maps)
npm install leaflet react-leaflet @types/leaflet

# Download marker icons
# Add to /public folder:
# - marker-icon.png
# - marker-icon-2x.png  
# - marker-shadow.png
# - rider-icon.png (motorcycle icon)
# - home-icon.png (house icon)
```

---

## 💰 Cost Analysis

### Option 2 (Recommended - Leaflet + Polling)

| Item | Cost |
|------|------|
| Leaflet Maps | **Free** |
| OpenStreetMap Tiles | **Free** |
| Server (Location storage) | **Included** (MongoDB) |
| API Calls | **Minimal** (15s polling) |
| **Total Monthly Cost** | **₦0 - Free!** |

### Option 1 (Google Maps)

| Item | Cost |
|------|------|
| Google Maps API | Free tier: 28,500 map loads/month |
| Above free tier | $7 per 1,000 loads |
| Directions API | $5 per 1,000 requests |
| **Estimated Monthly Cost** | **$50-200** (depends on usage) |

---

## 🔒 Privacy & Security

### Important Considerations

1. **Rider Consent**: Riders must opt-in to location sharing
2. **Data Retention**: Delete location history after delivery
3. **Customer Privacy**: Only show rider location to their customer
4. **Background Tracking**: Respect rider's off-duty time
5. **Battery Optimization**: Use appropriate polling intervals

### Privacy Controls

```typescript
// Privacy settings for riders
interface RiderPrivacySettings {
  shareLocationDuringDelivery: boolean; // default: true
  shareLocationWhenOffDuty: boolean; // default: false
  locationHistoryRetention: number; // days, default: 1
  accuracyLevel: 'high' | 'balanced' | 'low'; // default: 'balanced'
}
```

---

## 📊 Performance Optimization

### Battery Saving Tips

1. **Adaptive Polling**: 
   - Active delivery: Update every 10s
   - Approaching destination: Every 5s
   - No active delivery: Stop tracking

2. **Location Accuracy**:
   - Use `enableHighAccuracy: false` for battery saving
   - Only enable high accuracy when near destination

3. **Background Mode**:
   - Reduce updates when app in background
   - Wake up only for significant location changes

---

## 🎯 Recommended Implementation Plan

### Week 1: Basic Implementation
- Day 1: Database schema updates
- Day 2-3: Backend API (location endpoints)
- Day 4-5: Rider dashboard (location sharing)

### Week 2: Frontend & Polish
- Day 1-2: Customer tracking page with map
- Day 3: Testing & bug fixes
- Day 4: Performance optimization
- Day 5: Launch!

---

## ✅ Testing Checklist

Before launching live tracking:

- [ ] Rider can enable/disable location sharing
- [ ] Location updates every 15 seconds
- [ ] Map displays correctly on mobile & desktop
- [ ] Rider marker moves smoothly
- [ ] ETA calculation works
- [ ] Stale location warnings show
- [ ] Privacy controls work
- [ ] Battery impact is reasonable
- [ ] Works offline (graceful degradation)
- [ ] Customer can call rider from tracking page

---

## 🚀 Launch Strategy

### Phase 1: Soft Launch (Week 1)
- Enable for 10% of orders
- Gather feedback
- Monitor battery impact
- Fix bugs

### Phase 2: Gradual Rollout (Week 2-3)
- Increase to 50% of orders
- Add rider leaderboard (optional)
- Optimize performance

### Phase 3: Full Launch (Week 4)
- Enable for all orders
- Marketing announcement
- Monitor success metrics

---

## 📈 Success Metrics

Track these KPIs:

1. **Adoption Rate**: % of riders using location sharing
2. **Customer Satisfaction**: Surveys after delivery
3. **Support Tickets**: Reduction in "Where is my order?" calls
4. **Delivery Time Accuracy**: ETA vs actual arrival
5. **Battery Impact**: Average battery drain per hour

**Target**: 
- 80%+ rider adoption
- 20%+ reduction in support calls
- <10% battery drain per hour

---

## 🎁 Future Enhancements

Once basic tracking works:

1. **Breadcrumb Trail**: Show rider's path history
2. **Push Notifications**: "Rider is 5 minutes away!"
3. **In-App Chat**: Customer ↔ Rider messaging
4. **Photo Proof**: Rider takes photo at delivery
5. **Route Optimization**: Suggest fastest route
6. **Multi-Stop**: Handle multiple deliveries
7. **Weather Integration**: Show weather conditions
8. **Traffic Data**: Real-time traffic updates

---

## 💡 Quick Start (Minimal Version)

If you want to start ASAP with minimal effort:

### 30-Minute Implementation

Just add "Track Order" button that shows:
- Rider's phone number (click to call)
- Last known location (text, not map)
- Estimated arrival time
- Order status

**No maps, no real-time, just info.**

Then upgrade to full tracking later when ready.

---

**Ready to implement? Start with Option 2 (Leaflet + Polling)!** 🗺️

