import { Dispatch } from 'redux';
import { 
  GoogleSignin, 
  isSuccessResponse, 
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { Platform, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import { appleAuthAndroid } from '@invertase/react-native-apple-authentication';

// --- NATIVE MODULAR IMPORTS (The Fix for Warnings) ---
import { 
  getApp as getNativeApp 
} from '@react-native-firebase/app';
import { 
  onAuthStateChanged as nativeOnAuthStateChanged,
  createUserWithEmailAndPassword as nativeCreateUser,
  signInWithEmailAndPassword as nativeSignIn,
  signInWithCredential as nativeSignInWithCredential,
  sendPasswordResetEmail as nativeSendPasswordReset,
  signOut as nativeSignOut,
  // MODULAR USER FUNCTIONS (Fixes 'user.updateProfile' warnings)
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider as NativeGoogleAuthProvider,
  FacebookAuthProvider as NativeFacebookAuthProvider,
  AppleAuthProvider as NativeAppleAuthProvider
} from '@react-native-firebase/auth';

// --- APP CHECK IMPORTS ---
import { 
  initializeAppCheck, 
  ReactNativeFirebaseAppCheckProvider,
  getToken 
} from '@react-native-firebase/app-check';

// --- WEB IMPORTS (Aliased types) ---
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';

import { firebaseAuth } from '../firebase/firebaseConfig';

// --- TYPES ---
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const CLEAR_ERROR = 'CLEAR_ERROR'; 
export const SHOW_MODAL = 'SHOW_MODAL';
export const CLOSE_MODAL = 'CLOSE_MODAL';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';
export const LOADING_START = 'LOADING_START';
export const LOADING_END = 'LOADING_END';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean; 
  providerId?: string;
}

// --- HELPERS ---
const mapFirebaseUser = (user: any): UserProfile => {
  const providerData = user.providerData || [];
  const googleProvider = providerData.find((p: any) => p.providerId === 'google.com');
  const appleProvider = providerData.find((p: any) => p.providerId === 'apple.com');
  // const facebookProvider = providerData.find((p: any) => p.providerId === 'facebook.com'); // FB: COMMENTED

  const bestName = googleProvider?.displayName || 
                   appleProvider?.displayName || 
                   // facebookProvider?.displayName || // FB: COMMENTED
                   user.displayName || 
                   'User';

  const bestPhoto = googleProvider?.photoURL || 
                    // facebookProvider?.photoURL || // FB: COMMENTED
                    appleProvider?.photoURL || 
                    user.photoURL || 
                    null;

  return {
    uid: user.uid,
    displayName: bestName,
    email: user.email,
    photoURL: bestPhoto,
    emailVerified: user.emailVerified,
    providerId: providerData[0]?.providerId,
  };
};

const configureAuthSDKs = () => {
  if (Platform.OS !== 'web') {
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        offlineAccess: false,
        scopes: ['profile', 'email'],
      });
    } catch (e) {    
      console.warn("SDK Config Warning:", e);
    }
  }
};

// --- APP CHECK SETUP ---
const setupAppCheck = async () => {
  if (Platform.OS === 'web') return; 

  try {
    const app = getNativeApp();
    const provider = new ReactNativeFirebaseAppCheckProvider();

    provider.configure({
      android: {
        provider: __DEV__ ? 'debug' : 'playIntegrity',
      },
      apple: {
        provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
      },
    });

    const appCheckInstance = await initializeAppCheck(app, {
      provider: provider,
      isTokenAutoRefreshEnabled: true,
    });
    
    // VERIFY: Gatekeeper to ensure token is ready
    const result = await getToken(appCheckInstance, true);
    console.log(`✅ App Check Token Ready: ${result.token.substring(0, 6)}...`);

  } catch (error: any) {
    console.error('❌ App Check Setup Error:', error);
  }
};

// --- INIT AUTH ---
export const initAuth = () => {
  return async (dispatch: Dispatch) => {
    
    console.log('🛡️ Initializing App Check...');
    await setupAppCheck(); 
    console.log('🛡️ App Check Done. Listening for Auth...');

    try {
      configureAuthSDKs();
      
      // MODULAR LISTENER
      if (Platform.OS !== 'web') {
          const unsubscribe = nativeOnAuthStateChanged(firebaseAuth, (user: any) => {
            if (user) {
              dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(user) });
            } else {
              dispatch({ type: SHOW_MODAL, payload: { type: 'LOGIN_OPTIONS' } });
            }
          });
          return unsubscribe;
      } else {
          // Web fallback
          const unsubscribe = firebaseAuth.onAuthStateChanged((user: any) => {
            if (user) {
              dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(user) });
            } else {
              dispatch({ type: SHOW_MODAL, payload: { type: 'LOGIN_OPTIONS' } });
            }
          });
          return unsubscribe;
      }

    } catch (error) {
      console.error('Init Auth Failed:', error);
      dispatch({ type: SHOW_MODAL, payload: { type: 'LOGIN_OPTIONS' } });
    }
  };
};

// --- EMAIL/PASSWORD ACTIONS ---

export const startEmailSignUp = (email: string, pass: string) => async (dispatch: Dispatch<any>) => {
  dispatch({ type: LOADING_START });
  try {
    const result = await nativeCreateUser(firebaseAuth, email, pass);
    
    if (result.user) {
        // FIX: Replaced 'result.user.updateProfile' with modular 'updateProfile'
        await updateProfile(result.user, { displayName: "Member" });
        // FIX: Replaced 'result.user.sendEmailVerification' with modular 'sendEmailVerification'
        await sendEmailVerification(result.user);
    }
    dispatch({ 
      type: LOGIN_SUCCESS, 
      payload: mapFirebaseUser(result.user) 
    });
  } catch (error: any) {
    let msg = error.message;
    if (error.code === 'auth/email-already-in-use') {
      msg = "Account exists! Please Log In instead.";
    }
    dispatch({ type: LOGIN_FAILURE, payload: msg });
  } finally {
    dispatch({ type: LOADING_END });
  }
};

export const startEmailLogin = (email: string, pass: string) => async (dispatch: Dispatch<any>) => {
  dispatch({ type: LOADING_START });
  try {
    const result = await nativeSignIn(firebaseAuth, email, pass);
    dispatch({ 
      type: LOGIN_SUCCESS, 
      payload: mapFirebaseUser(result.user) 
    });
  } catch (error: any) {
    let msg = error.message;
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      msg = "Invalid email or password.";
    }
    dispatch({ type: LOGIN_FAILURE, payload: msg });
  } finally {
    dispatch({ type: LOADING_END });
  }
};

export const sendForgotPassword = (email: string) => async (dispatch: Dispatch<any>) => {
  if (!email) {
    dispatch({ type: LOGIN_FAILURE, payload: "Please enter your email first." });
    return;
  }
  dispatch({ type: LOADING_START });
  try {
    await nativeSendPasswordReset(firebaseAuth, email);
    Alert.alert("Reset Link Sent", "Check your email inbox to reset your password.");
  } catch (error: any) {
    dispatch({ type: LOGIN_FAILURE, payload: error.message });
  } finally {
    dispatch({ type: LOADING_END });
  }
};

// --- GOOGLE LOGIN ---
export const startManualGoogleLogin = () => async (dispatch: Dispatch<any>) => {
  dispatch({ type: LOADING_START });
  try {
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      // @ts-ignore
      const result = await signInWithPopup(firebaseAuth, provider);
      dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(result.user) });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
    } else {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.type === 'cancelled' || !response.data?.idToken) {
         dispatch({ type: LOADING_END });
         return;
      }
      if (isSuccessResponse(response) && response.data?.idToken) {
        
        const credential = NativeGoogleAuthProvider.credential(response.data.idToken);
        const firebaseResult = await nativeSignInWithCredential(firebaseAuth, credential);
        
        dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(firebaseResult.user) });
        dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
      }
    }
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      dispatch({ type: LOADING_END });
      return;
    } 
    dispatch({ type: LOGIN_FAILURE, payload: error.message || 'Google Login Failed' });
  } finally {
    dispatch({ type: LOADING_END });
  }
};

/* --- FACEBOOK LOGIN (RESTORED, FB: PRESERVED) ---
export const startFacebookLogin = () => async (dispatch: Dispatch<any>) => {
  dispatch({ type: LOADING_START });
  try {
      // ... platform checks
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) return;
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) throw new Error('Something went wrong obtaining access token');

      const credential = NativeFacebookAuthProvider.credential(data.accessToken);
      const firebaseResult = await nativeSignInWithCredential(firebaseAuth, credential);

      dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(firebaseResult.user) });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
  } catch (error: any) {
    dispatch({ type: LOGIN_FAILURE, payload: error.message || 'Facebook Login Failed' });
  } finally {
    dispatch({ type: LOADING_END });
  }
};
*/

// --- APPLE LOGIN ---
export const startAppleLogin = () => async (dispatch: Dispatch<any>) => { 
  dispatch({ type: LOADING_START });
  try {
    const rawNonce = Crypto.randomUUID(); 
    const state = Crypto.randomUUID(); 

    if (Platform.OS === 'web') {
      const provider = new OAuthProvider('apple.com');
      // @ts-ignore
      const result = await signInWithPopup(firebaseAuth, provider);
      dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(result.user) });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
      return;
    } 
    else if (Platform.OS === 'android') {
      appleAuthAndroid.configure({
        clientId: 'movies.database.sid', 
        redirectUri: 'https://moviesdatabasecollection.firebaseapp.com/__/auth/handler', 
        responseType: appleAuthAndroid.ResponseType.ALL,
        scope: appleAuthAndroid.Scope.ALL,
        nonce: rawNonce,
        state: state,
      });

      const response = await appleAuthAndroid.signIn();
      if (!response || !response.id_token) throw new Error("Android Apple Login Failed");
      
      const credential = NativeAppleAuthProvider.credential(response.id_token, rawNonce);

      const firebaseResult = await nativeSignInWithCredential(firebaseAuth, credential);
      dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(firebaseResult.user) });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
    } 
    else {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) throw new Error("Apple Sign-In is not available.");

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: rawNonce 
      });

      const { identityToken } = credential;
      if (!identityToken) throw new Error("No Identity Token from Apple");

      const fbCredential = NativeAppleAuthProvider.credential(identityToken, rawNonce);
      
      const firebaseResult = await nativeSignInWithCredential(firebaseAuth, fbCredential);
      dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(firebaseResult.user) });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
    }
  } catch (error: any) {
    const isCancelled = error.code === 'ERR_CANCELED' || error.message?.includes('user canceled');
    if (isCancelled) {
      dispatch({ type: LOADING_END });
      return;
    }
    dispatch({ type: LOGIN_FAILURE, payload: error.message || "Apple Login Failed" });
  } finally {
    dispatch({ type: LOADING_END });
  }
};

export const logoutUser = () => async (dispatch: Dispatch) => {
  try {
    if (Platform.OS !== 'web') {
      try { await GoogleSignin.signOut(); } catch(e) {}
    }
    // FIX: Modular SignOut
    await nativeSignOut(firebaseAuth);
    dispatch({ type: LOGOUT_SUCCESS });
  } catch (e) {
    console.error(e);
  }
};

export const clearAuthError = () => ({ type: CLEAR_ERROR });
export const closeAuthModal = () => ({ type: CLOSE_MODAL });