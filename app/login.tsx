import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/Input';
import { ButtonPrimary } from '@/components/ButtonPrimary';
import { theme } from '@/constants/theme';
import { ui } from '@/constants/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!emailOrUsername.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(emailOrUsername, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title} className="text-text text-3xl font-bold mb-sm">Child Monitoring</Text>
            <Text style={styles.subtitle} className={ui.subtle + ' text-lg'}>Welcome back</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email or Username"
              placeholder="Enter your email or username"
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              autoCapitalize="none"
              keyboardType="email-address"
              className="mb-md"
              labelClassName="text-text text-sm font-medium mb-xs"
              inputClassName="bg-[rgba(255,255,255,0.1)] rounded-2xl border border-glassBorder text-text text-md px-md py-md"
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              className="mb-md"
              labelClassName="text-text text-sm font-medium mb-xs"
              inputClassName="bg-[rgba(255,255,255,0.1)] rounded-2xl border border-glassBorder text-text text-md px-md py-md"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <ButtonPrimary
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
              className="rounded-2xl"
              textClassName="font-bold text-white"
            />

            <TouchableOpacity
              onPress={() => router.push('/forgot-password')}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText} className="text-primary text-sm">Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText} className={ui.subtle + ' text-sm'}>Don’t have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink} className="text-primary text-sm font-bold">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: theme.spacing.lg,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: theme.spacing.lg,
  },
  forgotText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  registerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  registerLink: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  error: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});
