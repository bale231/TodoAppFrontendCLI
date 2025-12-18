import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import {
  fetchAllLists,
  createList,
  editList as editListAPI,
  deleteList,
  getSelectedCategory,
  saveSelectedCategory,
} from '../api/todos';
import {storage} from '../utils/storage';

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

interface Category {
  id: number;
  name: string;
  is_owner?: boolean;
  is_shared?: boolean;
  can_edit?: boolean;
  shared_by?: {
    id: number;
    username: string;
    full_name: string;
  } | null;
}

interface TodoList {
  id: number;
  name: string;
  color: string;
  created_at: string;
  todos: TodoItem[];
  category?: Category | null;
  is_owner?: boolean;
  is_shared?: boolean;
  can_edit?: boolean;
  shared_by?: {
    id: number;
    username: string;
    full_name: string;
  } | null;
}

const colorMap: Record<string, {border: string; bg: string}> = {
  blue: {border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)'},
  green: {border: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)'},
  yellow: {border: '#eab308', bg: 'rgba(234, 179, 8, 0.2)'},
  red: {border: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)'},
  purple: {border: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)'},
};

const API_URL = 'https://bale231.pythonanywhere.com/api';

export default function Home({navigation}: {navigation: any}) {
  const {theme} = useTheme();
  const isDark = theme === 'dark';

  const [lists, setLists] = useState<TodoList[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // FAB menu
  const [menuOpen, setMenuOpen] = useState(false);
  const fabRotation = useRef(new Animated.Value(0)).current;
  const menuTranslateY = useRef(new Animated.Value(50)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Form states
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('blue');
  const [newListCategory, setNewListCategory] = useState<number | null>(null);
  const [editListId, setEditListId] = useState<number | null>(null);

  const [catName, setCatName] = useState('');
  const [editCatId, setEditCatId] = useState<number | null>(null);

  // Edit mode & sorting
  const [editMode, setEditMode] = useState(false);
  const [sortOption, setSortOption] = useState<'created' | 'name' | 'complete'>('created');
  const [categorySortAlpha, setCategorySortAlpha] = useState(false);

  useEffect(() => {
    fetchLists();
    fetchCategories();
    loadSelectedCategory();
  }, []);

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

  const fetchLists = async () => {
    try {
      const data = await fetchAllLists();
      setLists(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await storage.getItem('accessToken');
      const res = await fetch(`${API_URL}/categories/`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSelectedCategory = async () => {
    try {
      const catId = await getSelectedCategory();
      if (catId) {
        // Will load category when categories are fetched
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per la lista');
      return;
    }

    try {
      if (editListId !== null) {
        await editListAPI(editListId, newListName, newListColor, newListCategory);
        Alert.alert('Successo', 'Lista modificata!');
      } else {
        await createList(newListName, newListColor, newListCategory);
        Alert.alert('Successo', 'Lista creata!');
      }
      fetchLists();
      setShowForm(false);
      setEditListId(null);
      setNewListName('');
      setNewListColor('blue');
      setNewListCategory(null);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile creare la lista');
    }
  };

  const handleEditList = (list: TodoList) => {
    setEditListId(list.id);
    setNewListName(list.name);
    setNewListColor(list.color);
    setNewListCategory(list.category?.id || null);
    setShowForm(true);
  };

  const handleDeleteList = (listId: number) => {
    Alert.alert('Conferma', 'Eliminare questa lista?', [
      {text: 'Annulla', style: 'cancel'},
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteList(listId);
            fetchLists();
            Alert.alert('Successo', 'Lista eliminata');
          } catch (error) {
            Alert.alert('Errore', 'Impossibile eliminare');
          }
        },
      },
    ]);
  };

  const handleCreateOrEditCat = async () => {
    if (!catName.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per la categoria');
      return;
    }

    try {
      const token = await storage.getItem('accessToken');
      const url = editCatId
        ? `${API_URL}/categories/${editCatId}/`
        : `${API_URL}/categories/`;
      const method = editCatId ? 'PATCH' : 'POST';

      await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({name: catName}),
      });

      fetchCategories();
      setShowCatForm(false);
      setEditCatId(null);
      setCatName('');
      Alert.alert('Successo', editCatId ? 'Categoria modificata!' : 'Categoria creata!');
    } catch (err) {
      Alert.alert('Errore', 'Errore nella gestione della categoria');
    }
  };

  const handleEditCat = (cat: Category) => {
    setEditCatId(cat.id);
    setCatName(cat.name);
    setShowCatForm(true);
  };

  const handleSortChange = (newSort: 'created' | 'name' | 'complete') => {
    setSortOption(newSort);
    const sortNames = {
      created: 'Più recente',
      name: 'Alfabetico',
      complete: 'Per completezza',
    };
    Alert.alert('Ordinamento', sortNames[newSort]);
  };

  const toggleCategorySortAlpha = async () => {
    const newValue = !categorySortAlpha;
    setCategorySortAlpha(newValue);
    Alert.alert('Ordine A-Z', newValue ? 'Attivato' : 'Disattivato');

    try {
      const token = await storage.getItem('accessToken');
      await fetch(`${API_URL}/categories/sort_preference/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({category_sort_alpha: newValue}),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Filter and sort logic
  const filteredLists = selectedCategory
    ? lists.filter(l => l.category && l.category.id === selectedCategory.id)
    : lists;

  const sortedLists = [...filteredLists].sort((a, b) => {
    if (sortOption === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'complete') {
      const aComplete = a.todos.filter(t => t.completed).length / (a.todos.length || 1);
      const bComplete = b.todos.filter(t => t.completed).length / (b.todos.length || 1);
      return bComplete - aComplete;
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Group by category
  const groupedLists: {categoryName: string; lists: TodoList[]}[] = [];

  if (!selectedCategory) {
    const uncategorized = sortedLists.filter(l => !l.category);
    if (uncategorized.length > 0) {
      groupedLists.push({categoryName: 'Senza categoria', lists: uncategorized});
    }

    const categoriesWithLists = categories
      .map(cat => {
        const listsInCat = sortedLists.filter(
          l => l.category && l.category.id === cat.id
        );
        return {categoryName: cat.name, lists: listsInCat};
      })
      .filter(group => group.lists.length > 0);

    if (categorySortAlpha) {
      categoriesWithLists.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    }

    groupedLists.push(...categoriesWithLists);
  } else {
    groupedLists.push({categoryName: selectedCategory.name, lists: sortedLists});
  }

  const rotate = fabRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Navbar navigation={navigation} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Quick Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonBlue]}
            onPress={() => navigation.navigate('UsersPage')}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionButtonText}>Trova Utenti</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonGreen]}
            onPress={() => navigation.navigate('FriendRequestsPage')}>
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionButtonText}>Richieste</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPurple]}
            onPress={() => navigation.navigate('FriendsPage')}>
            <Text style={styles.actionIcon}>✓</Text>
            <Text style={styles.actionButtonText}>I Miei Amici</Text>
          </TouchableOpacity>
        </View>

        {/* Category Controls */}
        <View style={styles.categoryControls}>
          <TouchableOpacity
            style={[styles.newCategoryButton]}
            onPress={() => {
              setShowCatForm(true);
              setEditCatId(null);
              setCatName('');
            }}>
            <Text style={styles.newCategoryText}>+ Nuova Categoria</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryPicker, isDark && styles.categoryPickerDark]}
            onPress={() => setShowCategoryPicker(true)}>
            <Text style={[styles.categoryPickerText, isDark && styles.categoryPickerTextDark]}>
              {selectedCategory ? selectedCategory.name : 'Tutte le categorie'}
            </Text>
          </TouchableOpacity>

          {selectedCategory && (
            <TouchableOpacity
              style={styles.editCategoryButton}
              onPress={() => handleEditCat(selectedCategory)}>
              <Text style={styles.editCategoryIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Empty State */}
        {sortedLists.length === 0 && (
          <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Qui andranno le tue liste ToDo animate
            </Text>
          </View>
        )}

        {/* Lists Grid */}
        {groupedLists.map((group, groupIdx) => (
          <View key={groupIdx} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, isDark && styles.categoryTitleDark]}>
              {group.categoryName}
            </Text>
            <View style={styles.listsGrid}>
              {group.lists.map(list => {
                const completed = list.todos.filter(t => t.completed).length;
                const pending = list.todos.length - completed;
                const colors = colorMap[list.color] || colorMap.blue;

                return (
                  <TouchableOpacity
                    key={list.id}
                    style={[
                      styles.listCard,
                      isDark && styles.listCardDark,
                      {borderLeftColor: colors.border, borderLeftWidth: 4},
                    ]}
                    onPress={() => navigation.navigate('ToDoListPage', {listId: list.id})}
                    activeOpacity={0.8}>
                    {/* Shared badge */}
                    {list.is_shared && list.shared_by && (
                      <View style={styles.sharedBadge}>
                        <Text style={styles.sharedBadgeText}>
                          👥 Condivisa da {list.shared_by.full_name}
                        </Text>
                      </View>
                    )}

                    <Text style={[styles.listTitle, isDark && styles.listTitleDark]}>
                      {list.name}
                    </Text>
                    {list.todos.length === 0 ? (
                      <Text style={[styles.listSubtitle, isDark && styles.listSubtitleDark]}>
                        Nessuna ToDo
                      </Text>
                    ) : (
                      <Text style={[styles.listSubtitle, isDark && styles.listSubtitleDark]}>
                        {pending} ToDo da completare, {completed} completate.
                      </Text>
                    )}

                    {/* Edit mode buttons */}
                    {editMode && list.is_owner !== false && (
                      <View style={styles.editButtons}>
                        <TouchableOpacity
                          style={[styles.editButton, styles.editButtonBlue]}
                          onPress={() => handleEditList(list)}>
                          <Text>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.editButton, styles.editButtonRed]}
                          onPress={() => handleDeleteList(list.id)}>
                          <Text>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FAB Menu */}
      <View style={styles.fabContainer}>
        {/* Menu items */}
        <Animated.View
          style={[
            styles.fabMenu,
            {
              opacity: menuOpacity,
              transform: [{translateY: menuTranslateY}],
            },
          ]}
          pointerEvents={menuOpen ? 'auto' : 'none'}>
          {/* Nuova Lista */}
          <TouchableOpacity
            style={[styles.fabMenuItem, styles.fabMenuItemBlue]}
            onPress={() => {
              setShowForm(true);
              setEditListId(null);
              setNewListName('');
              setNewListColor('blue');
              setNewListCategory(null);
              setMenuOpen(false);
            }}>
            <Text style={styles.fabMenuText}>+ Nuova Lista</Text>
          </TouchableOpacity>

          {/* Modifica Liste */}
          <TouchableOpacity
            style={[styles.fabMenuItem, styles.fabMenuItemGreen]}
            onPress={() => {
              setEditMode(!editMode);
              setMenuOpen(false);
              Alert.alert(
                editMode ? 'Modalità modifica disattivata' : 'Modalità modifica attivata'
              );
            }}>
            <Text style={styles.fabMenuText}>✏️ Modifica Liste</Text>
          </TouchableOpacity>

          {/* Ordinamento */}
          <TouchableOpacity
            style={[styles.fabMenuItem, styles.fabMenuItemYellow]}
            onPress={() => {
              const options: ('created' | 'name' | 'complete')[] = [
                'created',
                'name',
                'complete',
              ];
              const currentIndex = options.indexOf(sortOption);
              const nextIndex = (currentIndex + 1) % options.length;
              handleSortChange(options[nextIndex]);
              setMenuOpen(false);
            }}>
            <Text style={styles.fabMenuText}>
              🔄{' '}
              {sortOption === 'created'
                ? 'Più recente'
                : sortOption === 'name'
                ? 'Alfabetico'
                : 'Per completezza'}
            </Text>
          </TouchableOpacity>

          {/* Ordine A-Z */}
          {!selectedCategory && (
            <TouchableOpacity
              style={[
                styles.fabMenuItem,
                categorySortAlpha
                  ? styles.fabMenuItemPurple
                  : styles.fabMenuItemGray,
              ]}
              onPress={() => {
                toggleCategorySortAlpha();
                setMenuOpen(false);
              }}>
              <Text style={styles.fabMenuText}>
                {categorySortAlpha ? '✓ Ordine A-Z attivo' : 'A-Z Ordine'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Main FAB button */}
        <Animated.View style={{transform: [{rotate}]}}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              setMenuOpen(!menuOpen);
              if (menuOpen) setEditMode(false);
            }}>
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Create/Edit List Modal */}
      <Modal visible={showForm} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowForm(false)}>
          <Pressable style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              {editListId !== null ? 'Modifica Lista' : 'Nuova Lista'}
            </Text>

            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="Nome della lista"
              placeholderTextColor={isDark ? '#999' : '#666'}
              value={newListName}
              onChangeText={setNewListName}
            />

            <Text style={[styles.label, isDark && styles.labelDark]}>Colore:</Text>
            <View style={styles.colorPicker}>
              {Object.keys(colorMap).map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    {backgroundColor: colorMap[color].border},
                    newListColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setNewListColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                onPress={() => {
                  setShowForm(false);
                  setEditListId(null);
                  setNewListName('');
                  setNewListColor('blue');
                  setNewListCategory(null);
                }}>
                <Text style={[styles.modalButtonText, isDark && styles.modalButtonTextDark]}>
                  Annulla
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleCreateList}>
                <Text style={styles.modalButtonTextWhite}>
                  {editListId !== null ? 'Salva' : 'Crea'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create/Edit Category Modal */}
      <Modal visible={showCatForm} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCatForm(false)}>
          <Pressable style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              {editCatId ? 'Modifica Categoria' : 'Nuova Categoria'}
            </Text>

            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="Nome categoria"
              placeholderTextColor={isDark ? '#999' : '#666'}
              value={catName}
              onChangeText={setCatName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                onPress={() => {
                  setShowCatForm(false);
                  setEditCatId(null);
                  setCatName('');
                }}>
                <Text style={[styles.modalButtonText, isDark && styles.modalButtonTextDark]}>
                  Annulla
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleCreateOrEditCat}>
                <Text style={styles.modalButtonTextWhite}>
                  {editCatId ? 'Salva' : 'Crea'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryPicker(false)}>
          <View style={[styles.pickerModal, isDark && styles.pickerModalDark]}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              Seleziona Categoria
            </Text>
            <ScrollView>
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={async () => {
                  setSelectedCategory(null);
                  await saveSelectedCategory(null);
                  setShowCategoryPicker(false);
                  Alert.alert('Filtro', 'Tutte le categorie');
                }}>
                <Text style={[styles.pickerItemText, isDark && styles.pickerItemTextDark]}>
                  Tutte le categorie
                </Text>
              </TouchableOpacity>

              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.pickerItem}
                  onPress={async () => {
                    setSelectedCategory(cat);
                    await saveSelectedCategory(cat.id);
                    setShowCategoryPicker(false);
                    Alert.alert('Filtro', cat.name);
                  }}>
                  <Text style={[styles.pickerItemText, isDark && styles.pickerItemTextDark]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth > 768 ? (screenWidth - 80) / 3 : (screenWidth - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderColor: 'rgba(147, 197, 253, 0.3)',
  },
  actionButtonGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    borderColor: 'rgba(134, 239, 172, 0.3)',
  },
  actionButtonPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.8)',
    borderColor: 'rgba(216, 180, 254, 0.3)',
  },
  actionIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  categoryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  newCategoryButton: {
    backgroundColor: 'rgba(234, 179, 8, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newCategoryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryPicker: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryPickerDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderColor: '#374151',
  },
  categoryPickerText: {
    color: '#333',
    fontSize: 14,
  },
  categoryPickerTextDark: {
    color: '#fff',
  },
  editCategoryButton: {
    backgroundColor: '#bfdbfe',
    padding: 8,
    borderRadius: 8,
  },
  editCategoryIcon: {
    fontSize: 16,
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
    marginTop: 24,
  },
  emptyStateDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#aaa',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  categoryTitleDark: {
    color: '#e5e7eb',
  },
  listsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  listCard: {
    width: cardWidth - 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
    position: 'relative',
  },
  listCardDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sharedBadge: {
    position: 'absolute',
    top: 8,
    left: 16,
    backgroundColor: 'rgba(192, 132, 252, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sharedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  listTitleDark: {
    color: '#fff',
  },
  listSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  listSubtitleDark: {
    color: '#aaa',
  },
  editButtons: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonBlue: {
    backgroundColor: 'rgba(147, 197, 253, 0.8)',
  },
  editButtonRed: {
    backgroundColor: 'rgba(252, 165, 165, 0.8)',
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fabMenuItemBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  fabMenuItemGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
  },
  fabMenuItemYellow: {
    backgroundColor: 'rgba(234, 179, 8, 0.8)',
  },
  fabMenuItemPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.8)',
  },
  fabMenuItemGray: {
    backgroundColor: 'rgba(107, 114, 128, 0.8)',
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
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalContentDark: {
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
  input: {
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
  inputDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  labelDark: {
    color: '#fff',
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#000',
    borderWidth: 3,
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
  },
  modalButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonTextDark: {
    color: '#fff',
  },
  modalButtonTextWhite: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  pickerModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
    marginTop: 'auto',
  },
  pickerModalDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
  },
  pickerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 200, 200, 0.3)',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextDark: {
    color: '#fff',
  },
});
