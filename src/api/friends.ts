import {getAuthHeaders} from './todos';

const API_URL = 'https://bale231.pythonanywhere.com/api';

export interface User {
  id: number;
  username: string;
  full_name: string;
  profile_picture: string | null;
  friendship_status?:
    | 'none'
    | 'pending_sent'
    | 'pending_received'
    | 'rejected'
    | 'friends';
}

export interface FriendRequest {
  id: number;
  from_user: User;
  to_user: User;
  status: string;
  created_at: string;
}

export interface Friendship {
  id: number;
  friend: User;
  created_at: string;
}

// Ottieni lista utenti (esclusi amici)
export const fetchUsers = async (search?: string): Promise<User[]> => {
  const url = search
    ? `${API_URL}/users/?search=${encodeURIComponent(search)}`
    : `${API_URL}/users/`;

  const res = await fetch(url, {
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Errore caricamento utenti');
  return res.json();
};

// Ottieni lista amici
export const fetchFriends = async (): Promise<Friendship[]> => {
  const res = await fetch(`${API_URL}/friends/`, {
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Errore caricamento amici');
  return res.json();
};

// Ottieni richieste ricevute
export const fetchFriendRequests = async (): Promise<FriendRequest[]> => {
  const res = await fetch(`${API_URL}/friend-requests/`, {
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Errore caricamento richieste');
  return res.json();
};

// Invia richiesta amicizia
export const sendFriendRequest = async (userId: number): Promise<void> => {
  const res = await fetch(`${API_URL}/friend-requests/send/${userId}/`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Errore invio richiesta');
};

// Accetta richiesta
export const acceptFriendRequest = async (requestId: number): Promise<void> => {
  const res = await fetch(`${API_URL}/friend-requests/${requestId}/accept/`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Errore accettazione');
};

// Rifiuta richiesta
export const rejectFriendRequest = async (requestId: number): Promise<void> => {
  const res = await fetch(`${API_URL}/friend-requests/${requestId}/reject/`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Errore rifiuto');
};

// Rimuovi amico
export const removeFriend = async (userId: number): Promise<void> => {
  const res = await fetch(`${API_URL}/friends/${userId}/remove/`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Errore rimozione amico');
};
