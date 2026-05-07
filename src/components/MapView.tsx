import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Truck, MapPin, Navigation, Loader2 } from 'lucide-react';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    coordinates: [number, number];
    popup?: string;
    type?: 'pickup' | 'delivery' | 'driver';
  }>;
  showDriverLocation?: boolean;
  driverLocation?: [number, number];
  route?: Array<[number, number]>;
  estimatedTime?: number;
  onLocationSelect?: (coordinates: [number, number], address: string) => void;
  readonly?: boolean;
  className?: string;
  loading?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ 
  center = [15.2663, -4.4419], 
  zoom = 12,
  markers = [],
  showDriverLocation = false,
  driverLocation,
  route = [],
  estimatedTime,
  onLocationSelect,
  readonly = false,
  className = '',
  loading = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { token } = useMapboxToken();
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;
    
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom
    });

    map.current = mapInstance;

    // Add navigation control
    mapInstance.addControl(new mapboxgl.NavigationControl());

    // Add geolocate control
    if (!readonly) {
      mapInstance.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        })
      );
    }

    // Handle click for location selection
    if (onLocationSelect && !readonly) {
      mapInstance.on('click', async (e) => {
        const coordinates = e.lngLat.toArray() as [number, number];
        
        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${token}&language=fr`
          );
          const data = await response.json();
          const address = data.features[0]?.place_name_fr || data.features[0]?.place_name || 'Adresse inconnue';
          
          setSelectedAddress(address);
          onLocationSelect(coordinates, address);
        } catch (error) {
          console.error('Error getting address:', error);
          onLocationSelect(coordinates, 'Adresse inconnue');
        }
      });
    }

    return () => {
      mapInstance.remove();
    };
  }, [token, center, zoom, onLocationSelect, readonly]);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.custom-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add new markers
    markers.forEach((marker) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      
      if (marker.type === 'pickup') {
        markerElement.innerHTML = `
          <div class="w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <div class="w-3 h-3 bg-white rounded-full"></div>
          </div>
        `;
      } else if (marker.type === 'delivery') {
        markerElement.innerHTML = `
          <div class="w-10 h-10 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <div class="w-3 h-3 bg-white rounded-full"></div>
          </div>
        `;
      } else {
        markerElement.innerHTML = `
          <div class="w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-2 h-2 bg-white rounded-full"></div>
          </div>
        `;
      }
      
      new mapboxgl.Marker(markerElement)
        .setLngLat(marker.coordinates)
        .setPopup(marker.popup ? new mapboxgl.Popup().setHTML(marker.popup) : undefined)
        .addTo(map.current);
    });
  }, [markers]);

  // Update driver location and route
  useEffect(() => {
    if (!map.current) return;

    // Update driver location
    if (showDriverLocation && driverLocation) {
      // Remove existing driver marker
      const existingDriver = document.querySelector('.driver-marker');
      if (existingDriver) existingDriver.remove();

      const driverElement = document.createElement('div');
      driverElement.className = 'driver-marker';
      driverElement.innerHTML = `
        <div class="relative">
          <div class="w-12 h-12 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-1-1h-3z"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-500"></div>
        </div>
      `;
      
      new mapboxgl.Marker(driverElement)
        .setLngLat(driverLocation)
        .addTo(map.current);
    }

    // Draw route
    if (route && route.length > 1) {
      // Remove existing route
      if (map.current.getLayer('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }

      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3B82F6',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    }
  }, [showDriverLocation, driverLocation, route]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded-xl`}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded-xl text-sm text-muted-foreground`}>
        Carte indisponible
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-xl overflow-hidden"
      />
      
      {/* Controls overlay */}
      {!readonly && (
        <div className="absolute top-4 right-4 z-10 space-y-2">
          <button
            onClick={() => setIsSelectingLocation(!isSelectingLocation)}
            className={`p-3 bg-white rounded-lg shadow-lg border ${
              isSelectingLocation ? 'bg-primary text-white' : 'hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Estimated time display */}
      {estimatedTime && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 border">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Arrivée estimée: {estimatedTime} min</span>
          </div>
        </div>
      )}

      {/* Selected address display */}
      {selectedAddress && onLocationSelect && (
        <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 border max-w-xs">
          <p className="text-sm font-medium">{selectedAddress}</p>
        </div>
      )}

      {/* Location selection indicator */}
      {isSelectingLocation && (
        <div className="absolute top-4 left-4 z-10 bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-xs">
          <p className="text-sm text-yellow-800">
            Cliquez sur la carte pour sélectionner une adresse
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;
