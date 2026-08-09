import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import {
  AppText,
  Button,
  Input,
  Screen,
} from '@/components/UI';

import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Login() {
  const [mode, setMode] =
    useState<'login' | 'register' | 'forgot'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const auth = useAuth();

  async function submit() {
    if (!email.trim()) {
      Alert.alert(
        'Skill+',
        'Please enter your email address.'
      );
      return;
    }

    if (mode !== 'forgot' && !password) {
      Alert.alert(
        'Skill+',
        'Please enter your password.'
      );
      return;
    }

    if (mode === 'register' && !name.trim()) {
      Alert.alert(
        'Skill+',
        'Please enter your display name.'
      );
      return;
    }

    try {
      setBusy(true);

      if (mode === 'login') {
        const error =
          await auth.signIn(
            email.trim(),
            password
          );

        if (error) {
          Alert.alert(
            'Skill+',
            error
          );
          return;
        }

        router.replace('/(tabs)/home');
        return;
      }

      if (mode === 'register') {
        const result =
          await auth.signUp(
            name.trim(),
            email.trim(),
            password
          );

        if (result.error) {
          Alert.alert(
            'Could not create account',
            result.error
          );
          return;
        }

        if (result.needsVerification) {
          Alert.alert(
            'Check your email',
            'We sent you a verification link. Verify your email before signing in.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setMode('login');
                  setPassword('');
                },
              },
            ]
          );

          return;
        }

        router.replace('/(tabs)/home');
        return;
      }

      const error =
        await auth.reset(
          email.trim()
        );

      if (error) {
        Alert.alert(
          'Skill+',
          error
        );
        return;
      }

      Alert.alert(
        'Check your email',
        'We sent you a password reset link.'
      );

      setMode('login');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.wrap}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>
              S+
            </Text>
          </View>

          <AppText style={styles.title}>
            {mode === 'login'
              ? 'Welcome back'
              : mode === 'register'
              ? 'Create account'
              : 'Reset password'}
          </AppText>

          <AppText
            muted
            style={styles.sub}
          >
            {mode === 'forgot'
              ? 'Enter your email to receive a reset link.'
              : 'Keep growing, one practice session at a time.'}
          </AppText>

          {mode === 'register' && (
            <Input
              placeholder="Display name"
              value={name}
              onChangeText={setName}
            />
          )}

          <Input
            placeholder="Email address"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {mode !== 'forgot' && (
            <Input
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          )}

          <Button
            title={
              busy
                ? 'Please wait…'
                : mode === 'login'
                ? 'Log in'
                : mode === 'register'
                ? 'Create account'
                : 'Send reset link'
            }
            disabled={busy}
            onPress={submit}
          />

          {mode === 'login' && (
            <Text
              style={styles.link}
              onPress={() =>
                setMode('forgot')
              }
            >
              Forgot password?
            </Text>
          )}

          <Text
            style={styles.link}
            onPress={() =>
              setMode(
                mode === 'register'
                  ? 'login'
                  : 'register'
              )
            }
          >
            {mode === 'register'
              ? 'Already have an account? Log in'
              : 'New here? Create an account'}
          </Text>

          {!isSupabaseConfigured && (
            <>
              <AppText
                muted
                style={{
                  textAlign: 'center',
                }}
              >
                Supabase is not connected yet.
              </AppText>

              <Button
                secondary
                title="Preview the app"
                onPress={() =>
                  router.replace(
                    '/(tabs)/home'
                  )
                }
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
    gap: 14,
  },

  logo: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: '#FF6A00',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  logoText: {
    fontSize: 29,
    fontWeight: '900',
    color: '#fff',
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },

  sub: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 15,
  },

  link: {
    color: '#FF6A00',
    fontWeight: '700',
    textAlign: 'center',
    padding: 4,
  },
});