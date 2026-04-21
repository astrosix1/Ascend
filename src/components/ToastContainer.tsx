import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast, { ToastMessage } from './Toast';
import { Spacing } from '../utils/theme';

interface ToastContainerProps {
  maxToasts?: number;
}

export interface ToastContextType {
  show: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

export const ToastContext = React.createContext<ToastContextType | null>(null);

export default function ToastContainer({ maxToasts = 3 }: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, message, type, duration };

    setToasts(prev => {
      const updated = [...prev, newToast];
      if (updated.length > maxToasts) {
        updated.shift();
      }
      return updated;
    });
  }, [maxToasts]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    show(message, 'success', duration);
  }, [show]);

  const error = useCallback((message: string, duration?: number) => {
    show(message, 'error', duration);
  }, [show]);

  const warning = useCallback((message: string, duration?: number) => {
    show(message, 'warning', duration);
  }, [show]);

  const info = useCallback((message: string, duration?: number) => {
    show(message, 'info', duration);
  }, [show]);

  const value: ToastContextType = { show, success, error, warning, info };

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast}
            onDismiss={dismiss}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastContainer');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Spacing.lg,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
