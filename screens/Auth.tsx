import React, { useEffect, useState } from 'react';
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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { AntDesign, FontAwesome } from '@expo/vector-icons'; 



const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8+R8AAnkB9X9086gAAAAASUVORK5CYII=';

const THEME = {
  background: '#2b0505',
  card: '#7e1111ff',       
  text: '#ffffff',       
  subText: '#d1d5db',   
  accent: '#FFD700',
  inputBg: 'rgba(0, 0, 0, 0.3)',
  border: '#5c1414',
};

export default function AuthScreen() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
    });
    checkCurrentSignedInUser();
  }, []);

  const checkCurrentSignedInUser = async () => {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      // Success! User is signed in.
      setUserInfo(userInfo); 
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        // User is NOT signed in. This is normal for a fresh install.
      } else {
        // Some other actual error happened (network, etc.)
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response && response.data) {
        setUserInfo(response); 
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Error", error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut();
      setUserInfo(null);
    } catch (error) {
      console.error(error);
    }
  };

  // --- RENDER: LOGGED IN PROFILE ---
  const user = userInfo?.data?.user || userInfo?.user;

  if (userInfo && user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.background} />
        <View style={styles.centerContent}>
          <View style={styles.profileCard}>
            <Image 
              source={{ uri: user.photo?.replace('s96-c', 's400-c') || PLACEHOLDER_IMAGE }} 
              style={styles.profileImage} 
            />
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- RENDER: AUTH FORM ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.background} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
        >
          
          {/* Header Section (Compact) */}
         
          <View style={styles.headerContainer}>
            <Image source={require('../assets/watching-tv.png')} style={styles.logoImage} />
            

            <Text style={styles.headerTitle}>MOVIES DB</Text>
            {/* ... rest of code */}
          </View>

          {/* Input Fields (Compact) */}
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

            <TouchableOpacity style={styles.primaryBtn} onPress={() => Alert.alert("TODO", "Custom Auth")}>
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

          {/* Divider (Compact) */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Icons (Compact) */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialIconBtn} onPress={handleGoogleLogin}>
              <AntDesign name="google" size={24} color="#EA4335" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialIconBtn} onPress={() => {}}>
              <FontAwesome name="apple" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialIconBtn} onPress={() => {}}>
              <FontAwesome name="facebook" size={24} color="#1877F2" />
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
    //backgroundColor: THEME.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 0, 
    justifyContent: 'center' 
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    // Compact size
    width: 70,
    height: 70,
    // tintColor removed here
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: THEME.subText,
    marginTop: 2,
  },

  // Form
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
  
  // Buttons
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

  // Toggle
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

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.background,
  },
  dividerText: {
    marginHorizontal: 16,
    color: THEME.subText,
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Social
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

  // Profile Card
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