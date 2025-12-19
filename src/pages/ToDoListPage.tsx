/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Animated,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useTheme} from '../context/ThemeContext';
import {
  createTodo,
  deleteTodo,
  updateTodo,
  toggleTodo,
  reorderTodos,
  updateSortOrder,
  moveTodo,
  fetchAllLists,
} from '../api/todos';
import {getListShares} from '../api/sharing';
import {getCurrentUserJWT} from '../api/auth';
import {getAuthHeaders} from '../api/todos';

// ===== INTERFACES =====
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  quantity?: number | null;
  unit?: string | null;
  created_by?: {
    id: number;
    username: string;
    full_name: string;
  } | null;
  modified_by?: {
    id: number;
    username: string;
    full_name: string;
  } | null;
}

interface TodoList {
  id: number;
  name: string;
  color: string;
  todos: Todo[];
  sort_order?: string;
  is_shared?: boolean;
  is_owner?: boolean;
}

// ===== COLOR THEMES =====
const colorThemes: Record<string, {light: string; dark: string}> = {
  blue: {light: '#e3f2fd', dark: '#1a237e'},
  green: {light: '#e8f5e9', dark: '#1b5e20'},
  yellow: {light: '#fff9c4', dark: '#f57f17'},
  red: {light: '#ffebee', dark: '#b71c1c'},
  purple: {light: '#f3e5f5', dark: '#4a148c'},
};

const colorMap: Record<string, {bg: string; border: string}> = {
  blue: {bg: 'rgba(59, 130, 246, 0.8)', border: '#3b82f6'},
  green: {bg: 'rgba(34, 197, 94, 0.8)', border: '#22c55e'},
  yellow: {bg: 'rgba(234, 179, 8, 0.8)', border: '#eab308'},
  red: {bg: 'rgba(239, 68, 68, 0.8)', border: '#ef4444'},
  purple: {bg: 'rgba(168, 85, 247, 0.8)', border: '#a855f7'},
};

const API_URL = 'https://bale231.pythonanywhere.com/api';

export default function ToDoListPage({route, navigation}: {route: any; navigation: any}) {
  const {listId} = route.params;
  const {theme} = useTheme();
  const isDark = theme === 'dark';

  // ===== STATE VARIABLES (exact same as webapp) =====
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [listName, setListName] = useState('');
  const [listColor, setListColor] = useState('blue');
  const [editedTodo, setEditedTodo] = useState<Todo | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortOption, setSortOption] = useState<'created' | 'alphabetical' | 'completed'>('created');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sharedWith, setSharedWith] = useState<Array<{username: string; full_name: string}>>([]);
  const [isShared, setIsShared] = useState(false);
  const [isOwner, setIsOwner] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [todoToMove, setTodoToMove] = useState<Todo | null>(null);
  const [allLists, setAllLists] = useState<{id: number; name: string; color: string}[]>([]);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantityValue, setQuantityValue] = useState<string>('');
  const [unitValue, setUnitValue] = useState<string>('');
  const [editTodoHasQuantity, setEditTodoHasQuantity] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{type: 'success' | 'error' | 'warning'; message: string} | null>(null);

  // ===== ANIMATION REFS =====
  const fabRotation = useRef(new Animated.Value(0)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;
  const menuTranslateY = useRef(new Animated.Value(50)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listTranslateX = useRef(new Animated.Value(30)).current;

  // ===== ANIMATION EFFECTS =====
  useEffect(() => {
    if (menuOpen) {
      Animated.parallel([
        Animated.timing(fabRotation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(menuOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(menuTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fabRotation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(menuOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(menuTranslateY, {
          toValue: 50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (editedTodo || showQuantityModal || showBulkConfirm || showMoveModal) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [editedTodo, showQuantityModal, showBulkConfirm, showMoveModal]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    // Animate todos list entrance
    Animated.parallel([
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(listTranslateX, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [todos]);

  // ===== FETCH TODOS =====
  const fetchTodos = useCallback(
    async (preserveSort = false) => {
      try {
        const res = await fetch(`${API_URL}/lists/${listId}/`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        setTodos(data.todos);

        if (!preserveSort) {
          setSortOption(data.sort_order || 'created');
        }

        setListName(data.name);
        setListColor(data.color || 'blue');
        setIsShared(data.is_shared || false);
        setIsOwner(data.is_owner !== false);

        // Load shares
        try {
          const shares = await getListShares(Number(listId));
          if (shares && shares.length > 0) {
            setSharedWith(shares.map((s: any) => ({username: s.username, full_name: s.full_name})));
          } else {
            setSharedWith([]);
          }
        } catch (error) {
          console.error('Error loading shares:', error);
          setSharedWith([]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching todos:', err);
        setAlert({type: 'error', message: 'Errore caricamento lista'});
        setIsLoading(false);
      }
    },
    [listId]
  );

  // ===== LOAD ALL LISTS =====
  const loadAllLists = async () => {
    const lists = await fetchAllLists();
    setAllLists(lists);
  };

  // ===== LOAD CURRENT USER =====
  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await getCurrentUserJWT();
      if (user && user.id) {
        setCurrentUserId(user.id);
      }
    };
    loadCurrentUser();
  }, []);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    fetchTodos();
    loadAllLists();
  }, [fetchTodos]);

  // ===== HANDLERS =====
  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await createTodo(Number(listId), title);
      setTitle('');
      fetchTodos();
      setAlert({type: 'success', message: 'ToDo aggiunta!'});
    } catch (err) {
      setAlert({type: 'error', message: 'Errore creazione ToDo'});
    }
  };

  const handleCreateWithQuantity = async () => {
    if (!title.trim()) {
      setAlert({type: 'warning', message: 'Inserisci un nome per la ToDo'});
      return;
    }
    if (!quantityValue || !unitValue.trim()) {
      setAlert({type: 'warning', message: 'Inserisci quantità e unità'});
      return;
    }
    const qty = parseInt(quantityValue);
    if (isNaN(qty) || qty <= 0) {
      setAlert({type: 'warning', message: 'Quantità non valida'});
      return;
    }
    try {
      await createTodo(Number(listId), title, qty, unitValue);
      setTitle('');
      setQuantityValue('');
      setUnitValue('');
      setShowQuantityModal(false);
      fetchTodos();
      setAlert({type: 'success', message: 'ToDo con quantità aggiunta!'});
    } catch (err) {
      setAlert({type: 'error', message: 'Errore creazione ToDo'});
    }
  };

  const handleToggle = async (todoId: number) => {
    try {
      await toggleTodo(todoId);
      await fetchTodos();
    } catch (err) {
      setAlert({type: 'error', message: 'Errore aggiornamento ToDo'});
    }
  };

  const handleDelete = async (todoId: number) => {
    try {
      await deleteTodo(todoId);
      fetchTodos();
      setAlert({type: 'success', message: 'ToDo eliminata'});
    } catch (err) {
      setAlert({type: 'error', message: 'Errore eliminazione ToDo'});
    }
  };

  const handleOpenEdit = (todo: Todo) => {
    setEditedTodo(todo);
    setEditTodoHasQuantity(todo.quantity !== null && todo.quantity !== undefined);
  };

  const handleEdit = async () => {
    if (editedTodo) {
      try {
        await updateTodo(editedTodo.id, editedTodo.title, editedTodo.quantity, editedTodo.unit);
        setEditedTodo(null);
        setEditTodoHasQuantity(false);
        fetchTodos();
        setAlert({type: 'success', message: 'ToDo modificata!'});
      } catch (err) {
        setAlert({type: 'error', message: 'Errore modifica ToDo'});
      }
    }
  };

  const handleMoveTodo = async (newListId: number) => {
    if (!todoToMove) return;
    try {
      await moveTodo(todoToMove.id, newListId);
      setShowMoveModal(false);
      setTodoToMove(null);
      fetchTodos();
      setAlert({type: 'success', message: 'ToDo spostata!'});
    } catch (err) {
      setAlert({type: 'error', message: 'Errore spostamento ToDo'});
    }
  };

  // Drag & drop temporarily disabled due to React Native 0.83.0 compatibility issues
  // Will be re-enabled when react-native-reanimated supports RN 0.83.0

  const handleSortChange = async (newSort: 'created' | 'alphabetical' | 'completed') => {
    if (!listId) return;
    try {
      await updateSortOrder(listId, newSort);
      setSortOption(newSort);
      fetchTodos(true);
      const messages = {
        created: 'Ordinamento: Per Creazione',
        alphabetical: 'Ordinamento: Alfabetico',
        completed: 'Ordinamento: Per Completezza',
      };
      setAlert({type: 'success', message: messages[newSort]});
    } catch (err) {
      setAlert({type: 'error', message: 'Errore cambio ordinamento'});
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map((i) => deleteTodo(i)));
      setShowBulkConfirm(false);
      setSelectedIds([]);
      fetchTodos();
      setAlert({type: 'success', message: `${selectedIds.length} ToDo eliminate`});
    } catch (err) {
      setAlert({type: 'error', message: 'Errore eliminazione multipla'});
    }
  };

  // ===== DISPLAYED TODOS =====
  const displayedTodos = [...todos];

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colorMap[listColor].border} />
      </View>
    );
  }

  const rotate = fabRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const backgroundColor = isDark ? colorThemes[listColor].dark : colorThemes[listColor].light;

  // ===== RENDER TODO ITEM =====
  const renderTodoItem = ({item}: {item: Todo}) => (
    <Animated.View
      style={[
        {
          opacity: listOpacity,
          transform: [{translateX: listTranslateX}],
        },
      ]}>
      <View style={[styles.todoItem, isDark && styles.todoItemDark]}>
        <View style={styles.todoContent}>
          {editMode && (
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => {
                if (selectedIds.includes(item.id)) {
                  setSelectedIds(selectedIds.filter((i) => i !== item.id));
                } else {
                  setSelectedIds([...selectedIds, item.id]);
                }
              }}>
              <View
                style={[
                  styles.checkboxBox,
                  selectedIds.includes(item.id) && styles.checkboxBoxChecked,
                ]}>
                {selectedIds.includes(item.id) && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => handleToggle(item.id)}>
            <Text style={styles.toggleIcon}>{item.completed ? '☑' : '☐'}</Text>
          </TouchableOpacity>

          <View style={styles.todoTextContainer}>
            <Text
              style={[
                styles.todoTitle,
                isDark && styles.todoTitleDark,
                item.completed && styles.todoTitleCompleted,
              ]}>
              {item.title}
            </Text>
            {item.quantity && item.unit && (
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
            )}
            {(isShared || !isOwner) && currentUserId && (
              <>
                {item.modified_by && item.modified_by.id !== item.created_by?.id && item.modified_by.id !== currentUserId ? (
                  <Text style={styles.authorText}>Modificata da {item.modified_by.full_name}</Text>
                ) : item.created_by && item.created_by.id !== currentUserId ? (
                  <Text style={styles.authorText}>Aggiunta da {item.created_by.full_name}</Text>
                ) : null}
              </>
            )}
          </View>

          {editMode && (
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.editButton, styles.editButtonPurple]}
                onPress={() => {
                  setTodoToMove(item);
                  setShowMoveModal(true);
                }}>
                <Text>⇄</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.editButtonBlue]}
                onPress={() => handleOpenEdit(item)}>
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.editButtonRed]}
                onPress={() => handleDelete(item.id)}>
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );

  // ===== MAIN RENDER =====
  return (
    <View style={[styles.container, isDark && styles.containerDark, {backgroundColor}]}>
        {/* Custom Alert */}
        {alert && (
          <View
            style={[
              styles.alertContainer,
              alert.type === 'success' && styles.alertSuccess,
              alert.type === 'error' && styles.alertError,
              alert.type === 'warning' && styles.alertWarning,
            ]}>
            <Text style={styles.alertText}>{alert.message}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.listTitle, isDark && styles.listTitleDark]}>{listName}</Text>
            {sharedWith.length > 0 && (
              <View style={styles.sharedBadge}>
                <Text style={styles.sharedBadgeText}>
                  👥 Condivisa con {sharedWith.map((u) => u.full_name).join(', ')}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.backButton, isDark && styles.backButtonDark]}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
            <Text style={[styles.backButtonTextLabel, isDark && styles.backButtonTextLabelDark]}>Home</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Mode Banner */}
        {editMode && (
          <View style={[styles.editModeBanner, isDark && styles.editModeBannerDark]}>
            <TouchableOpacity
              style={styles.selectAllCheckbox}
              onPress={() => {
                if (selectedIds.length === todos.length) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(todos.map((t) => t.id));
                }
              }}>
              <View
                style={[
                  styles.checkboxBox,
                  selectedIds.length === todos.length && styles.checkboxBoxChecked,
                ]}>
                {selectedIds.length === todos.length && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.selectAllText, isDark && styles.selectAllTextDark]}>
                Seleziona tutte
              </Text>
            </TouchableOpacity>

            {selectedIds.length > 0 && (
              <TouchableOpacity
                style={styles.bulkDeleteButton}
                onPress={() => setShowBulkConfirm(true)}>
                <Text style={styles.bulkDeleteText}>Elimina ({selectedIds.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Nuova ToDo..."
            placeholderTextColor={isDark ? '#999' : '#666'}
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={handleCreate}
          />
          <TouchableOpacity
            style={[styles.addButton, {backgroundColor: colorMap[listColor].bg}]}
            onPress={handleCreate}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, {backgroundColor: colorMap[listColor].bg}]}
            onPress={() => setShowQuantityModal(true)}>
            <Text style={styles.addButtonText}>+</Text>
            <Text style={styles.addButtonHash}>#</Text>
          </TouchableOpacity>
        </View>

        {/* Todos List */}
        <FlatList
          data={displayedTodos}
          renderItem={renderTodoItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                Nessuna ToDo. Aggiungi la prima!
              </Text>
            </View>
          }
        />

        {/* FAB Menu */}
        <View style={styles.fabContainer}>
          <Animated.View
            style={[
              styles.fabMenu,
              {
                opacity: menuOpacity,
                transform: [{translateY: menuTranslateY}],
              },
            ]}
            pointerEvents={menuOpen ? 'auto' : 'none'}>
            {/* Modifica */}
            <TouchableOpacity
              style={[styles.fabMenuItem, styles.fabMenuItemGreen]}
              onPress={() => {
                setEditMode(!editMode);
                setMenuOpen(false);
              }}>
              <Text style={styles.fabMenuIcon}>✏️</Text>
              <Text style={styles.fabMenuText}>Modifica</Text>
            </TouchableOpacity>

            {/* Sort */}
            <View style={[styles.fabMenuItem, styles.fabMenuItemYellow]}>
              <Text style={styles.fabMenuIcon}>🔄</Text>
              <TouchableOpacity
                onPress={() => {
                  const options: ('created' | 'alphabetical' | 'completed')[] = [
                    'created',
                    'alphabetical',
                    'completed',
                  ];
                  const currentIndex = options.indexOf(sortOption);
                  const nextIndex = (currentIndex + 1) % options.length;
                  handleSortChange(options[nextIndex]);
                  setMenuOpen(false);
                }}>
                <Text style={styles.fabMenuText}>
                  {sortOption === 'created'
                    ? 'Per Creazione'
                    : sortOption === 'alphabetical'
                    ? 'Alfabetico'
                    : 'Per Completezza'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={{transform: [{rotate}]}}>
            <TouchableOpacity
              style={[styles.fab, {backgroundColor: colorMap[listColor].bg}]}
              onPress={() => {
                setMenuOpen((prev) => {
                  const next = !prev;
                  if (!next) setEditMode(false);
                  return next;
                });
              }}>
              <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Edit Modal */}
        <Modal visible={!!editedTodo} transparent animationType="none">
          <BlurView style={styles.modalOverlay} blurType={isDark ? 'dark' : 'light'} blurAmount={20}>
            <Pressable style={styles.modalOverlayPressable} onPress={() => setEditedTodo(null)}>
              <Animated.View
                style={{
                  opacity: modalOpacity,
                  transform: [{scale: modalScale}],
                }}>
                <Pressable style={[styles.modalContent, isDark && styles.modalContentDark]} onPress={() => {}}>
                  <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Modifica ToDo</Text>

                  <TextInput
                    style={[styles.modalInput, isDark && styles.modalInputDark]}
                    placeholder="Titolo"
                    placeholderTextColor={isDark ? '#999' : '#666'}
                    value={editedTodo?.title || ''}
                    onChangeText={(text) => setEditedTodo(editedTodo ? {...editedTodo, title: text} : null)}
                  />

                  {editTodoHasQuantity && (
                    <View style={styles.quantityInputs}>
                      <TextInput
                        style={[styles.modalInput, styles.quantityInput, isDark && styles.modalInputDark]}
                        placeholder="Quantità"
                        placeholderTextColor={isDark ? '#999' : '#666'}
                        keyboardType="numeric"
                        value={editedTodo?.quantity?.toString() || ''}
                        onChangeText={(text) =>
                          setEditedTodo(
                            editedTodo ? {...editedTodo, quantity: text ? parseInt(text) : null} : null
                          )
                        }
                      />
                      <TextInput
                        style={[styles.modalInput, styles.quantityInput, isDark && styles.modalInputDark]}
                        placeholder="Unità"
                        placeholderTextColor={isDark ? '#999' : '#666'}
                        value={editedTodo?.unit || ''}
                        onChangeText={(text) => setEditedTodo(editedTodo ? {...editedTodo, unit: text || null} : null)}
                      />
                    </View>
                  )}

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                      onPress={() => {
                        setEditedTodo(null);
                        setEditTodoHasQuantity(false);
                      }}>
                      <Text style={[styles.modalButtonText, isDark && styles.modalButtonTextDark]}>Annulla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonConfirm]}
                      onPress={handleEdit}>
                      <Text style={styles.modalButtonTextWhite}>Salva</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Animated.View>
            </Pressable>
          </BlurView>
        </Modal>

        {/* Quantity Modal */}
        <Modal visible={showQuantityModal} transparent animationType="none">
          <BlurView style={styles.modalOverlay} blurType={isDark ? 'dark' : 'light'} blurAmount={20}>
            <Pressable style={styles.modalOverlayPressable} onPress={() => setShowQuantityModal(false)}>
              <Animated.View
                style={{
                  opacity: modalOpacity,
                  transform: [{scale: modalScale}],
                }}>
                <Pressable style={[styles.modalContent, isDark && styles.modalContentDark]} onPress={() => {}}>
                  <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                    ToDo con Quantità
                  </Text>

                  <TextInput
                    style={[styles.modalInput, isDark && styles.modalInputDark]}
                    placeholder="ToDo (es: Latte, Pane...)"
                    placeholderTextColor={isDark ? '#999' : '#666'}
                    value={title}
                    onChangeText={setTitle}
                  />

                  <View style={styles.quantityInputs}>
                    <TextInput
                      style={[styles.modalInput, styles.quantityInput, isDark && styles.modalInputDark]}
                      placeholder="Quantità"
                      placeholderTextColor={isDark ? '#999' : '#666'}
                      keyboardType="numeric"
                      value={quantityValue}
                      onChangeText={setQuantityValue}
                    />
                    <TextInput
                      style={[styles.modalInput, styles.quantityInput, isDark && styles.modalInputDark]}
                      placeholder="Unità (kg, pz...)"
                      placeholderTextColor={isDark ? '#999' : '#666'}
                      value={unitValue}
                      onChangeText={setUnitValue}
                    />
                  </View>

                  <Text style={[styles.helperText, isDark && styles.helperTextDark]}>
                    Esempi: pz, kg, litri, cf, scatole
                  </Text>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                      onPress={() => {
                        setShowQuantityModal(false);
                        setQuantityValue('');
                        setUnitValue('');
                      }}>
                      <Text style={[styles.modalButtonText, isDark && styles.modalButtonTextDark]}>Annulla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonConfirm]}
                      onPress={handleCreateWithQuantity}>
                      <Text style={styles.modalButtonTextWhite}>Aggiungi</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Animated.View>
            </Pressable>
          </BlurView>
        </Modal>

        {/* Bulk Delete Confirm Modal */}
        <Modal visible={showBulkConfirm} transparent animationType="none">
          <BlurView style={styles.modalOverlay} blurType={isDark ? 'dark' : 'light'} blurAmount={20}>
            <Pressable style={styles.modalOverlayPressable} onPress={() => setShowBulkConfirm(false)}>
              <Animated.View
                style={{
                  opacity: modalOpacity,
                  transform: [{scale: modalScale}],
                }}>
                <Pressable style={[styles.modalContent, isDark && styles.modalContentDark]} onPress={() => {}}>
                  <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                    Elimina {selectedIds.length} ToDo?
                  </Text>
                  <Text style={[styles.modalText, isDark && styles.modalTextDark]}>
                    Questa operazione è irreversibile.
                  </Text>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                      onPress={() => setShowBulkConfirm(false)}>
                      <Text style={[styles.modalButtonText, isDark && styles.modalButtonTextDark]}>Annulla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonConfirmRed]}
                      onPress={handleBulkDelete}>
                      <Text style={styles.modalButtonTextWhite}>Elimina</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Animated.View>
            </Pressable>
          </BlurView>
        </Modal>

        {/* Move Todo Modal */}
        <Modal visible={showMoveModal} transparent animationType="none">
          <BlurView style={styles.modalOverlay} blurType={isDark ? 'dark' : 'light'} blurAmount={20}>
            <Pressable style={styles.modalOverlayPressable} onPress={() => setShowMoveModal(false)}>
              <Animated.View
                style={{
                  opacity: modalOpacity,
                  transform: [{scale: modalScale}],
                }}>
                <Pressable style={[styles.modalContent, isDark && styles.modalContentDark]} onPress={() => {}}>
                  <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Sposta ToDo</Text>
                  <Text style={[styles.modalText, isDark && styles.modalTextDark]}>
                    Sposta "{todoToMove?.title}" in:
                  </Text>

                  <ScrollView style={styles.listPicker} showsVerticalScrollIndicator={false}>
                    {allLists
                      .filter((l) => l.id !== Number(listId))
                      .map((list) => (
                        <TouchableOpacity
                          key={list.id}
                          style={[styles.listOption, {borderLeftColor: colorMap[list.color].border}]}
                          onPress={() => handleMoveTodo(list.id)}>
                          <Text style={[styles.listOptionText, isDark && styles.listOptionTextDark]}>
                            {list.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                    onPress={() => {
                      setShowMoveModal(false);
                      setTodoToMove(null);
                    }}>
                    <Text style={[styles.modalButtonText, isDark && styles.modalButtonTextDark]}>Annulla</Text>
                  </TouchableOpacity>
                </Pressable>
              </Animated.View>
            </Pressable>
          </BlurView>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

// ===== STYLES =====
const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 100,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  alertSuccess: {
    backgroundColor: '#22c55e',
  },
  alertError: {
    backgroundColor: '#ef4444',
  },
  alertWarning: {
    backgroundColor: '#eab308',
  },
  alertText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
  },
  listTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  listTitleDark: {
    color: '#fff',
  },
  sharedBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedBadgeText: {
    color: '#a855f7',
    fontSize: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
  },
  backButtonDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButtonTextLabel: {
    fontSize: 14,
    marginLeft: 4,
    color: '#333',
  },
  backButtonTextLabelDark: {
    color: '#fff',
  },
  editModeBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
  },
  editModeBannerDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectAllCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#333',
  },
  selectAllTextDark: {
    color: '#fff',
  },
  bulkDeleteButton: {
    marginTop: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bulkDeleteText: {
    color: '#fff',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButtonHash: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 120,
  },
  todoItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  todoItemDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  todoItemDragging: {
    opacity: 0.5,
  },
  todoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#3b82f6',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginRight: 12,
  },
  toggleIcon: {
    fontSize: 20,
    color: '#22c55e',
  },
  todoTextContainer: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  todoTitleDark: {
    color: '#fff',
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  quantityBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  quantityText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  authorText: {
    marginTop: 4,
    fontSize: 11,
    color: '#a855f7',
  },
  dragHandle: {
    padding: 8,
    marginLeft: 8,
  },
  dragIcon: {
    fontSize: 20,
    color: '#999',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonPurple: {
    backgroundColor: 'rgba(192, 132, 252, 0.8)',
  },
  editButtonBlue: {
    backgroundColor: 'rgba(147, 197, 253, 0.8)',
  },
  editButtonRed: {
    backgroundColor: 'rgba(252, 165, 165, 0.8)',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  emptyTextDark: {
    color: '#999',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 32,
    left: 32,
    zIndex: 50,
  },
  fabMenu: {
    marginBottom: 12,
    gap: 12,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabMenuItemGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
  },
  fabMenuItemYellow: {
    backgroundColor: 'rgba(234, 179, 8, 0.8)',
  },
  fabMenuIcon: {
    fontSize: 20,
    color: '#fff',
  },
  fabMenuText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
  },
  modalOverlayPressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
    padding: 24,
    width: screenWidth - 80,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalContentDark: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  modalText: {
    fontSize: 14,
    marginBottom: 16,
    color: '#666',
  },
  modalTextDark: {
    color: '#aaa',
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  modalInputDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
  },
  quantityInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityInput: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  helperTextDark: {
    color: '#999',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
  },
  modalButtonCancelDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalButtonConfirm: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
  },
  modalButtonConfirmRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.3)',
  },
  modalButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonTextDark: {
    color: '#aaa',
  },
  modalButtonTextWhite: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  listPicker: {
    maxHeight: 300,
    marginBottom: 16,
  },
  listOption: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  listOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listOptionTextDark: {
    color: '#fff',
  },
});
