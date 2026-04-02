import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function FormBackgroundDecor() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[styles.square, styles.squareTopLeft]} />
      <View style={[styles.square, styles.squareTopRight]} />
      <View style={[styles.square, styles.squareBottomLeft]} />
      <View style={[styles.bar, styles.barRight]} />
      <View style={styles.ring} />
      <Text style={styles.brand}>DK Fitt</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  square: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#efe8d7',
    opacity: 0.7,
  },
  squareTopLeft: {
    top: 64,
    left: 20,
    transform: [{ rotate: '34deg' }],
  },
  squareTopRight: {
    top: 86,
    right: 30,
    transform: [{ rotate: '32deg' }],
  },
  squareBottomLeft: {
    bottom: 82,
    left: 16,
    transform: [{ rotate: '34deg' }],
  },
  bar: {
    position: 'absolute',
    width: 34,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#d8cfbd',
  },
  barRight: {
    right: 26,
    top: 216,
    transform: [{ rotate: '-36deg' }],
  },
  ring: {
    position: 'absolute',
    width: 158,
    height: 158,
    right: -48,
    bottom: -34,
    borderRadius: 79,
    borderWidth: 16,
    borderColor: '#efe7d5',
    opacity: 0.75,
  },
  brand: {
    position: 'absolute',
    right: 28,
    bottom: 34,
    color: '#d1c7b5',
    fontSize: 33,
    fontWeight: '800',
    opacity: 0.9,
  },
});
