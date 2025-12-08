import React, { useState, useEffect, useRef } from 'react';

export default function LocationInput({ value, onChange, error, touched }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    // Set initial query if value exists
    if (value && value.lat && value.lng && !query) {
      setQuery(`${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`);
    }
  }, [value]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const geocodeLocation = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) geocoding API - free, no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            'User-Agent': 'CivicSolve/1.0' // Required by Nominatim
          }
        }
      );
      const data = await response.json();
      
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    geocodeLocation(newQuery);
  };

  const handleSelectSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    onChange({
      lat,
      lng
    });
    
    setQuery(suggestion.display_name || `${suggestion.name}, ${suggestion.address?.city || suggestion.address?.town || ''}`);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onChange({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setQuery(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        },
        (error) => {
          alert('Unable to get your location: ' + error.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2 mb-2">
        <input
          ref={inputRef}
          type="text"
          className="input flex-1"
          placeholder="Type location (e.g., 'Main Street, New York' or '40.7128, -74.0060')"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="btn-secondary text-sm whitespace-nowrap"
        >
          Use My Location
        </button>
      </div>

      {value && value.lat && value.lng && (
        <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded mb-2">
          Location set: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
            >
              <div className="font-medium text-sm">{suggestion.display_name}</div>
              {suggestion.address && (
                <div className="text-xs text-gray-500">
                  {suggestion.address.city || suggestion.address.town || suggestion.address.village || ''}
                  {suggestion.address.country && `, ${suggestion.address.country}`}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-gray-500 mt-1">Searching locations...</div>
      )}

      {touched && error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {typeof error === 'string' ? error : 'Location is required'}
        </p>
      )}
    </div>
  );
}

