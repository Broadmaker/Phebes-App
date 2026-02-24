/** @jsxImportSource nativewind */
// src/navigation/RootStack.tsx

import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

import TabNavigator from './TabNavigator';
import SplashScreen from '../screens/Splash/SplashScreen';
import AuthStack from './AuthStack';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Splash always loads first */}
      <Stack.Screen name="Splash">
        {(props) => (
          <SplashScreen
            {...props}
            onFinish={(authState: boolean) => {
              setIsAuthenticated(authState);
              if (authState) {
                props.navigation.replace('MainTabs');
              } else {
                props.navigation.replace('Auth');
              }
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
    </Stack.Navigator>
  );
}
