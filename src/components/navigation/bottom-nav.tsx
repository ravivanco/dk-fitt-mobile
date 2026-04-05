import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavItem = {
  label: string;
  route: Href;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', route: '/home', icon: 'home-variant-outline' },
  { label: 'Mi plan', route: '/mi-plan', icon: 'clipboard-text-outline' },
  { label: 'Calendario', route: '/calendario', icon: 'calendar-month-outline' },
  { label: 'Perfil', route: '/perfil', icon: 'account-circle-outline' },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <View style={[styles.container, { marginBottom: Math.max(insets.bottom, 8) }]}> 
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.route;

          return (
            <Pressable
              key={item.label}
              onPress={() => router.replace(item.route)}
              style={[styles.item, active && styles.itemActive]}>
              <View style={[styles.topIndicator, active && styles.topIndicatorActive]} />
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={active ? '#179d4f' : '#8d867a'}
              />
              <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    zIndex: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e6dfd3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    minHeight: 42,
    borderRadius: 12,
    paddingVertical: 6,
  },
  itemActive: {
    backgroundColor: '#f8fbf8',
  },
  topIndicator: {
    width: 22,
    height: 3,
    borderRadius: 99,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  topIndicatorActive: {
    backgroundColor: '#1da653',
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    color: '#948d82',
    fontWeight: '600',
  },
  labelActive: {
    color: '#179d4f',
    fontWeight: '700',
  },
});
