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
