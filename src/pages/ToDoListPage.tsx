import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  fetchListDetails,
  createTodo,
  toggleTodo,
  deleteTodo,
} from '../api/todos';
import {useTheme} from '../context/ThemeContext';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

interface ToDoListPageProps {
  route: any;
  navigation: any;
}

export default function ToDoListPage({route, navigation}: ToDoListPageProps) {
  const {listId} = route.params;
  const [list, setList] = useState<any>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const {theme} = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    loadList();
  }, [listId]);

  const loadList = async () => {
    setIsLoading(true);
    const listData = await fetchListDetails(listId);
    setList(listData);
    setTodos(listData.todos || []);
    setIsLoading(false);
  };

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return;

    await createTodo(listId, newTodoText);
    setNewTodoText('');
    loadList();
  };

  const handleToggleTodo = async (todoId: number) => {
    await toggleTodo(todoId);
    loadList();
  };

  const handleDeleteTodo = async (todoId: number) => {
    await deleteTodo(todoId);
    loadList();
  };

  const renderTodo = ({item}: {item: Todo}) => (
    <View style={styles.todoItem}>
      <TouchableOpacity
        style={styles.todoCheckbox}
        onPress={() => handleToggleTodo(item.id)}>
        <View
          style={[
            styles.checkbox,
            item.completed && styles.checkboxChecked,
            isDark && styles.checkboxDark,
          ]}>
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
      <Text
        style={[
          styles.todoText,
          isDark && styles.todoTextDark,
          item.completed && styles.todoTextCompleted,
        ]}>
        {item.title}
      </Text>
      <TouchableOpacity onPress={() => handleDeleteTodo(item.id)}>
        <Text style={styles.deleteButton}>🗑</Text>
      </TouchableOpacity>
    </View>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={[styles.listName, isDark && styles.listNameDark]}>
          {list?.name || 'Lista'}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={newTodoText}
          onChangeText={setNewTodoText}
          placeholder="Aggiungi un nuovo todo..."
          placeholderTextColor={isDark ? '#999' : '#666'}
          onSubmitEditing={handleAddTodo}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTodo}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            Nessun todo. Aggiungi il primo!
          </Text>
        }
      />
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
  listName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  listNameDark: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  inputDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    color: '#fff',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  todoCheckbox: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDark: {
    borderColor: '#5a9fe2',
  },
  checkboxChecked: {
    backgroundColor: '#4a90e2',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  todoTextDark: {
    color: '#fff',
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteButton: {
    fontSize: 20,
    marginLeft: 8,
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
