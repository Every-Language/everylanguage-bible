import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuthContext } from '@/shared/hooks';
import { logger } from '../../../shared/utils/logger';
import { useTheme } from '@/shared/hooks';
import { Button, createThemedStyles, getInputStyle } from '@/shared';
import { useTranslations } from '@/shared/hooks';

const themedStyles = createThemedStyles({
  container: theme => ({
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  }),
  title: theme => ({
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    color: theme.colors.text,
  }),
  input: theme => ({
    ...getInputStyle(theme),
    marginBottom: theme.spacing.md,
  }),
  buttonContainer: theme => ({
    marginBottom: theme.spacing.md,
  }),
  linkButton: theme => ({
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  }),
  linkText: theme => ({
    color: theme.colors.interactive,
    fontSize: theme.typography.fontSize.sm,
  }),
});

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signUp, isLoading } = useAuthContext();
  const { theme } = useTheme();
  const t = useTranslations();
  const styles = themedStyles(theme);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.errors.fillAllFields'));
      return;
    }

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (error) {
      // Error handling is done in the hook
      logger.error('Auth error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.emailPlaceholder')}
        placeholderTextColor={theme.colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType='email-address'
        autoCapitalize='none'
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder={t('auth.passwordPlaceholder')}
        placeholderTextColor={theme.colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize='none'
      />

      <View style={styles.buttonContainer}>
        <Button
          title={
            mode === 'signin' ? t('auth.signInButton') : t('auth.signUpButton')
          }
          onPress={handleSubmit}
          disabled={isLoading}
          loading={isLoading}
          variant='primary'
          fullWidth
        />
      </View>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}>
        <Text style={styles.linkText}>
          {mode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
