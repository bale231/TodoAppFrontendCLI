import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useTheme} from '../context/ThemeContext';
import {getCurrentUserJWT, logout} from '../api/auth';
import {useNotifications} from '../context/NotificationContext';
import NotificationBadge from './NotificationBadge';

interface NavbarProps {
  navigation: any;
}

export default function Navbar({navigation}: NavbarProps) {
  const {theme, setTheme} = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await getCurrentUserJWT();
    setUser(userData);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigation.navigate('Login');
  };

  return (
    <>
    <BlurView
      style={styles.navbar}
      blurType={isDark ? 'dark' : 'light'}
      blurAmount={10}
      reducedTransparencyFallbackColor={isDark ? '#1a1a1a' : '#ffffff'}>
      <View style={styles.navbarContent}>
        {/* Logo */}
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Image
            source={
              isDark
                ? require('../assets/logo-themedark.png')
                : require('../assets/logo-themelight.png')
            }
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Right side controls */}
        <View style={styles.rightControls}>
        {/* Theme toggle */}
        <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
          <Text style={styles.icon}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>

        {/* Notification badge */}
        <NotificationBadge />

        {/* Profile dropdown */}
        <TouchableOpacity
          onPress={() => setDropdownOpen(!dropdownOpen)}
          style={styles.profileButton}>
          {user?.profile_picture ? (
            <Image
              source={{uri: `https://bale231.pythonanywhere.com${user.profile_picture}`}}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profilePlaceholder, isDark && styles.profilePlaceholderDark]}>
              <Text style={styles.profilePlaceholderText}>
                {user?.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      </View>
    </BlurView>

      {/* Profile Dropdown Modal */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDropdownOpen(false)}>
          <View style={[styles.dropdown, isDark && styles.dropdownDark]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setDropdownOpen(false);
                navigation.navigate('Profile');
              }}>
              <Text style={[styles.dropdownText, isDark && styles.dropdownTextDark]}>
                👤 Profilo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleLogout}>
              <Text style={[styles.dropdownText, isDark && styles.dropdownTextDark]}>
                🚪 Logout
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 200, 200, 0.5)',
  },
  navbarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  logo: {
    width: 120,
    height: 40,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  icon: {
    fontSize: 20,
  },
  profileButton: {
    marginLeft: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a90e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePlaceholderDark: {
    backgroundColor: '#5a9fe2',
  },
  profilePlaceholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 16,
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
  },
  dropdownItem: {
    padding: 12,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownTextDark: {
    color: '#fff',
  },
});
