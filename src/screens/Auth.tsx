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
  ActivityIndicator,
  Keyboard,
  AppState 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons'; 

// --- NATIVE MODULAR IMPORTS ---
import { 
  reload, 
  sendEmailVerification 
} from '@react-native-firebase/auth';

import { firebaseAuth } from '../firebase/firebaseConfig';

import { 
  startManualGoogleLogin, 
  startAppleLogin, 
  startEmailLogin,     
  startEmailSignUp,    
  sendForgotPassword,  
  logoutUser,
  clearAuthError,
  LOGIN_SUCCESS
} from '../redux/authActions';

import { THEME } from '../constants/theme';
import { SafeAvatar } from '../components/SafeAvatar';

export default function AuthScreen() {
  const dispatch = useDispatch<any>();
  const { user, isLoading, error } = useSelector((state: any) => state.auth);

  const activeProviderRef = useRef<'google' | 'apple' | 'email' | null>(null);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isCheckingVerify, setIsCheckingVerify] = useState(false);

  // Reset provider state when loading finishes
  if (!isLoading) {
    activeProviderRef.current = null;
  }

  useEffect(() => {
    if (error) {
      Alert.alert(
        "Authentication Alert",
        error,
        [{ text: "OK", onPress: () => dispatch(clearAuthError()) }]
      );
    }
  }, [error, dispatch]);


  // =================================================================
  //  SMART RESUME LOGIC (APP STATE LISTENER)
  // =================================================================
  useEffect(() => {
    // Logic: Only run if user exists (Password matched) AND is unverified
    const isLimbo = user && !user.emailVerified && user.providerId === 'password';

    if (!isLimbo) return;

    const handleAppStateChange = async (nextAppState: any) => {
      const currentUser = firebaseAuth.currentUser;
      
      if (nextAppState === 'active' && currentUser) {
        try {
          // FIX: Modular Native Reload
          await reload(currentUser);
          
          if (currentUser.emailVerified) {
             dispatch({ 
                type: LOGIN_SUCCESS, 
                payload: { ...user, emailVerified: true } 
             });
          }
        } catch (e) {
          console.log("Smart Resume Check Failed", e);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [user, dispatch]);


  // --- HELPERS ---
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


  // --- HANDLERS ---
  const handleEmailAuth = () => {
    Keyboard.dismiss();
    if (!email || !password) {
      Alert.alert("Missing Info", "Please enter both email and password.");
      return;
    }
    activeProviderRef.current = 'email';
    
    if (isLoginMode) {
      dispatch(startEmailLogin(email, password));
    } else {
      if (password.length < 6) {
        Alert.alert("Weak Password", "Password must be at least 6 characters.");
        return;
      }
      dispatch(startEmailSignUp(email, password));
    }
  };

  const handleForgotPass = () => {
    Keyboard.dismiss();
    if (!email) {
      Alert.alert("Email Required", "Please enter your email address in the field above first.");
      return;
    }
    dispatch(sendForgotPassword(email));
  };

  const handleManualCheck = async () => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) return;
    
    setIsCheckingVerify(true);
    try {
      // FIX: Modular Native Reload
      await reload(currentUser);
      
      if (currentUser.emailVerified) {
         dispatch({ 
            type: LOGIN_SUCCESS, 
            payload: { ...user, emailVerified: true } 
         });
      } else {
        Alert.alert("Not Verified Yet", "We checked, but the email is not verified yet. Try refreshing again in a moment.");
      }
    } catch(e) { console.log(e); }
    setIsCheckingVerify(false);
  };

  const handleResendEmail = async () => {
    const currentUser = firebaseAuth.currentUser;
    if (currentUser) {
      try {
        // FIX: Modular Native Send Verification
        await sendEmailVerification(currentUser);
        Alert.alert("Sent!", "Link resent. Check spam folder.");
      } catch (e: any) {
        Alert.alert("Error", e.message || "Could not resend email.");
      }
    }
  };


  // =========================================================
  // VIEW 1: THE "LIMBO" SCREEN (Unverified Email)
  // =========================================================
  if (user && !user.emailVerified && user.providerId === 'password') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <View style={styles.profileCard}>
            
            <MaterialIcons 
              name="mark-email-unread" 
              size={80} 
              color={THEME.accent} 
              style={{ marginBottom: 20 }}
            />
            
            <Text style={styles.welcomeText}>Verify your Email</Text>
            
            <Text style={styles.limboText}>
              We sent a verification link to:{"\n"}
              <Text style={{ color: THEME.text, fontWeight: 'bold' }}>{user.email}</Text>
            </Text>

            <Text style={styles.limboSubText}>
              Check your inbox (and spam). The app will update automatically.
            </Text>

            {/* MANUAL CHECK BUTTON */}
            <View style={{ width: '100%', paddingVertical: 10 }}>
              <TouchableOpacity 
                style={styles.primaryBtn}
                onPress={handleManualCheck}
                disabled={isCheckingVerify}
              >
                {isCheckingVerify ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.primaryBtnText}>I HAVE VERIFIED</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* RESEND LINK */}
            <TouchableOpacity 
              style={{ marginTop: 20, padding: 10 }}
              onPress={handleResendEmail}
            >
              <Text style={{ color: THEME.accent, fontWeight: 'bold', fontSize: 14 }}>Resend Email</Text>
            </TouchableOpacity>

            {/* LOGOUT */}
            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={() => dispatch(logoutUser())}
            >
              <Text style={styles.logoutText}>Wrong email? Log Out</Text>
            </TouchableOpacity>

          </View>
        </View>
      </SafeAreaView>
    );
  }


  // =========================================================
  // VIEW 2: LOGGED IN & VERIFIED (Main App)
  // =========================================================
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


  // =========================================================
  // VIEW 3: AUTH FORM
  // =========================================================
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
          keyboardShouldPersistTaps="handled"
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

             {isLoginMode && (
              <TouchableOpacity style={styles.forgotPassContainer} onPress={handleForgotPass}>
                <Text style={styles.forgotPassText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[
                styles.primaryBtn, 
                (isLoading && activeProviderRef.current === 'email') && { opacity: 0.7 }
              ]} 
              onPress={handleEmailAuth}
              disabled={isLoading}
            >
              {isLoading && activeProviderRef.current === 'email' ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isLoginMode ? "LOG IN" : "SIGN UP"}
                </Text>
              )}
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
            <TouchableOpacity 
              style={[
                styles.socialIconBtn, 
                (isLoading && activeProviderRef.current === 'google') && { borderColor: THEME.googleColor, borderWidth: 2 }
              ]} 
              onPress={() => {
                activeProviderRef.current = 'google';
                dispatch(startManualGoogleLogin());
              }}
              disabled={isLoading}
            >
              {isLoading && activeProviderRef.current === 'google' ? (
                <ActivityIndicator size="small" color={THEME.googleColor} />
              ) : (
                <AntDesign name="google" size={32} color={THEME.googleColor} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.socialIconBtn,
                (isLoading && activeProviderRef.current === 'apple') && { borderColor: THEME.subText, borderWidth: 2 }
              ]} 
              onPress={() => {
                activeProviderRef.current = 'apple';
                dispatch(startAppleLogin());
              }}
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
  // --- LAYOUT ---
  container: { 
    flex: 1 
  },
  scrollContainer: { 
    flexGrow: 1, 
    paddingHorizontal: 24, 
    justifyContent: 'center' 
  },
  centerContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  // --- HEADER ---
  headerContainer: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
  logoImage: { 
    width: 70, 
    height: 70, 
    marginBottom: 15 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: THEME.text, 
    letterSpacing: 2 
  },

  // --- FORM ---
  formContainer: { 
    width: '100%' 
  },
  label: { 
    fontSize: 14, // ACCESS: Min 14px
    fontWeight: '700', 
    color: THEME.accent, 
    marginBottom: 4, 
    letterSpacing: 1 
  },
  input: { 
    backgroundColor: THEME.inputBg, 
    borderWidth: 1, 
    borderColor: THEME.border, 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    color: THEME.text, 
    marginBottom: 12 
  },

  // --- BUTTONS ---
  primaryBtn: { 
    backgroundColor: THEME.accent, 
    borderRadius: 8, 
    paddingVertical: 14, 
    alignItems: 'center', 
    marginTop: 5 
  },
  primaryBtnText: { 
    color: '#000', 
    fontSize: 16, 
    fontWeight: 'bold', 
    letterSpacing: 0.5 
  },
  toggleContainer: { 
    marginTop: 15, 
    alignItems: 'center', 
    padding: 5 
  },
  toggleText: { 
    color: THEME.subText, 
    fontSize: 16 
  },
  toggleHighlight: { 
    color: THEME.accent, 
    fontWeight: 'bold' 
  },

  // --- SOCIAL ---
  dividerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 15 
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: THEME.border 
  },
  dividerText: { 
    marginHorizontal: 16, 
    color: THEME.subText, 
    fontWeight: 'bold', 
    fontSize: 14 // ACCESS: Min 14px
  },
  socialRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 15, 
    paddingBottom: 10 
  },
  socialIconBtn: { 
    width: 64, 
    height: 64, 
    borderRadius: 100, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },

  // --- PROFILE / LIMBO CARD ---
  profileCard: { 
    backgroundColor: THEME.card, 
    width: '90%', 
    padding: 30, 
    borderRadius: 20, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: THEME.border 
  },
  profileImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginBottom: 20, 
    borderWidth: 2, 
    borderColor: THEME.accent 
  },
  welcomeText: { 
    color: THEME.subText, 
    fontSize: 16,
    textAlign: 'center' 
  },
  userName: { 
    color: THEME.text, 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginVertical: 5 
  },
  userEmail: { 
    color: THEME.accent, 
    fontSize: 14, // ACCESS: Min 14px
    marginBottom: 30 
  },
  logoutBtn: { 
    backgroundColor: 'rgba(255,0,0,0.2)', 
    paddingVertical: 12, 
    paddingHorizontal: 40, 
    borderRadius: 30, 
    borderWidth: 2, 
    borderColor: THEME.btnBorder,
    marginTop: 10
  },
  logoutText: { 
    color: '#ffe4e6', 
    fontWeight: 'bold', 
    fontSize: 16 
  },

  // --- LIMBO SPECIFIC ---
  limboText: { 
    textAlign: 'center', 
    color: THEME.subText, 
    fontSize: 16, 
    lineHeight: 24, 
    marginBottom: 10,
    marginTop: 10
  },
  limboSubText: { 
    textAlign: 'center', 
    color: THEME.subText, 
    fontSize: 14, // ACCESS: Min 14px
    marginBottom: 20, 
    opacity: 0.7 
  },
  forgotPassContainer: { 
    alignSelf: 'flex-end', 
    marginBottom: 15 
  },
  forgotPassText: { 
    color: THEME.subText, 
    fontSize: 14 // ACCESS: Min 14px
  },
});