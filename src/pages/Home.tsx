import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
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
  const [showModal, setShowModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4a90e2');
  const {theme} = useTheme();
  const isDark = theme === 'dark';

  const colors = ['#4a90e2', '#f44', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];

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

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per la lista');
      return;
    }

    try {
      await createList(newListName, selectedColor);
      setShowModal(false);
      setNewListName('');
      setSelectedColor('#4a90e2');
      loadData();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile creare la lista');
    }
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
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('UsersPage')}
            style={styles.iconButton}>
            <Text style={styles.iconButtonText}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('FriendsPage')}
            style={styles.iconButton}>
            <Text style={styles.iconButtonText}>🤝</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('FriendRequestsPage')}
            style={styles.iconButton}>
            <Text style={styles.iconButtonText}>📩</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.iconButton}>
            <Text style={styles.iconButtonText}>👤</Text>
          </TouchableOpacity>
        </View>
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
        onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal Crea Lista */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              Nuova Lista
            </Text>

            <TextInput
              style={[styles.modalInput, isDark && styles.modalInputDark]}
              value={newListName}
              onChangeText={setNewListName}
              placeholder="Nome lista..."
              placeholderTextColor={isDark ? '#999' : '#666'}
              autoFocus
            />

            <Text style={[styles.colorLabel, isDark && styles.colorLabelDark]}>
              Scegli un colore:
            </Text>
            <View style={styles.colorPicker}>
              {colors.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    {backgroundColor: color},
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
                  setNewListName('');
                }}>
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateList}>
                <Text style={styles.createButtonText}>Crea</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 18,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContentDark: {
    backgroundColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalTitleDark: {
    color: '#fff',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  modalInputDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#444',
    color: '#fff',
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  colorLabelDark: {
    color: '#fff',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: '#fff',
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#4a90e2',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
