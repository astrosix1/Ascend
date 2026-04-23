/**
 * OfflineIndicator Component
 * Shows a banner when the device is offline, indicating data will sync when back online
 */

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../utils/theme';

interface OfflineIndicatorProps {
  theme?: 'dark' | 'light';
}

export function OfflineIndicator({ theme = 'dark' }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const colors = Colors[theme];

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: '#f39c12', // Orange warning color
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Text style={{ color: '#1A1A1A', fontSize: 12, fontWeight: '600' }}>
        ⚠️ Offline
      </Text>
      <Text style={{ color: '#1A1A1A', fontSize: 12 }}>·</Text>
      <Text style={{ color: '#1A1A1A', fontSize: 12 }}>
        Changes will sync when you're back online
      </Text>
    </View>
  );
}
