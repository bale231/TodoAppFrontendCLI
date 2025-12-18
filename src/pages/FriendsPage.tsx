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
import {fetchFriends, removeFriend, Friendship} from '../api/friends';
import {useTheme} from '../context/ThemeContext';

interface FriendsPageProps {
  navigation: any;
}

export default function FriendsPage({navigation}: FriendsPageProps) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const {theme} = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const data = await fetchFriends();
      setFriends(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (friendId: number, username: string) => {
    Alert.alert('Rimuovi Amico', `Rimuovere ${username} dagli amici?`, [
      {text: 'Annulla', style: 'cancel'},
      {
        text: 'Rimuovi',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFriend(friendId);
            loadFriends();
            Alert.alert('Successo', 'Amico rimosso');
          } catch (error) {
            Alert.alert('Errore', 'Impossibile rimuovere l\'amico');
          }
        },
      },
    ]);
  };

  const renderFriend = ({item}: {item: Friendship}) => (
    <View style={[styles.friendCard, isDark && styles.friendCardDark]}>
      <View style={[styles.avatar, isDark && styles.avatarDark]}>
        <Text style={styles.avatarText}>
          {item.friend.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={[styles.username, isDark && styles.usernameDark]}>
          {item.friend.username}
        </Text>
        <Text style={[styles.fullName, isDark && styles.fullNameDark]}>
          {item.friend.full_name}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemove(item.friend.id, item.friend.username)}>
        <Text style={styles.removeButtonText}>Rimuovi</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.titleDark]}>I Miei Amici</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4a90e2" style={styles.loader} />
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Nessun amico ancora. Cerca utenti e invia richieste!
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
  friendCard: {
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
  friendCardDark: {
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
  friendInfo: {
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
  removeButton: {
    backgroundColor: '#f44',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeButtonText: {
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
