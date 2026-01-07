import React, { useState, useEffect, useRef } from 'react';
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
  startAppleLogin, 
  logoutUser,
  clearAuthError
} from '../redux/authActions';
import { THEME } from '../constants/theme';
import { SafeAvatar } from '../components/SafeAvatar';

export default function AuthScreen() {
  const dispatch = useDispatch<any>();
  const { user, isLoading, error } = useSelector((state: any) => state.auth);

  const activeProviderRef = useRef<'google' | 'apple' | null>(null);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Auto-reset reference when loading finishes
  if (!isLoading) {
    activeProviderRef.current = null;
  }

  useEffect(() => {
    if (error) {
      Alert.alert(
        "Authentication Failed",
        error,
        [{ text: "OK", onPress: () => dispatch(clearAuthError()) }]
      );
    }
  }, [error, dispatch]);

  const getCleanData = () => {
    if (!user) return null;

    let cleanName = (user.displayName || "").replace(/null/gi, "").trim();
    if (!cleanName) cleanName = "User";

    let cleanEmail = (user.email || "").replace(/null/gi, "").trim();
    if (!cleanEmail) cleanEmail = "Email Hidden";

    const avatarUri = user.photoURL 
      ? user.photoURL.replace('s96-c', 's400-c') 
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random&color=fff&size=200`;

    return { cleanName, cleanEmail, avatarUri };
  };

  const cleanData = getCleanData();

  // Handlers without timeouts
  const handleGooglePress = () => {
    activeProviderRef.current = 'google';
    dispatch(startManualGoogleLogin());
  };

  const handleApplePress = () => {
    activeProviderRef.current = 'apple';
    dispatch(startAppleLogin());
  };

  if (user && cleanData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <View style={styles.profileCard}>
            <SafeAvatar 
              uri={cleanData.avatarUri} 
              style={styles.profileImage} 
            />
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.userName}>{cleanData.cleanName}</Text>
            <Text style={styles.userEmail}>{cleanData.cleanEmail}</Text>
            
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
          <View style={styles.headerContainer}>
            <Image source={require('../assets/watching-tv.png')} style={styles.logoImage} />
            <Text style={styles.headerTitle}>MOVIES DB</Text>
          </View>

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

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            {/* GOOGLE BUTTON */}
            <TouchableOpacity 
              style={[
                styles.socialIconBtn, 
                (isLoading && activeProviderRef.current === 'google') && { borderColor: THEME.googleColor, borderWidth: 2 }
              ]} 
              onPress={handleGooglePress}
              disabled={isLoading}
            >
              {isLoading && activeProviderRef.current === 'google' ? (
                <ActivityIndicator size="small" color={THEME.googleColor} />
              ) : (
                <AntDesign name="google" size={32} color={THEME.googleColor} />
              )}
            </TouchableOpacity>

            {/* APPLE BUTTON - Loading logic updated to use THEME.accent to match Google style */}
            <TouchableOpacity 
              style={[
                styles.socialIconBtn,
                (isLoading && activeProviderRef.current === 'apple') && { borderColor: THEME.subText, borderWidth: 2 }
              ]} 
              onPress={handleApplePress}
              disabled={isLoading}
            >
              {isLoading && activeProviderRef.current === 'apple' ? (
                <ActivityIndicator size="small" color={THEME.subText} />
              ) : (
                <FontAwesome name="apple" size={32} color="#fff" />
              )}
            </TouchableOpacity>
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
    width: 64,
    height: 64,
    borderRadius: 100,
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
    borderWidth: 2,
    borderColor: THEME.btnBorder,
  },
  logoutText: {
    color: '#ffe4e6',
    fontWeight: 'bold',
    fontSize: 16,
  },
});