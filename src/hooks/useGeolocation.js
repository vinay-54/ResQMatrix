import { useState, useEffect, useCallback } from 'react';

const useGeolocation = () => {
  const [location,  setLocation]  = useState(null);
  const [error,     setError]     = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [watching,  setWatching]  = useState(false);
  const [watchId,   setWatchId]   = useState(null);

  const requestOnce = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this device or browser.');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLoading(false);
      },
      (err) => {
        const messages = {
          1: 'Location access denied. Please allow location permission in your browser.',
          2: 'Location unavailable. GPS or network error.',
          3: 'Location request timed out.',
        };
        setError(messages[err.code] || 'Unable to get location.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watching) return;
    setWatching(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setError(null);
      },
      (err) => {
        const messages = {
          1: 'Location permission denied.',
          2: 'Location signal lost.',
          3: 'Location update timed out.',
        };
        setError(messages[err.code] || 'Location error.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
    setWatchId(id);
  }, [watching]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setWatching(false);
    }
  }, [watchId]);

  useEffect(() => () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); }, [watchId]);

  return { location, error, loading, watching, requestOnce, startWatching, stopWatching };
};

export default useGeolocation;
