/**
 * SyncStatusIndicator Component
 * Displays sync status with minimalist badge showing cloud sync state
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useApp } from '../contexts/AppContext';

interface SyncStatusIndicatorProps {
  onPress?: () => void;
}

// Helper to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return 'long ago';
}

export function SyncStatusIndicator({ onPress }: SyncStatusIndicatorProps) {
  const { isSyncing, lastSyncTime, syncError, currentUserId } = useApp();

  const statusInfo = useMemo(() => {
    if (!currentUserId) {
      return {
        icon: '○',
        label: 'Guest Mode',
        color: '#999',
        visible: false,
      };
    }

    if (syncError) {
      return {
        icon: '⚠️',
        label: 'Sync Failed',
        color: '#e74c3c',
        visible: true,
      };
    }

    if (isSyncing) {
      return {
        icon: '☁️',
        label: 'Syncing...',
        color: '#3498db',
        visible: true,
        isLoading: true,
      };
    }

    if (lastSyncTime) {
      const timeAgo = formatTimeAgo(new Date(lastSyncTime));
      return {
        icon: '☁️',
        label: `Synced · ${timeAgo}`,
        color: '#27ae60',
        visible: true,
      };
    }

    return {
      icon: '☁️',
      label: 'Not Synced',
      color: '#f39c12',
      visible: true,
    };
  }, [isSyncing, lastSyncTime, syncError, currentUserId]);

  if (!statusInfo.visible) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
      disabled={!onPress}
    >
      {statusInfo.isLoading ? (
        <ActivityIndicator size="small" color={statusInfo.color} />
      ) : (
        <Text style={{ fontSize: 14 }}>{statusInfo.icon}</Text>
      )}
      <Text
        style={{
          fontSize: 12,
          color: statusInfo.color,
          fontWeight: '600',
        }}
        numberOfLines={1}
      >
        {statusInfo.label}
      </Text>
    </TouchableOpacity>
  );
}
