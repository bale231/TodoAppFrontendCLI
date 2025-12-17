import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {fetchUsers, sendFriendRequest, User} from '../api/friends';
import {useTheme} from '../context/ThemeContext';

interface UsersPageProps {
  navigation: any;
}

export default function UsersPage({navigation}: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const {theme} = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        loadUsers(searchQuery);
      } else {
        setUsers([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadUsers = async (search?: string) => {
    setLoading(true);
    try {
      const data = await fetchUsers(search);
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: number) => {
    try {
      await sendFriendRequest(userId);
      if (searchQuery.trim()) {
        loadUsers(searchQuery);
      }
      Alert.alert('Successo', 'Richiesta inviata!');
    } catch (error: any) {
      Alert.alert('Errore', error.message || "Errore nell'invio");
    }
  };

  const renderUser = ({item}: {item: User}) => {
    const status = item.friendship_status;
    const isDisabled = status === 'friends' || status === 'pending_sent';

    return (
      <View style={[styles.userCard, isDark && styles.userCardDark]}>
        <View style={[styles.avatar, isDark && styles.avatarDark]}>
          <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.username, isDark && styles.usernameDark]}>
            {item.username}
          </Text>
          <Text style={[styles.fullName, isDark && styles.fullNameDark]}>
            {item.full_name}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.button,
            status === 'friends' && styles.friendsButton,
            status === 'pending_sent' && styles.pendingButton,
          ]}
          onPress={() => !isDisabled && handleSendRequest(item.id)}
          disabled={isDisabled}>
          <Text style={styles.buttonText}>
            {status === 'friends'
              ? '✓ Amici'
              : status === 'pending_sent'
              ? 'Inviata'
              : 'Aggiungi'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Trova Amici
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, isDark && styles.searchInputDark]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Cerca per username..."
          placeholderTextColor={isDark ? '#999' : '#666'}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4a90e2" style={styles.loader} />
      ) : !searchQuery.trim() ? (
        <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
          Digita un username per cercare
        </Text>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Nessun utente trovato
            </Text>
          }
        />
      )}
    </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  titleDark: {
    color: '#fff',
  },
  searchContainer: {
    padding: 20,
    paddingTop: 0,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  searchInputDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    color: '#fff',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userCardDark: {
    backgroundColor: '#2a2a2a',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarDark: {
    backgroundColor: '#5a9fe2',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  usernameDark: {
    color: '#fff',
  },
  fullName: {
    fontSize: 14,
    color: '#666',
  },
  fullNameDark: {
    color: '#aaa',
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  friendsButton: {
    backgroundColor: '#4caf50',
  },
  pendingButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 40,
  },
  emptyTextDark: {
    color: '#666',
  },
});
