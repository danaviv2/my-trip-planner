import { useState, useEffect } from 'react';

const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  const applyUpdate = () => window.location.reload();

  return { updateAvailable, applyUpdate };
};

export default useAppUpdate;
