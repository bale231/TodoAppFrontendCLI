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
import {useTheme} from '../context/ThemeContext';
import {getCurrentUserJWT, logout} from '../api/auth';
import {useNotifications} from '../context/NotificationContext';

interface NavbarProps {
  navigation: any;
}

export default function Navbar({navigation}: NavbarProps) {
  const {theme, setTheme} = useTheme();
  const {notifications} = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={[styles.navbar, isDark && styles.navbarDark]}>
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

        {/* Notification bell */}
        <TouchableOpacity
          onPress={() => setNotificationModalOpen(true)}
          style={styles.iconButton}>
          <Text style={styles.icon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

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

      {/* Notification Modal */}
      <Modal
        visible={notificationModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationModalOpen(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setNotificationModalOpen(false)}>
          <View style={[styles.notificationModal, isDark && styles.notificationModalDark]}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              Notifiche
            </Text>
            {notifications.length === 0 ? (
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                Nessuna notifica
              </Text>
            ) : (
              notifications.map(notif => (
                <View key={notif.id} style={styles.notificationItem}>
                  <Text style={[styles.notificationText, isDark && styles.notificationTextDark]}>
                    {notif.message}
                  </Text>
                </View>
              ))
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setNotificationModalOpen(false)}>
              <Text style={styles.closeButtonText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 200, 200, 0.5)',
  },
  navbarDark: {
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
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
    position: 'relative',
    padding: 8,
  },
  icon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f44',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  notificationModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    marginTop: 100,
    marginHorizontal: 16,
    maxHeight: '70%',
    minWidth: 300,
  },
  notificationModalDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalTitleDark: {
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    paddingVertical: 20,
  },
  emptyTextDark: {
    color: '#666',
  },
  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 200, 200, 0.3)',
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
  },
  notificationTextDark: {
    color: '#ddd',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
