import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { palette, useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const { theme } = useApp();
  const c = palette(theme === 'dark');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [loading, setLoading] = useState(false);

  const updatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert(
        'Missing information',
        'Please enter your new password twice.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Password too short',
        'Your password must be at least 6 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'Make sure both passwords are the same.'
      );
      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        Alert.alert(
          'Could not update password',
          error.message
        );
        return;
      }

      Alert.alert(
        'Password updated',
        'Your password has been changed successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              router.replace('/(tabs)/home');
            },
          },
        ]
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Something went wrong',
        'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor: c.bg,
        },
      ]}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: c.text,
            },
          ]}
        >
          New password
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: c.muted,
            },
          ]}
        >
          Choose a new password for your Skill+
          account.
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="New password"
          placeholderTextColor={c.muted}
          secureTextEntry
          autoCapitalize="none"
          style={[
            styles.input,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              color: c.text,
            },
          ]}
        />

        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor={c.muted}
          secureTextEntry
          autoCapitalize="none"
          style={[
            styles.input,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              color: c.text,
            },
          ]}
        />

        <Pressable
          onPress={updatePassword}
          disabled={loading}
          style={[
            styles.button,
            {
              backgroundColor: c.primary,
              opacity: loading ? 0.6 : 1,
            },
          ]}
        >
          <Text style={styles.buttonText}>
            {loading
              ? 'Updating...'
              : 'Update password'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },

  button: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});