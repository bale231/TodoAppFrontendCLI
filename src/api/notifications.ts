import {storage} from '../utils/storage';

const API_URL = 'https://bale231.pythonanywhere.com/api';

export interface Notification {
  id: number;
  type:
    | 'update_normal'
    | 'update_important'
    | 'friend_request'
    | 'list_modified'
    | 'general';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  from_user?: {
    name: string;
    surname: string;
    profile_picture?: string;
  };
  list_name?: string;
}

// GET - Fetch tutte le notifiche dell'utente
export const fetchNotifications = async (): Promise<Notification[]> => {
  const token = await storage.getItem('accessToken');

  if (!token) {
    throw new Error('Token non trovato');
  }

  const response = await fetch(`${API_URL}/notifications/`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Errore nel caricamento delle notifiche');
  }

  return await response.json();
};

// PATCH - Marca una notifica come letta
export const markNotificationAsRead = async (
  notificationId: number,
): Promise<void> => {
  const token = await storage.getItem('accessToken');

  if (!token) {
    throw new Error('Token non trovato');
  }

  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/read/`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Errore nel marcare la notifica come letta');
  }
};

// POST - Marca tutte le notifiche come lette
export const markAllNotificationsAsRead = async (): Promise<void> => {
  const token = await storage.getItem('accessToken');

  if (!token) {
    throw new Error('Token non trovato');
  }

  const response = await fetch(`${API_URL}/notifications/mark_all_read/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Errore nel marcare tutte le notifiche come lette');
  }
};

// DELETE - Elimina una notifica
export const deleteNotification = async (
  notificationId: number,
): Promise<void> => {
  const token = await storage.getItem('accessToken');

  if (!token) {
    throw new Error('Token non trovato');
  }

  const response = await fetch(`${API_URL}/notifications/${notificationId}/`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error("Errore nell'eliminazione della notifica");
  }
};

// POST - Crea una notifica manualmente (opzionale, per test)
export const createNotification = async (
  type: string,
  title: string,
  message: string,
  listName?: string,
): Promise<Notification> => {
  const token = await storage.getItem('accessToken');

  if (!token) {
    throw new Error('Token non trovato');
  }

  const response = await fetch(`${API_URL}/notifications/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      title,
      message,
      list_name: listName,
    }),
  });

  if (!response.ok) {
    throw new Error('Errore nella creazione della notifica');
  }

  return await response.json();
};
