import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  fetchFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  FriendRequest,
} from '../api/friends';
import {useTheme} from '../context/ThemeContext';

interface FriendRequestsPageProps {
  navigation: any;
}

export default function FriendRequestsPage({navigation}: FriendRequestsPageProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const {theme} = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchFriendRequests();
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      loadRequests();
      Alert.alert('Successo', 'Richiesta accettata!');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile accettare la richiesta');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await rejectFriendRequest(requestId);
      loadRequests();
      Alert.alert('Successo', 'Richiesta rifiutata');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile rifiutare la richiesta');
    }
  };

  const renderRequest = ({item}: {item: FriendRequest}) => (
    <View style={[styles.requestCard, isDark && styles.requestCardDark]}>
      <View style={[styles.avatar, isDark && styles.avatarDark]}>
        <Text style={styles.avatarText}>
          {item.from_user.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.requestInfo}>
        <Text style={[styles.username, isDark && styles.usernameDark]}>
          {item.from_user.username}
        </Text>
        <Text style={[styles.fullName, isDark && styles.fullNameDark]}>
          {item.from_user.full_name}
        </Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAccept(item.id)}>
          <Text style={styles.buttonText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleReject(item.id)}>
          <Text style={styles.buttonText}>✗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Richieste di Amicizia
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4a90e2" style={styles.loader} />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Nessuna richiesta di amicizia
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
  loader: {
    marginTop: 40,
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  requestCard: {
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
  requestCardDark: {
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
  requestInfo: {
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
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4caf50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#f44',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
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
