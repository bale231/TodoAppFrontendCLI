import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {fetchAllLists, createList} from '../api/todos';
import {getCurrentUserJWT, logout} from '../api/auth';
import {useTheme} from '../context/ThemeContext';

interface TodoList {
  id: number;
  name: string;
  color: string;
  todos: any[];
}

interface HomeProps {
  navigation: any;
}

export default function Home({navigation}: HomeProps) {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const {theme} = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const userData = await getCurrentUserJWT();
    if (!userData) {
      navigation.replace('Login');
      return;
    }
    setUser(userData);

    const listsData = await fetchAllLists();
    setLists(listsData);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const renderList = ({item}: {item: TodoList}) => (
    <TouchableOpacity
      style={[styles.listItem, {borderLeftColor: item.color}]}
      onPress={() => navigation.navigate('ToDoListPage', {listId: item.id})}>
      <Text style={[styles.listName, isDark && styles.listNameDark]}>
        {item.name}
      </Text>
      <Text style={[styles.listCount, isDark && styles.listCountDark]}>
        {item.todos.length} todos
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.welcomeText, isDark && styles.welcomeTextDark]}>
          Ciao, {user?.username || 'User'}!
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lists}
        renderItem={renderList}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            Nessuna lista. Crea la tua prima lista!
          </Text>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          /* TODO: Aggiungi modale per creare lista */
        }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeTextDark: {
    color: '#fff',
  },
  logoutButton: {
    color: '#f44',
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listNameDark: {
    color: '#fff',
  },
  listCount: {
    fontSize: 14,
    color: '#666',
  },
  listCountDark: {
    color: '#aaa',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
