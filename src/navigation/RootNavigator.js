import React, { useEffect, useRef, useMemo } from 'react';
import { Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux'; // <--- 1. Import Hooks
import {
  NavigationContainer,
  useNavigationContainerRef,
  useNavigation,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useBottomNavPadding } from '../hooks/useBottomNavPadding';//Android bottom syetem buttons issue
import { Ionicons } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient';
import { useHeaderHeight } from '@react-navigation/elements';

// import screens
import BooksList from '../screens/Movies.js';
import Favorites from '../screens/Favourites.js';
import Search    from '../screens/Search';
import Auth      from '../screens/Auth';

// import Auth Logic
import { GoogleSignin } from '@react-native-google-signin/google-signin'; 
import { checkAppLaunchStatus, closeAuthModal } from '../redux/authActions'; 
import GlobalAuthModal from '../components/GlobalAuthModal'; 
import { COLORS, GRADIENTS, THEME } from '../constants/theme'; // <--- Theme Imports




const MyTheme = {
  dark: true,
  colors: {
    primary: 'white',
    background: COLORS.primary, // Use Global Red
    card: 'white',
    text: 'white',
    border: 'rgb(199, 199, 204)',
    notification: COLORS.error,
  },
};

const ScreenTemplate = ({ children, headerPadding }) => {
  const headerHeight = useHeaderHeight();  
  return (
    <LinearGradient 
      colors={GRADIENTS.mainBackground}   // New Global Gradient
      style={{ flex: 1, paddingTop: headerPadding ? headerHeight : 0 }}
    >
      {children}
    </LinearGradient>
  )
}
const ScreenOne = () => {
  return (
    <ScreenTemplate headerPadding>
      <Search/>
    </ScreenTemplate>
  )
}
const ScreenTwo = () => {
  return (
    <ScreenTemplate headerPadding>
      <BooksList/>
    </ScreenTemplate>
  )
}
const ScreenThree = () => {
  return (
    <ScreenTemplate headerPadding>
      <Favorites/>
    </ScreenTemplate>
  )
}
const ScreenFour = () => {
  return (
    <ScreenTemplate headerPadding>
      <Auth/>
    </ScreenTemplate>
  )
}

const Tab = createBottomTabNavigator();


const RootNavigator = () => {  
  const bottomPadding = useBottomNavPadding();
  // 3. APPLY STYLES
  const tabBarOptions = {
    tabBarShowLabel: false,
    tabBarActiveTintColor: COLORS.accent, // Gold
    tabBarInactiveTintColor: 'rgba(235, 204, 204, 0.4)',
    tabBarStyle: {
      // Height = Standard Tab Height (60) + The Dynamic Padding
      height: 60 + bottomPadding,
      paddingBottom: bottomPadding,

      backgroundColor: THEME.navbar, 
      borderColor: 'white',
      borderTopWidth: 0,
      paddingHorizontal: 20,
    },
    headerTransparent: true,
  };
  const dispatch = useDispatch();  
  // We need 'user' state to decide logic in onStateChange
  const { user } = useSelector(state => state.auth); 
  const navigationRef = useNavigationContainerRef();
  // Track the previous route name for SIgn In modal logic
  const routeNameRef = useRef();


  return (    
    <NavigationContainer 
      theme={MyTheme}
      ref={navigationRef}
      // 2. Initialize the Ref when nav is ready
      onReady={() => {
        routeNameRef.current = navigationRef.current.getCurrentRoute().name;
      }}

      // 3. CENTRAL LOGIC: Handle Screen Changes
      onStateChange={(state) => {
        const previousRouteName = routeNameRef.current;
        // Get the current active tab name
        const currentRouteName = state.routes[state.index].name;

        // LOGIC A: If entering Auth screen -> HIDE Modal immediately
        if (currentRouteName === 'Auth') {
           dispatch(closeAuthModal());
        }

        // LOGIC B: If leaving Auth screen -> SHOW Modal (if still guest)
        if (previousRouteName === 'Auth' && currentRouteName !== 'Auth') {
           if (!user) {
             // Nudge them to login if they leave without signing in
             dispatch({ type: 'SHOW_MODAL', payload: 'LOGIN_OPTIONS' });
           }
        }

        // Save current route for next comparison
        routeNameRef.current = currentRouteName;
      }}
    >
      
      <GlobalAuthModal />

      <Tab.Navigator screenOptions={tabBarOptions}>          
            <Tab.Screen
              name="Search"
              component={ScreenOne}
              options={{
                tabBarIcon: ({color, size}) => (  
                  <Ionicons name="search-outline" color={color} size={size} />    
                ), 
              }}
            />        
            <Tab.Screen
              name="Movies"
              component={ScreenTwo}
              options={{
                tabBarIcon: ({color, size}) => (
                  <Ionicons name="film-outline" color={color} size={size} />                               
                ),
              }}
            />
            <Tab.Screen
              name="Favourites"
              component={ScreenThree}
              options={{
                tabBarIcon: ({color, size}) => (
                  <Ionicons name="heart-outline" color={color} size={size} />
                ),
              }}
            />

            <Tab.Screen
              name="Auth"
              component={ScreenFour}
              options={{
                tabBarIcon: ({color, size}) => (
                  <Ionicons name="person-circle-outline" color={color} size={size} />
                ),
              }}
            />
           
      </Tab.Navigator>    
    </NavigationContainer>    
  );
};

export default RootNavigator;