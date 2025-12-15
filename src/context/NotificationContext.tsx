import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from 'react';
import {
  fetchNotifications as fetchNotificationsAPI,
  markNotificationAsRead as markNotificationAsReadAPI,
  markAllNotificationsAsRead as markAllNotificationsAsReadAPI,
  deleteNotification as deleteNotificationAPI,
} from '../api/notifications';

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

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  fetchNotifications: () => Promise<void>;
  requestPermission: () => Promise<void>;
  hasPermission: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within NotificationProvider',
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({
  children,
}: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // ✅ Traccia le notifiche già mostrate
  const shownNotifications = useRef<Set<number>>(new Set());

  const requestPermission = async () => {
    // TODO: Implementare richiesta permessi notifiche push per React Native
    // Questo richiederà configurazione specifica per iOS/Android
    setHasPermission(true);
  };

  const fetchNotifications = async () => {
    try {
      const data = await fetchNotificationsAPI();
      setNotifications(data);
    } catch (error) {
      console.error('Errore nel caricamento notifiche:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await markNotificationAsReadAPI(id);
      setNotifications(prev =>
        prev.map(notif => (notif.id === id ? {...notif, read: true} : notif)),
      );
    } catch (error) {
      console.error('Errore nel marcare come letta:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadAPI();
      setNotifications(prev => prev.map(notif => ({...notif, read: true})));
    } catch (error) {
      console.error('Errore nel marcare tutte come lette:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await deleteNotificationAPI(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      shownNotifications.current.delete(id);
    } catch (error) {
      console.error("Errore nell'eliminazione notifica:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showPopup,
        setShowPopup,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchNotifications,
        requestPermission,
        hasPermission,
      }}>
      {children}
    </NotificationContext.Provider>
  );
};
