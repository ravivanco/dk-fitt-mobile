import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export function BackButton({
  tone = 'light',
  onPress,
  fallbackHref = '/home',
}: {
  tone?: 'light' | 'dark';
  onPress?: () => void;
  fallbackHref?: Href;
}) {
  return (
    <TouchableOpacity
      onPress={
        onPress ??
        (() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace(fallbackHref);
        })
      }
      style={[styles.base, tone === 'dark' && styles.dark]}
      activeOpacity={0.8}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <MaterialCommunityIcons name="chevron-left" size={26} color={tone === 'dark' ? '#ffffff' : '#0f1115'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#efebe4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dark: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.20)',
  },
});
