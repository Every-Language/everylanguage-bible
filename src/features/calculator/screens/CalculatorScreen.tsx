import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useCalculatorMode } from '@/shared/store';

const { width } = Dimensions.get('window');
const buttonSize = (width - 60) / 4; // 60 for padding and gaps

export const CalculatorScreen: React.FC = () => {
  const { exitCalculatorMode, isValidCode } = useCalculatorMode();
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [isFirstInput, setIsFirstInput] = useState(true);

  const formatNumber = (num: string): string => {
    if (num.includes('.')) {
      const parts = num.split('.');
      const integerPart = (parts[0] || '').replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ','
      );
      return `${integerPart}.${parts[1] || ''}`;
    }
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const truncateDisplay = (text: string): string => {
    return text.length > 10 ? text.substring(0, 10) : text;
  };

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
      setIsFirstInput(false);
    } else {
      if (display === '0' || isFirstInput) {
        setDisplay(num);
        setIsFirstInput(false);
      } else {
        setDisplay(display + num);
      }
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      setIsFirstInput(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display.replace(/,/g, ''));

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const result = calculate(currentValue, inputValue, operation);

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (
    firstValue: number,
    secondValue: number,
    operation: string
  ): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    // Check if the display shows a 4-digit code and no operation is pending
    const cleanDisplay = display.replace(/,/g, '');
    const is4DigitCode =
      /^\d{4}$/.test(cleanDisplay) &&
      previousValue === null &&
      operation === null;

    if (is4DigitCode && isValidCode(cleanDisplay)) {
      // Exit calculator mode if the code is valid
      exitCalculatorMode(cleanDisplay);
      return;
    }

    // Otherwise, perform normal calculation
    const inputValue = parseFloat(cleanDisplay);

    if (previousValue !== null && operation) {
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clearDisplay = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setIsFirstInput(true);
  };

  const toggleSign = () => {
    if (display !== '0') {
      setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
    }
  };

  const inputPercent = () => {
    const value = parseFloat(display.replace(/,/g, ''));
    setDisplay(String(value / 100));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
      justifyContent: 'flex-end',
      paddingBottom: 50,
    },
    display: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      paddingHorizontal: 20,
      paddingBottom: 20,
      minHeight: 200,
    },
    displayText: {
      fontSize: (display?.length || 0) > 6 ? 60 : 80,
      color: '#FFFFFF',
      fontWeight: '300',
      textAlign: 'right',
    },
    buttonContainer: {
      paddingHorizontal: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    button: {
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#333333',
    },

    numberButton: {
      backgroundColor: '#333333',
    },
    operatorButton: {
      backgroundColor: '#FF9500',
    },
    operatorButtonActive: {
      backgroundColor: '#FFFFFF',
    },
    functionButton: {
      backgroundColor: '#A6A6A6',
    },
    zeroButton: {
      width: buttonSize * 2 + 12,
      borderRadius: buttonSize / 2,
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingLeft: 28,
    },
    buttonText: {
      fontSize: 32,
      fontWeight: '400',
      color: '#FFFFFF',
    },
    operatorButtonText: {
      fontSize: 40,
      fontWeight: '300',
      color: '#FFFFFF',
    },
    operatorButtonActiveText: {
      color: '#FF9500',
    },
    functionButtonText: {
      fontSize: 32,
      fontWeight: '400',
      color: '#000000',
    },
  });

  const isOperatorActive = (op: string) => operation === op;

  return (
    <View style={styles.container}>
      <View style={styles.display}>
        <Text style={styles.displayText} numberOfLines={1} ellipsizeMode='clip'>
          {truncateDisplay(formatNumber(display))}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* First Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.functionButton]}
            onPress={clearDisplay}
            activeOpacity={0.7}>
            <Text style={styles.functionButtonText}>
              {display === '0' && previousValue === null ? 'AC' : 'C'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.functionButton]}
            onPress={toggleSign}
            activeOpacity={0.7}>
            <Text style={styles.functionButtonText}>+/-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.functionButton]}
            onPress={inputPercent}
            activeOpacity={0.7}>
            <Text style={styles.functionButtonText}>%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.operatorButton,
              isOperatorActive('÷') && styles.operatorButtonActive,
            ]}
            onPress={() => inputOperation('÷')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.operatorButtonText,
                isOperatorActive('÷') && styles.operatorButtonActiveText,
              ]}>
              ÷
            </Text>
          </TouchableOpacity>
        </View>

        {/* Second Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.numberButton]}
            onPress={() => inputNumber('7')}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.numberButton]}
            onPress={() => inputNumber('8')}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.numberButton]}
            onPress={() => inputNumber('9')}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>9</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.operatorButton,
              isOperatorActive('×') && styles.operatorButtonActive,
            ]}
            onPress={() => inputOperation('×')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.operatorButtonText,
                isOperatorActive('×') && styles.operatorButtonActiveText,
              ]}>
              ×
            </Text>
          </TouchableOpacity>
        </View>

        {/* Third Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.numberButton]}
            onPress={() => inputNumber('4')}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.numberButton]}
            onPress={() => inputNumber('5')}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.numberButton]}
            onPress={() => inputNumber('6')}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>6</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.operatorButton,
              isOperatorActive('-') && styles.operatorButtonActive,
            ]}
            onPress={() => inputOperation('-')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.operatorButtonText,
                isOperatorActive('-') && styles.operatorButtonActiveText,
              ]}>
              -
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fourth Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.numberButton]}
            onPress={() => inputNumber('1')}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.numberButton]}
            onPress={() => inputNumber('2')}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.numberButton]}
            onPress={() => inputNumber('3')}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>3</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.operatorButton,
              isOperatorActive('+') && styles.operatorButtonActive,
            ]}
            onPress={() => inputOperation('+')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.operatorButtonText,
                isOperatorActive('+') && styles.operatorButtonActiveText,
              ]}>
              +
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fifth Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.numberButton, styles.zeroButton]}
            onPress={() => inputNumber('0')}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.numberButton]}
            onPress={inputDecimal}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.operatorButton]}
            onPress={performCalculation}
            activeOpacity={0.7}>
            <Text style={styles.operatorButtonText}>=</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
