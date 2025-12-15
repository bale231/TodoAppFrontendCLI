// ✅ src/api/auth.ts
import {storage} from '../utils/storage';

const API_URL = 'https://bale231.pythonanywhere.com/api';

// 🔐 Funzione login con JWT
export const login = async (
  username: string,
  password: string,
  rememberMe: boolean = false,
) => {
  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        username,
        password,
        remember_me: rememberMe,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Salva i token in AsyncStorage
      await storage.setItem('accessToken', data.access);
      await storage.setItem('refreshToken', data.refresh);
      await storage.setItem('rememberMe', rememberMe.toString());

      return {
        success: true,
        accessToken: data.access,
        refreshToken: data.refresh,
        user: data.user,
        rememberMe: data.remember_me,
      };
    }

    console.log(
      'Login failed with status:',
      response.status,
      'message:',
      data.message,
    );
    return {success: false, message: data.message || 'Invalid credentials'};
  } catch (error) {
    return {success: false, message: 'Errore di connessione'};
  }
};

async function refreshTokenIfNeeded(): Promise<string | null> {
  const refresh = await storage.getItem('refreshToken');

  if (!refresh) return null;

  try {
    const res = await fetch(`${API_URL}/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({refresh}),
    });

    if (!res.ok) return null;

    const data = await res.json();

    await storage.setItem('accessToken', data.access);

    return data.access;
  } catch (err) {
    console.error('Errore nel refresh del token:', err);
    return null;
  }
}

// 🔐 Recupero utente corrente tramite JWT
export async function getCurrentUserJWT() {
  let token = await storage.getItem('accessToken');

  if (!token) return null;

  let res = await fetch(`${API_URL}/jwt-user/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    console.warn('🔁 Token scaduto, provo a rinnovarlo...');
    const newToken = await refreshTokenIfNeeded();

    if (!newToken) return null;

    token = newToken;
    res = await fetch(`${API_URL}/jwt-user/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  if (!res.ok) return null;

  const data = await res.json();
  console.log('👤 Utente JWT:', data);
  return data;
}

// 🔄 Logout locale
export async function logout() {
  await storage.removeItem('accessToken');
  await storage.removeItem('refreshToken');
  await storage.removeItem('theme');
  await storage.removeItem('rememberMe');
}

// 📝 Register
export const register = async (
  username: string,
  email: string,
  password: string,
) => {
  const res = await fetch(`${API_URL}/register/`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, email, password}),
  });

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return {error: 'Server error', html: text};
  }
};

// 🧑‍💻 Update profile
export const updateProfile = async (formData: FormData) => {
  const token = await storage.getItem('accessToken');
  const res = await fetch(`${API_URL}/update-profile-jwt/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
    body: formData,
  });
  return res.json();
};

// 🔐 Invia reset password
export const resetPassword = async () => {
  const token = await storage.getItem('accessToken');
  const res = await fetch(`${API_URL}/reset-password/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
};

// 🔐 Aggiorna password da token
export const updatePassword = async (
  uid: string,
  token: string,
  newPassword: string,
) => {
  const res = await fetch(`${API_URL}/reset-password/${uid}/${token}/`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({password: newPassword}),
  });
  return res.json();
};

// 📧 Verifica email
export const sendVerificationEmail = async () => {
  const token = await storage.getItem('accessToken');
  const res = await fetch(`${API_URL}/send-verification-email/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
};

// ❌ Elimina account
export const deactivateAccount = async () => {
  const token = await storage.getItem('accessToken');
  const res = await fetch(`${API_URL}/delete-account/`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
};

// 🎨 Cambia tema
export const updateTheme = async (theme: string) => {
  const token = await storage.getItem('accessToken');
  const res = await fetch(`${API_URL}/update-theme/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({theme}),
  });
  return res.json();
};

// 🔔 Aggiorna preferenze notifiche push
export const updateNotificationPreferences = async (pushEnabled: boolean) => {
  const token = await storage.getItem('accessToken');
  const res = await fetch(`${API_URL}/notifications/preferences/`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({push_notifications_enabled: pushEnabled}),
  });
  return res.json();
};
