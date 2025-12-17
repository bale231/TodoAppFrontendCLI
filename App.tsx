/**
 * TodoApp Frontend CLI
 * React Native App
 *
 * @format
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import {NotificationProvider} from './src/context/NotificationContext';

// Import pages
import Login from './src/pages/Login';
import Register from './src/pages/Register';
import Home from './src/pages/Home';
import ToDoListPage from './src/pages/ToDoListPage';
import ForgotPassword from './src/pages/ForgotPassword';
import Profile from './src/pages/Profile';
import UsersPage from './src/pages/UsersPage';
import FriendsPage from './src/pages/FriendsPage';
import FriendRequestsPage from './src/pages/FriendRequestsPage';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const {theme} = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
          initialRouteName="Login">
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="ToDoListPage" component={ToDoListPage} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="UsersPage" component={UsersPage} />
          <Stack.Screen name="FriendsPage" component={FriendsPage} />
          <Stack.Screen name="FriendRequestsPage" component={FriendRequestsPage} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppNavigator />
        </NotificationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
