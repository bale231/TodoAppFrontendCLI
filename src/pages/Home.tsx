/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {BlurView} from '@react-native-community/blur';
import {useTheme} from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import {getCurrentUserJWT} from '../api/auth';
import {
  fetchAllLists,
  createList,
  editList as editListAPI,
  deleteList,
  getSelectedCategory,
  saveSelectedCategory,
} from '../api/todos';
import {storage} from '../utils/storage';

// ===== INTERFACES (exact same as webapp) =====
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

// ===== COLOR MAPPING (exact same as webapp) =====
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

  // ===== ALL STATE VARIABLES (exact same as webapp lines 66-97) =====
  const [user, setUser] = useState<any>(null);
  const [lists, setLists] = useState<TodoList[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('blue');
  const [newListCategory, setNewListCategory] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editListId, setEditListId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [sortOption, setSortOption] = useState<'created' | 'name' | 'complete'>('created');
  const [categorySortAlpha, setCategorySortAlpha] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareItemId, setShareItemId] = useState<number | null>(null);
  const [shareItemName, setShareItemName] = useState('');
  const [shareItemType, setShareItemType] = useState<'list' | 'category'>('list');

  // ===== ANIMATION REFS =====
  const fabRotation = useRef(new Animated.Value(0)).current;
  const menuTranslateY = useRef(new Animated.Value(50)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(-30)).current;
  const boxOpacity = useRef(new Animated.Value(0)).current;
  const boxTranslateY = useRef(new Animated.Value(20)).current;

  // ===== HELPER FUNCTION: getAccessToken (exact translation) =====
  const getAccessToken = async () => {
    const token = await storage.getItem('accessToken');
    return token || '';
  };

  // ===== useEffect 1: loadUserAndPref (lines 114-151) =====
  useEffect(() => {
    const loadUserAndPref = async () => {
      const resUser = await getCurrentUserJWT();
      if (!resUser) {
        navigation.navigate('Login');
        return;
      }
      setUser(resUser);

      try {
        const token = await getAccessToken();
        const res = await fetch(`${API_URL}/lists/sort_order/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const {sort_order} = await res.json();
          setSortOption(
            sort_order === 'alphabetical'
              ? 'name'
              : sort_order === 'complete'
              ? 'complete'
              : 'created'
          );
        }

        const catRes = await fetch(`${API_URL}/categories/sort_preference/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (catRes.ok) {
          const {category_sort_alpha} = await catRes.json();
          setCategorySortAlpha(category_sort_alpha);
        }
      } catch (err) {
        console.error('Impossibile caricare preferenze:', err);
      }
    };
    loadUserAndPref();
  }, [navigation]);

  // ===== useEffect 2: fetchLists + fetchCategories + animations (lines 153-178) =====
  useEffect(() => {
    if (user) {
      fetchListsData();
      fetchCategoriesData();

      // Initial page animations (GSAP equivalent)
      if (!hasAnimated) {
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(boxOpacity, {
            toValue: 1,
            delay: 200,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(boxTranslateY, {
            toValue: 0,
            delay: 200,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
        setHasAnimated(true);
      }
    }
  }, [user, hasAnimated]);

  // ===== useEffect 3: Modal animation for showForm (lines 180-188) =====
  useEffect(() => {
    if (showForm) {
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
  }, [showForm]);

  // ===== useEffect 4: Modal animation for showCatForm (lines 190-198) =====
  useEffect(() => {
    if (showCatForm) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showCatForm]);

  // ===== FAB menu animation =====
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

  // ===== Alert auto-dismiss =====
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // ===== fetchLists (lines 234-245) =====
  const fetchListsData = async () => {
    try {
      const data = await fetchAllLists();
      if (Array.isArray(data)) {
        setLists(data);
      } else {
        console.error('Formato risposta non valido:', data);
      }
    } catch (err) {
      console.error('Errore nel caricamento liste:', err);
    }
  };

  // ===== fetchCategories (lines 247-265) =====
  const fetchCategoriesData = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/categories/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);

        // Load selected category
        await loadSelectedCategoryData(data);
      }
    } catch (err) {
      console.error('Errore caricamento categorie:', err);
    }
  };

  // ===== loadSelectedCategory (lines 267-279) =====
  const loadSelectedCategoryData = async (categoriesData: Category[]) => {
    try {
      const result = await getSelectedCategory();
      if (result && result.selected_category !== null && result.selected_category !== undefined) {
        const cat = categoriesData.find((c) => c.id === result.selected_category);
        if (cat) {
          setSelectedCategory(cat);
        }
      }
    } catch (err) {
      console.error('Errore caricamento categoria selezionata:', err);
    }
  };

  // ===== handleCreateList (lines 281-327) =====
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setAlert({type: 'warning', message: 'Inserisci un nome per la lista'});
      return;
    }

    const payload = {
      name: newListName,
      color: newListColor,
      category: newListCategory,
    };

    try {
      if (editListId !== null) {
        await editListAPI(editListId, newListName, newListColor, newListCategory);
        setAlert({
          type: 'success',
          message: 'Lista modificata con successo!',
        });
        setEditListId(null);
      } else {
        const token = await getAccessToken();
        const res = await fetch(`${API_URL}/lists/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          setAlert({
            type: 'error',
            message: 'Errore nella creazione della lista',
          });
          return;
        }
        setAlert({type: 'success', message: 'Lista creata con successo!'});
      }
      fetchListsData();
      setNewListName('');
      setNewListColor('blue');
      setShowForm(false);
      setNewListCategory(null);
    } catch (err) {
      setAlert({type: 'error', message: 'Errore di connessione'});
    }
  };

  // ===== handleEditList (lines 329-336) =====
  const handleEditList = (list: TodoList) => {
    setEditListId(list.id);
    setNewListName(list.name);
    setNewListColor(list.color);
    setNewListCategory(list.category ? list.category.id : null);
    setShowForm(true);
  };

  // ===== handleSortChange (lines 337-366) =====
  const handleSortChange = async (newOpt: 'created' | 'name' | 'complete') => {
    setSortOption(newOpt);
    const backendOrder =
      newOpt === 'name'
        ? 'alphabetical'
        : newOpt === 'complete'
        ? 'complete'
        : 'created';

    const messages = {
      created: 'Ordinamento: Più recente',
      name: 'Ordinamento: Alfabetico',
      complete: 'Ordinamento: Per completezza',
    };

    setAlert({type: 'success', message: messages[newOpt]});

    try {
      const token = await getAccessToken();
      await fetch(`${API_URL}/lists/sort_order/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({sort_order: backendOrder}),
      });
    } catch (err) {
      console.error('Errore salvataggio ordinamento:', err);
    }
  };

  // ===== deleteListAsync (lines 368-377) =====
  const deleteListAsync = async (id: number) => {
    try {
      await deleteList(id);
      fetchListsData();
      setShowDeleteConfirm(null);
      setAlert({type: 'success', message: 'Lista eliminata'});
    } catch (err) {
      setAlert({type: 'error', message: "Errore nell'eliminazione"});
    }
  };

  // ===== handleDeleteList (lines 379-401) - with shake animation =====
  const handleDeleteList = async (id: number) => {
    // Create shake animation (GSAP equivalent)
    const shakeAnim = new Animated.Value(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: -3, duration: 100, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 3, duration: 100, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -3, duration: 100, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0, duration: 100, useNativeDriver: true}),
    ]).start(() => {
      deleteListAsync(id);
    });
  };

  // ===== handleCreateOrEditCat (lines 403-446) =====
  const handleCreateOrEditCat = async () => {
    if (!catName.trim()) {
      setAlert({
        type: 'warning',
        message: 'Inserisci un nome per la categoria',
      });
      return;
    }

    const url = editCatId
      ? `${API_URL}/categories/${editCatId}/`
      : `${API_URL}/categories/`;
    const method = editCatId ? 'PATCH' : 'POST';

    try {
      const token = await getAccessToken();
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({name: catName}),
      });

      if (!res.ok) {
        setAlert({
          type: 'error',
          message: 'Errore nella gestione della categoria',
        });
        return;
      }

      fetchCategoriesData();
      setShowCatForm(false);
      setEditCatId(null);
      setCatName('');
      setAlert({
        type: 'success',
        message: editCatId ? 'Categoria modificata!' : 'Categoria creata!',
      });
    } catch (err) {
      setAlert({type: 'error', message: 'Errore di connessione'});
    }
  };

  // ===== handleEditCat (lines 448-452) =====
  const handleEditCat = (cat: Category) => {
    setEditCatId(cat.id);
    setCatName(cat.name);
    setShowCatForm(true);
  };

  // ===== FILTER AND SORT LOGIC (lines 454-506) - EXACT SAME =====
  const filteredLists = selectedCategory
    ? lists.filter((l) => l.category && l.category.id === selectedCategory.id)
    : lists;

  const sortedLists = [...filteredLists].sort((a, b) => {
    if (sortOption === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'complete') {
      const aComplete =
        a.todos.filter((t) => t.completed).length / (a.todos.length || 1);
      const bComplete =
        b.todos.filter((t) => t.completed).length / (b.todos.length || 1);
      return bComplete - aComplete;
    } else {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  });

  const groupedLists: {categoryName: string; lists: TodoList[]}[] = [];

  if (!selectedCategory) {
    const uncategorized = sortedLists.filter((l) => !l.category);
    if (uncategorized.length > 0) {
      groupedLists.push({
        categoryName: 'Senza categoria',
        lists: uncategorized,
      });
    }

    const categoriesWithLists = categories
      .map((cat) => {
        const listsInCat = sortedLists.filter(
          (l) => l.category && l.category.id === cat.id
        );
        return {categoryName: cat.name, lists: listsInCat};
      })
      .filter((group) => group.lists.length > 0);

    if (categorySortAlpha) {
      categoriesWithLists.sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName)
      );
    }

    groupedLists.push(...categoriesWithLists);
  } else {
    groupedLists.push({
      categoryName: selectedCategory.name,
      lists: sortedLists,
    });
  }

  // ===== LOADING STATE (lines 508-514) =====
  if (!user) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.loadingContainer]}>
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
          Caricamento...
        </Text>
      </View>
    );
  }

  const rotate = fabRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // ===== MAIN RENDER =====
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Navbar navigation={navigation} />

      {/* Custom Alert (AnimatedAlert equivalent) */}
      {alert && (
        <Animated.View
          style={[
            styles.alertContainer,
            alert.type === 'success' && styles.alertSuccess,
            alert.type === 'error' && styles.alertError,
            alert.type === 'warning' && styles.alertWarning,
          ]}>
          <Text style={styles.alertText}>{alert.message}</Text>
        </Animated.View>
      )}

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Quick Action Buttons (lines 530-552) */}
        <Animated.View
          style={[
            styles.actionButtons,
            {opacity: boxOpacity, transform: [{translateY: boxTranslateY}]},
          ]}>
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
        </Animated.View>

        {/* Category Controls (lines 554-604) */}
        <View style={styles.categoryControls}>
          <TouchableOpacity
            style={styles.newCategoryButton}
            onPress={() => {
              setShowCatForm(true);
              setEditCatId(null);
              setCatName('');
            }}>
            <Text style={styles.newCategoryText}>+ Nuova Categoria</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryPicker, isDark && styles.categoryPickerDark]}
            onPress={() => {
              // Show category picker modal (simplified - in webapp it's a select)
              Alert.alert(
                'Seleziona Categoria',
                '',
                [
                  {
                    text: 'Tutte le categorie',
                    onPress: async () => {
                      setSelectedCategory(null);
                      try {
                        await saveSelectedCategory(null);
                        setAlert({
                          type: 'success',
                          message: 'Filtro: Tutte le categorie',
                        });
                      } catch (err) {
                        console.error(err);
                      }
                    },
                  },
                  ...categories.map((cat) => ({
                    text: cat.name,
                    onPress: async () => {
                      setSelectedCategory(cat);
                      try {
                        await saveSelectedCategory(cat.id);
                        setAlert({
                          type: 'success',
                          message: `Filtro: ${cat.name}`,
                        });
                      } catch (err) {
                        console.error(err);
                      }
                    },
                  })),
                  {text: 'Annulla', style: 'cancel'},
                ]
              );
            }}>
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

        {/* Empty State (lines 606-612) */}
        {sortedLists.length === 0 && (
          <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Qui andranno le tue liste ToDo animate
            </Text>
          </View>
        )}

        {/* Lists Grid (lines 614-751) */}
        {groupedLists.map((group, groupIdx) => (
          <View key={groupIdx} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, isDark && styles.categoryTitleDark]}>
              {group.categoryName}
            </Text>
            <View style={styles.listsGrid}>
              {group.lists.map((list) => {
                const completed = list.todos.filter((t) => t.completed).length;
                const pending = list.todos.length - completed;
                const colors = colorMap[list.color] || colorMap.blue;

                return (
                  <TouchableOpacity
                    key={list.id}
                    style={[
                      styles.listCard,
                      isDark && styles.listCardDark,
                      {borderLeftColor: colors.border, borderLeftWidth: 4},
                      editMode && styles.listCardWiggle,
                    ]}
                    onPress={() => navigation.navigate('ToDoListPage', {listId: list.id})}
                    activeOpacity={0.8}>
                    {/* Shared badge (lines 642-647) */}
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

                    {/* Edit mode buttons (lines 674-716) */}
                    {editMode && (
                      <View style={styles.editButtons}>
                        {/* Share button - only for owned lists */}
                        {list.is_owner !== false && (
                          <TouchableOpacity
                            style={[styles.editButton, styles.editButtonPurple]}
                            onPress={(e) => {
                              setShareItemId(list.id);
                              setShareItemName(list.name);
                              setShareItemType('list');
                              setShareModalOpen(true);
                            }}>
                            <Text>🔗</Text>
                          </TouchableOpacity>
                        )}
                        {/* Edit and Delete buttons - only for owned lists */}
                        {list.is_owner !== false && (
                          <>
                            <TouchableOpacity
                              style={[styles.editButton, styles.editButtonBlue]}
                              onPress={() => handleEditList(list)}>
                              <Text>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.editButton, styles.editButtonRed]}
                              onPress={() => setShowDeleteConfirm(list.id)}>
                              <Text>🗑️</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}

                    {/* Delete confirmation (lines 717-743) */}
                    {showDeleteConfirm === list.id && (
                      <View style={styles.deleteConfirm}>
                        <Text style={styles.deleteConfirmText}>
                          Confermi eliminazione?
                        </Text>
                        <View style={styles.deleteConfirmButtons}>
                          <TouchableOpacity
                            style={styles.deleteConfirmYes}
                            onPress={() => handleDeleteList(list.id)}>
                            <Text style={styles.deleteConfirmYesText}>Sì</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.deleteConfirmNo, isDark && styles.deleteConfirmNoDark]}
                            onPress={() => setShowDeleteConfirm(null)}>
                            <Text style={[styles.deleteConfirmNoText, isDark && styles.deleteConfirmNoTextDark]}>
                              No
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* FAB Menu (lines 754-895) */}
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
          {/* Nuova Lista (lines 764-778) */}
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
            <Text style={styles.fabMenuIcon}>+</Text>
            <Text style={styles.fabMenuText}>Nuova Lista</Text>
          </TouchableOpacity>

          {/* Modifica Liste (lines 780-798) */}
          <TouchableOpacity
            style={[styles.fabMenuItem, styles.fabMenuItemGreen]}
            onPress={() => {
              const newMode = !editMode;
              setEditMode(newMode);
              setMenuOpen(false);
              setAlert({
                type: newMode ? 'warning' : 'success',
                message: newMode
                  ? 'Modalità modifica attivata'
                  : 'Modalità modifica disattivata',
              });
            }}>
            <Text style={styles.fabMenuIcon}>✏️</Text>
            <Text style={styles.fabMenuText}>Modifica Liste</Text>
          </TouchableOpacity>

          {/* Filtro ordinamento (lines 800-830) */}
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
            <Text style={styles.fabMenuIcon}>🔄</Text>
            <Text style={styles.fabMenuText}>
              {sortOption === 'created'
                ? 'Più recente'
                : sortOption === 'name'
                ? 'Alfabetico'
                : 'Per completezza'}
            </Text>
          </TouchableOpacity>

          {/* Ordine alfabetico categorie (lines 832-877) */}
          {!selectedCategory && (
            <TouchableOpacity
              style={[
                styles.fabMenuItem,
                categorySortAlpha
                  ? styles.fabMenuItemPurple
                  : styles.fabMenuItemGray,
              ]}
              onPress={async () => {
                const newValue = !categorySortAlpha;
                setCategorySortAlpha(newValue);
                setMenuOpen(false);

                setAlert({
                  type: 'success',
                  message: newValue ? 'Ordine A-Z attivato' : 'Ordine A-Z disattivato',
                });

                try {
                  const token = await getAccessToken();
                  await fetch(`${API_URL}/categories/sort_preference/`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({category_sort_alpha: newValue}),
                  });
                } catch (err) {
                  console.error('Errore nel salvataggio preferenza categoria:', err);
                }
              }}>
              <Text style={styles.fabMenuIcon}>
                {categorySortAlpha ? '✓' : 'A-Z'}
              </Text>
              <Text style={styles.fabMenuText}>
                {categorySortAlpha ? 'Ordine A-Z attivo' : 'Ordine A-Z'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Main FAB button (lines 880-895) */}
        <Animated.View style={{transform: [{rotate}]}}>
          <TouchableOpacity
            style={styles.fab}
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

      {/* Create/Edit List Modal (lines 897-963) */}
      <Modal visible={showForm} transparent animationType="none">
        <BlurView
          style={styles.modalOverlay}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={20}>
          <Pressable
            style={styles.modalOverlayPressable}
            onPress={() => {
              setShowForm(false);
              setEditListId(null);
              setNewListName('');
              setNewListColor('blue');
              setNewListCategory(null);
            }}>
            <Animated.View
              style={{
                opacity: modalOpacity,
                transform: [{scale: modalScale}],
              }}>
              <Pressable
                style={[styles.modalContent, isDark && styles.modalContentDark]}
                onPress={() => {}}>
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

                {/* Color picker */}
                <View style={styles.colorPickerContainer}>
                  {Object.keys(colorMap).map((color) => (
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

                {/* Category picker (simplified) */}
                <TouchableOpacity
                  style={[styles.categorySelectButton, isDark && styles.categorySelectButtonDark]}
                  onPress={() => {
                    Alert.alert(
                      'Seleziona Categoria',
                      '',
                      [
                        {
                          text: 'Senza categoria',
                          onPress: () => setNewListCategory(null),
                        },
                        ...categories.map((cat) => ({
                          text: cat.name,
                          onPress: () => setNewListCategory(cat.id),
                        })),
                        {text: 'Annulla', style: 'cancel'},
                      ]
                    );
                  }}>
                  <Text style={[styles.categorySelectText, isDark && styles.categorySelectTextDark]}>
                    {newListCategory
                      ? categories.find((c) => c.id === newListCategory)?.name || 'Senza categoria'
                      : 'Senza categoria'}
                  </Text>
                </TouchableOpacity>

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
            </Animated.View>
          </Pressable>
        </BlurView>
      </Modal>

      {/* Create/Edit Category Modal (lines 965-999) */}
      <Modal visible={showCatForm} transparent animationType="none">
        <BlurView
          style={styles.modalOverlay}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={20}>
          <Pressable
            style={styles.modalOverlayPressable}
            onPress={() => {
              setShowCatForm(false);
              setEditCatId(null);
              setCatName('');
            }}>
            <Animated.View
              style={{
                opacity: modalOpacity,
                transform: [{scale: modalScale}],
              }}>
              <Pressable
                style={[styles.modalContent, isDark && styles.modalContentDark]}
                onPress={() => {}}>
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
            </Animated.View>
          </Pressable>
        </BlurView>
      </Modal>

      {/* TODO: Share Modal - webapp lines 1001-1017 */}
      {/* Note: ShareModal component needs to be created separately */}
    </View>
  );
}

// ===== STYLES =====
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  loadingTextDark: {
    color: '#999',
  },
  alertContainer: {
    position: 'absolute',
    top: 100,
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listCardDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  listCardWiggle: {
    // Wiggle animation would be applied here via Animated
  },
  sharedBadge: {
    position: 'absolute',
    top: 8,
    left: 16,
    backgroundColor: 'rgba(192, 132, 252, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 20,
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
    top: 32,
    right: 8,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  deleteConfirm: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  deleteConfirmText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteConfirmYes: {
    flex: 1,
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteConfirmYesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteConfirmNo: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
  },
  deleteConfirmNoDark: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  deleteConfirmNoText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteConfirmNoTextDark: {
    color: '#aaa',
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
    width: '85%',
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
  colorPickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'center',
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
  categorySelectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  categorySelectButtonDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categorySelectText: {
    color: '#333',
    fontSize: 16,
  },
  categorySelectTextDark: {
    color: '#fff',
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
});
