import React, { useEffect } from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useDispatch } from 'react-redux';
// import { loginWithGoogle } from '../redux/authActions'; // Uncomment when ready

export default function Auth() {
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. CONFIGURE GOOGLE SIGN IN IMMEDIATELY
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      // androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      console.log("SUCCESS! User Info:", userInfo);
      Alert.alert("Login Success", `Welcome ${userInfo.data?.user.name}`);
      
      // dispatch(loginWithGoogle(userInfo.data?.idToken));
      
    } catch (error: any) {
      console.log("ERROR CODE:", error.code);
      console.log("FULL ERROR:", error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Cancelled", "User cancelled the login flow");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("In Progress", "Sign in is already in progress");
      } else {
        Alert.alert("Error", error.message);
      }
    }
  };

  return (
    <View style={styles.containerLogin}>
      <Button style={styles.LoginBtn} title="Login with Google" onPress={handleGoogleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#e89678ff',
    borderRadius: 10, 
    overflow: 'hidden',
    paddingTop: 500,
  },
  LoginBtn: { 
    padding: 10, 
    borderRadius: 5, 
    backgroundColor: '#4285F4', 
    color: '#fff',
    marginTop: 100,
  },
});