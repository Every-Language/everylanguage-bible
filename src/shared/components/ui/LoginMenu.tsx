import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SlideUpPanel } from './SlideUpPanel';
import { useTheme } from '@/shared/store';

// Import utility icons
import profileIcon from '../../../../assets/images/utility_icons/profile.png';

interface LoginMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export const LoginMenu: React.FC<LoginMenuProps> = ({ isVisible, onClose }) => {
  const { colors, isDark } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Login pressed with:', { phoneNumber, password });
    // TODO: Implement actual login logic
  };

  const handleCreateAccount = () => {
    console.log('Create account pressed');
    // TODO: Implement navigation to create account
  };

  return (
    <SlideUpPanel
      isVisible={isVisible}
      onClose={onClose}
      title='Login'
      fullScreen={true}
      testID='login-menu'>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.headerSection}>
                <View
                  style={[
                    styles.avatarContainer,
                    { backgroundColor: colors.secondary + '30' },
                  ]}>
                  <Image
                    source={profileIcon}
                    style={[styles.avatarIcon, { tintColor: colors.secondary }]}
                    resizeMode='contain'
                  />
                </View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Sign in to{' '}
                </Text>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  EveryLanguage Bible
                </Text>
                <Text
                  style={[styles.headerSubtitle, { color: colors.secondary }]}>
                  Sign in to sync your progress
                </Text>
              </View>

              {/* Input Fields */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#414141' : '#EAE9E7',
                      color: colors.text,
                    },
                  ]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder='phone number'
                  placeholderTextColor={colors.secondary + '70'}
                  keyboardType='phone-pad'
                  autoComplete='tel'
                  textContentType='telephoneNumber'
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#414141' : '#EAE9E7',
                      color: colors.text,
                    },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder='password'
                  placeholderTextColor={colors.secondary + '70'}
                  secureTextEntry
                  autoComplete='password'
                  textContentType='password'
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: isDark ? '#414141' : '#EAE9E7',
                    opacity: phoneNumber && password ? 1 : 0.6,
                  },
                ]}
                onPress={handleLogin}
                disabled={!phoneNumber || !password}>
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Log In
                </Text>
              </TouchableOpacity>

              {/* Create Account Link */}
              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={handleCreateAccount}>
                <Text
                  style={[
                    styles.createAccountText,
                    { color: colors.secondary },
                  ]}>
                  No account? Create one!
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SlideUpPanel>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarIcon: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
    gap: 16,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createAccountButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  createAccountText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
