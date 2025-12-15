/* eslint-disable @typescript-eslint/no-explicit-any */
import {storage} from '../utils/storage';

const API_URL = 'https://bale231.pythonanywhere.com/api';

export async function getAuthHeaders() {
  const token = await storage.getItem('accessToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// --- 📋 LISTE ---
export async function fetchAllLists() {
  const res = await fetch(`${API_URL}/lists/`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  return res.json();
}

export async function fetchListDetails(listId: number | string) {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/lists/${listId}/`, {
    method: 'GET',
    headers: headers,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('❌ RESPONSE TEXT:', text);
  }

  return res.json();
}

export async function renameList(listId: number, newName: string) {
  const res = await fetch(`${API_URL}/lists/${listId}/rename/`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({name: newName}),
  });
  return res.json();
}

// ✅ Modifica lista con categoria (PUT su /lists/:id/)
export async function editList(
  listId: number,
  name: string,
  color: string,
  categoryId?: number | null,
) {
  const body: Record<string, any> = {name, color};
  if (typeof categoryId !== 'undefined') body.category = categoryId;
  const res = await fetch(`${API_URL}/lists/${listId}/`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function createList(
  name: string,
  color: string,
  categoryId?: number | null,
) {
  const body: Record<string, any> = {name, color};
  if (typeof categoryId !== 'undefined') body.category = categoryId;
  const res = await fetch(`${API_URL}/lists/`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function deleteList(listId: number) {
  const res = await fetch(`${API_URL}/lists/${listId}/`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  return res.json();
}

// --- 📂 CATEGORIE ---
// Lista tutte le categorie
export async function fetchAllCategories() {
  const res = await fetch(`${API_URL}/categories/`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  return res.json();
}

// Crea una nuova categoria
export async function createCategory(name: string) {
  const res = await fetch(`${API_URL}/categories/`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({name}),
  });
  return res.json();
}

// Modifica una categoria
export async function editCategory(categoryId: number, name: string) {
  const res = await fetch(`${API_URL}/categories/${categoryId}/`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({name}),
  });
  return res.json();
}

// Elimina una categoria
export async function deleteCategory(categoryId: number) {
  const res = await fetch(`${API_URL}/categories/${categoryId}/`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  return res.json();
}

// --- ✅ TODOS ---
export async function createTodo(
  listId: number | string,
  title: string,
  quantity?: number | null,
  unit?: string | null,
) {
  const body: Record<string, any> = {title};
  if (quantity !== undefined && quantity !== null) body.quantity = quantity;
  if (unit !== undefined && unit !== null) body.unit = unit;

  const res = await fetch(`${API_URL}/lists/${listId}/todos/`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function toggleTodo(todoId: number) {
  const res = await fetch(`${API_URL}/todos/${todoId}/toggle/`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
  });
  return res.json();
}

export async function deleteTodo(todoId: number) {
  const res = await fetch(`${API_URL}/todos/${todoId}/`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  return res.json();
}

// ✅ PATCH modifica titolo di una ToDo (e opzionalmente quantità/unità)
export async function updateTodo(
  todoId: number,
  title: string,
  quantity?: number | null,
  unit?: string | null,
) {
  const body: Record<string, any> = {title};
  if (quantity !== undefined) body.quantity = quantity;
  if (unit !== undefined) body.unit = unit;

  const res = await fetch(`${API_URL}/todos/${todoId}/update/`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

// ✅ POST per riordinare le ToDo
export async function reorderTodos(
  listId: string | undefined,
  order: number[],
) {
  const res = await fetch(`${API_URL}/lists/${listId}/reorder/`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({order}),
  });
  return res.json();
}

// ✅ PATCH per modificare l'ordine
export async function updateSortOrder(
  listId: number | string,
  sortOrder: string,
) {
  const res = await fetch(`${API_URL}/lists/${listId}/sort_order/`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({sort_order: sortOrder}),
  });
  return res.json();
}

// ✅ PATCH per spostare una ToDo in un'altra lista
export async function moveTodo(todoId: number, newListId: number) {
  const res = await fetch(`${API_URL}/todos/${todoId}/move/`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({new_list_id: newListId}),
  });
  return res.json();
}

// --- 🎯 PREFERENZE CATEGORIA ---
// Salva la categoria selezionata dall'utente
export async function saveSelectedCategory(categoryId: number | null) {
  const res = await fetch(`${API_URL}/categories/selected/`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({selected_category: categoryId}),
  });
  return res.json();
}

// Recupera la categoria selezionata dall'utente
export async function getSelectedCategory() {
  const res = await fetch(`${API_URL}/categories/selected/`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  return res.json();
}
