import React, {useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import {useNotifications} from '../context/NotificationContext';
import {useTheme} from '../context/ThemeContext';

export default function NotificationBadge() {
  const {unreadCount, showPopup, setShowPopup} = useNotifications();
  const {theme} = useTheme();
  const isDark = theme === 'dark';
  const badgeScale = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(unreadCount);

  // Animation when count changes
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <TouchableOpacity
      onPress={() => setShowPopup(!showPopup)}
      style={styles.button}>
      <Text style={[styles.bellIcon, isDark && styles.bellIconDark]}>🔔</Text>

      {unreadCount > 0 && (
        <Animated.View
          style={[
            styles.badge,
            {
              transform: [{scale: badgeScale}],
            },
          ]}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    padding: 8,
  },
  bellIcon: {
    fontSize: 24,
    color: '#3b82f6',
  },
  bellIconDark: {
    color: '#facc15',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
