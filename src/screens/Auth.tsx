import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { AntDesign, FontAwesome } from '@expo/vector-icons'; 

import { 
  startManualGoogleLogin, 
  startFacebookLogin, 
  startAppleLogin, 
  logoutUser,
  clearAuthError // Import the clear action
} from '../redux/authActions';
import { THEME } from '../constants/theme';

// ... (THEME and PLACEHOLDER_IMAGE remain exactly as they were) ...
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8+R8AAnkB9X9086gAAAAASUVORK5CYII=';



export default function AuthScreen() {
  const dispatch = useDispatch<any>();
  // 1. Get ERROR from state
  const { user, isLoading, error } = useSelector((state: any) => state.auth);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2. ERROR LISTENER: Show Alert if login fails
  useEffect(() => {
    if (error) {
      Alert.alert(
        "Authentication Failed",
        error,
        [{ text: "OK", onPress: () => dispatch(clearAuthError()) }]
      );
    }
  }, [error, dispatch]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  // 3. LOGGED IN VIEW
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <View style={styles.profileCard}>
            <Image 
              source={{ uri: user.photoURL?.replace('s96-c', 's400-c') || PLACEHOLDER_IMAGE }} 
              style={styles.profileImage} 
            />
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.userName}>{user.displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            
            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={() => dispatch(logoutUser())}
            >
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 4. GUEST / FORM VIEW
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Image source={require('../assets/watching-tv.png')} style={styles.logoImage} />
            <Text style={styles.headerTitle}>MOVIES DB</Text>
          </View>

          {/* Input Fields */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput 
              style={styles.input} 
              placeholder="user@example.com" 
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>PASSWORD</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={() => Alert.alert("Use Google Sign-In for now")}>
              <Text style={styles.primaryBtnText}>
                {isLoginMode ? "LOG IN" : "SIGN UP"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.toggleContainer} 
              onPress={() => setIsLoginMode(!isLoginMode)}
            >
              <Text style={styles.toggleText}>
                {isLoginMode ? "New here? " : "Already have an account? "}
                <Text style={styles.toggleHighlight}>
                  {isLoginMode ? "Sign Up" : "Log In"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Icons */}
          <View style={styles.socialRow}>
            <TouchableOpacity 
              style={styles.socialIconBtn} 
              onPress={() => dispatch(startManualGoogleLogin())}
            >
              <AntDesign name="google" size={24} color="#EA4335" />
            </TouchableOpacity>

            {/* <TouchableOpacity 
              style={styles.socialIconBtn} 
              onPress={() => dispatch(startAppleLogin())}
            >
              <FontAwesome name="apple" size={24} color="#fff" />
            </TouchableOpacity> */}

            {/* <TouchableOpacity 
              style={styles.socialIconBtn} 
              onPress={() => dispatch(startFacebookLogin())}
            >
              <FontAwesome name="facebook" size={24} color="#1877F2" />
            </TouchableOpacity> */}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,  
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 70,
    height: 70,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 2,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.accent,
    marginBottom: 4,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: THEME.inputBg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: THEME.text,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: THEME.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 5,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  toggleContainer: {
    marginTop: 15,
    alignItems: 'center',
    padding: 5,
  },
  toggleText: {
    color: THEME.subText,
    fontSize: 16,
  },
  toggleHighlight: {
    color: THEME.accent,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: THEME.subText,
    fontWeight: 'bold',
    fontSize: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    paddingBottom: 10,
  },
  socialIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileCard: {
    backgroundColor: THEME.card,
    width: '90%',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: THEME.accent,
  },
  welcomeText: {
    color: THEME.subText,
    fontSize: 16,
  },
  userName: {
    color: THEME.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  userEmail: {
    color: THEME.accent,
    fontSize: 14,
    marginBottom: 30,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,0,0,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    color: '#ffe4e6',
    fontWeight: 'bold',
    fontSize: 16,
  },
});