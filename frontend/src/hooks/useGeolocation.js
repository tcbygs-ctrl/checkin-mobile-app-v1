import { useState, useCallback } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation not supported';
        setError(err);
        return reject(err);
      }
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
          setLocation(loc);
          setLoading(false);
          resolve(loc);
        },
        (err) => {
          const msg = err.code === 1 ? 'กรุณาอนุญาตการเข้าถึงตำแหน่ง' : 'ไม่สามารถรับตำแหน่งได้';
          setError(msg);
          setLoading(false);
          reject(msg);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  return { location, error, loading, getLocation };
}
