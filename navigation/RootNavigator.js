import React from 'react';
import { useColorScheme } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntIcon from 'react-native-vector-icons/AntDesign';



import {LinearGradient} from 'expo-linear-gradient';
import { useHeaderHeight } from '@react-navigation/elements';



// import screens
import BooksList from '../screens/Movies.js';
import Favorites from '../screens/Favorites';
import Search    from '../screens/Search';

console.log(BooksList)

const MyTheme = {
  dark: true,
  colors: {
    primary: 'white',
    background: '#7A0000',
    card: 'white',
    text: 'white',
    border: 'rgb(199, 199, 204)',
    notification: 'rgb(255, 69, 58)',
  },
};


const ScreenTemplate = ({ children, headerPadding }) => {

  const headerHeight = useHeaderHeight();  
  return (
    <LinearGradient 
      colors={['#360000', '#7A0000']}
      //colors={['#5A0003', '#360000', '#7A0000']}
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



const Tab = createBottomTabNavigator();
const tabBarOptions = {
  tabBarShowLabel: false,
  tabBarActiveTintColor: 'rgba(235, 204, 204, 1)',
  tabBarInactiveTintColor: 'rgba(235, 204, 204, 0.4)',
  tabBarStyle: {
    height: '7%',
    backgroundColor: '#7F0000',
    borderColor: 'white',
    borderTopWidth: 0,
  },
  headerStyle: {
    backgroundColor: 'green',
  },
  headerTransparent: true
};
const RootNavigator = () => {
  
  return (
    
    <NavigationContainer theme={MyTheme}>
      <Tab.Navigator screenOptions={tabBarOptions}>
          
            <Tab.Screen
              name="Search"
              component={ScreenOne}
              options={{
                tabBarIcon: ({color, size}) => (              
                  <AntIcon name="search1" color={color} size={size} />
                ), 
              }}
            />
        
            <Tab.Screen
              name="Movies"
              component={ScreenTwo}
              options={{
                tabBarIcon: ({color, size}) => (
                  <AntIcon name="videocamera" color={color} size={size} />              
                ),
              }}
            />
            <Tab.Screen
              name="Favorites"
              component={ScreenThree}
              options={{
                tabBarIcon: ({color, size}) => (
                  <AntIcon name="hearto" color={color} size={size} />
                ),
              }}
            />
         
       
      </Tab.Navigator>    
    </NavigationContainer>
    
  );
};
export default RootNavigator;