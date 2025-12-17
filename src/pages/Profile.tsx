import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {getCurrentUserJWT, logout, deactivateAccount} from '../api/auth';
import {useTheme} from '../context/ThemeContext';

interface ProfileProps {
  navigation: any;
}

export default function Profile({navigation}: ProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {theme, setTheme} = useTheme();

  const isDark = theme === 'dark';

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userData = await getCurrentUserJWT();
    if (!userData) {
      navigation.replace('Login');
      return;
    }
    setUser(userData);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Elimina Account',
      'Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.',
      [
        {text: 'Annulla', style: 'cancel'},
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            await deactivateAccount();
            await logout();
            navigation.replace('Login');
          },
        },
      ],
    );
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    await setTheme(newTheme);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Profilo
        </Text>
      </View>

      {/* User Info Card */}
      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, isDark && styles.avatarDark]}>
            <Text style={[styles.avatarText, isDark && styles.avatarTextDark]}>
              {user?.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.username, isDark && styles.usernameDark]}>
          {user?.username}
        </Text>
        <Text style={[styles.email, isDark && styles.emailDark]}>
          {user?.email}
        </Text>
      </View>

      {/* Settings Section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          Impostazioni
        </Text>

        {/* Theme Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingIcon]}>🌙</Text>
            <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>
              Tema Scuro
            </Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{false: '#ccc', true: '#4a90e2'}}
            thumbColor={theme === 'dark' ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Notifications Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🔔</Text>
            <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>
              Notifiche
            </Text>
          </View>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{false: '#ccc', true: '#4a90e2'}}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDeleteAccount}>
          <Text style={styles.buttonText}>Elimina Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    color: '#4a90e2',
    fontSize: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  titleDark: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#2a2a2a',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarDark: {
    backgroundColor: '#5a9fe2',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarTextDark: {
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  usernameDark: {
    color: '#fff',
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  emailDark: {
    color: '#aaa',
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionDark: {
    backgroundColor: '#2a2a2a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingLabelDark: {
    color: '#fff',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#666',
  },
  deleteButton: {
    backgroundColor: '#f44',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
