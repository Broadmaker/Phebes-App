/** @jsxImportSource nativewind */
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Keyboard } from 'react-native';

const STATIC_PIN = '0001';

export default function PinGate({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    if (!/^\d?$/.test(text)) return; // allow only single digit

    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);

    // Move to next input
    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }

    // Move back if cleared
    if (!text && index > 0) {
      inputs.current[index - 1]?.focus();
    }

    // Check PIN when all digits entered
    if (newPin.join('').length === 4) {
      if (newPin.join('') === STATIC_PIN) {
        Keyboard.dismiss();
        onSuccess();
        setPin(['', '', '', '']);
        setError(false);
      } else {
        setError(true);
        setPin(['', '', '', '']);
        inputs.current[0]?.focus();
      }
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-100 p-6">
      <Text className="mb-6 text-2xl font-bold text-gray-800">Enter PIN</Text>

      <View className="flex-row justify-center">
        {pin.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => {
              inputs.current[i] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleChange(text, i)}
            keyboardType="numeric"
            maxLength={1}
            secureTextEntry={true} // 🔐 hide number input
            className={`mx-2 h-16 w-16 rounded-lg border-2 text-center text-2xl font-bold
    ${error ? 'border-red-500 bg-red-100' : 'border-gray-300 bg-white'} text-black`}
            caretHidden={true} // hide the cursor for cleaner look
          />
        ))}
      </View>

      {error && <Text className="mt-4 font-medium text-red-600">Incorrect PIN. Try again.</Text>}
    </View>
  );
}
