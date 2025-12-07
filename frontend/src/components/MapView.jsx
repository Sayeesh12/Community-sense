import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapBoundsUpdater = ({ bounds, onBoundsChange }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && onBoundsChange) {
      map.on('moveend', () => {
        const b = map.getBounds();
        onBoundsChange({
          minLng: b.getWest(),
          minLat: b.getSouth(),
          maxLng: b.getEast(),
          maxLat: b.getNorth()
        });
      });
    }
  }, [map, bounds, onBoundsChange]);
  
  return null;
};

export default function MapView({ 
  issues = [], 
  center = [40.7128, -74.0060], 
  zoom = 13,
  onMarkerClick,
  onBoundsChange,
  selectedIssueId
}) {
  const mapRef = useRef(null);

  const getMarkerColor = (status) => {
    const colors = {
      reported: 'gray',
      acknowledged: 'blue',
      in_progress: 'yellow',
      resolved: 'green',
      closed: 'gray'
    };
    return colors[status] || 'gray';
  };

  const createCustomIcon = (status, isSelected = false) => {
    const color = getMarkerColor(status);
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: ${isSelected ? '30px' : '20px'};
        height: ${isSelected ? '30px' : '20px'};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [isSelected ? 30 : 20, isSelected ? 30 : 20],
      iconAnchor: [isSelected ? 15 : 10, isSelected ? 15 : 10]
    });
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {onBoundsChange && (
          <MapBoundsUpdater onBoundsChange={onBoundsChange} />
        )}
        
        {issues.map((issue) => {
          if (!issue.location?.coordinates) return null;
          const [lat, lng] = issue.location.coordinates;
          const isSelected = issue._id === selectedIssueId;
          
          return (
            <Marker
              key={issue._id}
              position={[lng, lat]}
              icon={createCustomIcon(issue.status, isSelected)}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(issue)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm">{issue.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{issue.category}</p>
                  <p className="text-xs text-gray-500 mt-1">Status: {issue.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
