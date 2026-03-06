/** @jsxImportSource nativewind */
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import PinGate from './PinGate';
import SalesDashboard from './SalesDashboard';

export default function SaleScreen() {
  const [unlocked, setUnlocked] = useState(false);

  // 🔐 Auto-lock when leaving the screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        setUnlocked(false); // lock when screen is left
      };
    }, [])
  );

  // Show PIN input if locked
  return unlocked ? <SalesDashboard /> : <PinGate onSuccess={() => setUnlocked(true)} />;
}
