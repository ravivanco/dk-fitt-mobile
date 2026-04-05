import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';

export default function LoadingScreen() {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.6)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const progressAnimation = Animated.timing(progress, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    progressAnimation.start(({ finished }) => {
      if (finished) {
        setCompleted(true);
        Animated.parallel([
          Animated.spring(checkScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(checkOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    return () => {
      pulseAnimation.stop();
    };
  }, [checkOpacity, checkScale, progress, pulse]);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.04],
  });

  const handleStart = async () => {
    try {
      await AsyncStorage.setItem('dkfit.planActive', 'true');
    } catch {
      // Continue navigation even if storage fails.
    }

    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <View style={styles.card}>
          <View style={styles.progressWrap}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
            <View style={styles.circleShell}>
              <Animated.View
                style={[
                  styles.circleFill,
                  {
                    transform: [{ scale: completed ? checkScale : ringScale }],
                    backgroundColor: completed ? '#22c55e' : '#34c759',
                    opacity: completed ? 1 : 0.95,
                  },
                ]}>
                <Animated.View style={{ opacity: checkOpacity }}>
                  <MaterialCommunityIcons name="check" size={72} color="#ffffff" />
                </Animated.View>
              </Animated.View>
            </View>

            <Text style={styles.title}>Datos guardados correctamente</Text>
            <Text style={styles.subtitle}>
              Tu nutricionista revisará tu información y activará tu plan tras la consulta presencial.
            </Text>

            <View style={styles.lineRow}>
              <MaterialCommunityIcons name="heart-pulse" size={28} color="#d7d0c4" />
              <View style={styles.line} />
              <MaterialCommunityIcons name="shoe-sneaker" size={28} color="#d7d0c4" />
            </View>

            <Animated.View style={[styles.loadingBarTrack, { opacity: completed ? 0 : 1 }]}>
              <Animated.View style={[styles.loadingBarFill, { width: fillWidth }]} />
            </Animated.View>
          </View>

          <LinearGradient
            colors={['#ecb607', '#f6c510', '#fbd232']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonShadow}>
            <TouchableOpacity activeOpacity={0.9} onPress={handleStart} style={styles.button}>
              <Text style={styles.buttonText}>Iniciar</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f6f1',
  },
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 22,
    backgroundColor: '#f8f6f1',
    position: 'relative',
  },
  card: {
    width: '100%',
    maxWidth: 350,
    minHeight: 520,
    backgroundColor: '#ffffff',
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  progressWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 6,
    borderColor: '#d7f4df',
    opacity: 0.35,
    top: 0,
  },
  circleShell: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#2ecc71',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2ecc71',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  circleFill: {
    width: 126,
    height: 126,
    borderRadius: 63,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 28,
    color: '#5d5247',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: '#8f877d',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 24,
  },
  line: {
    width: 92,
    height: 2,
    backgroundColor: '#d9d0c3',
  },
  loadingBarTrack: {
    width: '70%',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#e3ddd3',
    overflow: 'hidden',
    marginTop: 28,
  },
  loadingBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2ecc71',
  },
  buttonShadow: {
    width: '100%',
    borderRadius: 999,
    shadowColor: '#d3a100',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  button: {
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});
