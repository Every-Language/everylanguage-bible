import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';

interface CodeEntryModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: (code: string) => void;
}

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

export const CodeEntryModal: React.FC<CodeEntryModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isVisible) {
      setStep('enter');
      setCode('');
      setConfirmCode('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  const handleCodeChange = (text: string) => {
    // Only allow numeric input and limit to 4 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);

    if (step === 'enter') {
      setCode(numericText);
    } else {
      setConfirmCode(numericText);
    }
  };

  const handleCancel = () => {
    setStep('enter');
    setCode('');
    setConfirmCode('');
    onClose();
  };

  const handleOK = () => {
    if (step === 'enter') {
      const currentCode = code;
      if (
        currentCode &&
        currentCode.length === 4 &&
        /^\d{4}$/.test(currentCode)
      ) {
        // Move to confirmation step
        setStep('confirm');
        setConfirmCode('');
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } else {
        Alert.alert('Invalid Code', 'Please enter exactly 4 digits.');
      }
    } else {
      // Confirmation step
      const currentConfirmCode = confirmCode;
      if (currentConfirmCode === code) {
        onSuccess(code);
        onClose();
      } else {
        Alert.alert(
          'Code Mismatch',
          'The codes do not match. Please try again.'
        );
      }
    }
  };

  const currentCode = step === 'enter' ? code : confirmCode;
  const isValidInput = currentCode.length === 4;

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      {/* Modal Box */}
      <View style={styles.modalBox}>
        {/* Title */}
        <Text style={styles.title}>
          {step === 'enter' ? 'Enter 4-Digit Code' : 'Confirm Code'}
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          {step === 'enter'
            ? 'Are you sure you want to enter calculator mode? You will not be able to get back into the app if you forget your code.'
            : 'Please enter the same 4-digit code again to confirm:'}
        </Text>

        {/* Input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={currentCode}
          onChangeText={handleCodeChange}
          keyboardType='numeric'
          maxLength={4}
          placeholder='Enter 4 digits'
          placeholderTextColor='#AD915A80'
          autoFocus
          selectTextOnFocus
        />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {/* Cancel Button */}
          <TouchableOpacity style={styles.button} onPress={handleCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          {/* OK Button */}
          <TouchableOpacity
            style={[styles.button, { opacity: isValidInput ? 1 : 0.6 }]}
            onPress={handleOK}
            disabled={!isValidInput}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalBox: {
    backgroundColor: '#F9F7F4',
    borderRadius: 24,
    width: 240,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000000',
  },
  message: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
    color: '#000000',
  },
  input: {
    backgroundColor: '#AD915A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#F9F7F4',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#AD915A',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F9F7F4',
  },
});
