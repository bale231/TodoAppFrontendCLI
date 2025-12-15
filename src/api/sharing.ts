import {getAuthHeaders} from './todos';

const API_URL = 'https://bale231.pythonanywhere.com/api';

export interface SharedUser {
  user_id: number;
  username: string;
  full_name: string;
  profile_picture: string | null;
  can_edit: boolean;
  shared_at: string;
}

// === LISTE (Category) ===

// Condividi lista con un utente
export async function shareList(
  listId: number,
  userId: number,
  canEdit: boolean,
): Promise<void> {
  const res = await fetch(`${API_URL}/lists/${listId}/share/`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({user_id: userId, can_edit: canEdit}),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Errore durante la condivisione');
  }
}

// Rimuovi condivisione lista
export async function unshareList(
  listId: number,
  userId: number,
): Promise<void> {
  const res = await fetch(`${API_URL}/lists/${listId}/share/${userId}/`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Errore durante la rimozione condivisione');
  }
}

// Ottieni lista utenti con cui è condivisa una lista
export async function getListShares(listId: number): Promise<SharedUser[]> {
  const res = await fetch(`${API_URL}/lists/${listId}/shares/`, {
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Errore caricamento condivisioni');
  return res.json();
}

// === CATEGORIE (ListCategory) ===

// Condividi categoria con un utente
export async function shareCategory(
  categoryId: number,
  userId: number,
  canEdit: boolean,
): Promise<void> {
  const res = await fetch(`${API_URL}/categories/${categoryId}/share/`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({user_id: userId, can_edit: canEdit}),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Errore durante la condivisione');
  }
}

// Rimuovi condivisione categoria
export async function unshareCategory(
  categoryId: number,
  userId: number,
): Promise<void> {
  const res = await fetch(`${API_URL}/categories/${categoryId}/share/${userId}/`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Errore durante la rimozione condivisione');
  }
}

// Ottieni lista utenti con cui è condivisa una categoria
export async function getCategoryShares(
  categoryId: number,
): Promise<SharedUser[]> {
  const res = await fetch(`${API_URL}/categories/${categoryId}/shares/`, {
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Errore caricamento condivisioni');
  return res.json();
}
