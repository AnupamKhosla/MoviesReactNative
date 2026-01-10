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

// --- NATIVE IMPORTS (Clean, No Aliases) ---
// We import these directly so they look standard in the code
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  AppleAuthProvider
} from '@react-native-firebase/auth';

import { getApp } from '@react-native-firebase/app';

// --- APP CHECK IMPORTS ---
import { 
  initializeAppCheck, 
  ReactNativeFirebaseAppCheckProvider, 
  getToken 
} from '@react-native-firebase/app-check';

// --- WEB IMPORTS (Namespaced) ---
// We import this as one object to avoid name collisions and aliases
import * as WebAuth from 'firebase/auth';

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

  const bestName = googleProvider?.displayName || 
                   appleProvider?.displayName || 
                   user.displayName || 
                   'User';

  const bestPhoto = googleProvider?.photoURL || 
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
    const app = getApp();
    const provider = new ReactNativeFirebaseAppCheckProvider();
    let token: string | undefined = undefined;
    if(__DEV__) {
      token = require('../firebase/tokensHiddenIgnored').FIREBASE_DEBUG_TOKEN;
      
    }


    provider.configure({
      android: {
        provider: __DEV__ ? 'debug' : 'playIntegrity',
        debugToken: __DEV__ ? token : undefined,
      },
      apple: {
        provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
      },
    });

    const appCheckInstance = await initializeAppCheck(app, {
      provider: provider,
      isTokenAutoRefreshEnabled: true,
    });
    
    // VERIFY: Gatekeeper
    try {
        const result = await getToken(appCheckInstance, false);
        console.log(`✅ App Check Token Active. Expires in: ${Math.floor((result.expireTimeMillis - Date.now())/1000)}s`);
    } catch(e) {
        console.warn("⚠️ Initial token fetch delayed:", e);
    }

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
      
      if (Platform.OS !== 'web') {
          // NATIVE (Modular Syntax - Clean)
          const auth = getAuth();
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(user) });
            } else {
              dispatch({ type: SHOW_MODAL, payload: { type: 'LOGIN_OPTIONS' } });
            }
          });
          return unsubscribe;
      } else {
          // WEB (Namespaced)
          const unsubscribe = WebAuth.onAuthStateChanged(firebaseAuth, (user) => {
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
    // NATIVE
    if (Platform.OS !== 'web') {
      const auth = getAuth();
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      
      if (result.user) {
          await updateProfile(result.user, { displayName: "Member" });
          await sendEmailVerification(result.user);
      }
      dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(result.user) });
    } 
    // WEB
    else {
      const result = await WebAuth.createUserWithEmailAndPassword(firebaseAuth, email, pass);
      if (result.user) {
          // Note: Web modular updateProfile is separate, simplifying for parity
          dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(result.user) });
      }
    }
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
    let user;
    if (Platform.OS !== 'web') {
       const auth = getAuth();
       const result = await signInWithEmailAndPassword(auth, email, pass);
       user = result.user;
    } else {
       const result = await WebAuth.signInWithEmailAndPassword(firebaseAuth, email, pass);
       user = result.user;
    }
    dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(user) });
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
    if (Platform.OS !== 'web') {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
    } else {
      await WebAuth.sendPasswordResetEmail(firebaseAuth, email);
    }
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
      const provider = new WebAuth.GoogleAuthProvider();
      // @ts-ignore
      const result = await WebAuth.signInWithPopup(firebaseAuth, provider);
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
        // NATIVE MODULAR
        const auth = getAuth();
        const credential = GoogleAuthProvider.credential(response.data.idToken);
        const firebaseResult = await signInWithCredential(auth, credential);
        
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

// --- APPLE LOGIN ---
export const startAppleLogin = () => async (dispatch: Dispatch<any>) => { 
  dispatch({ type: LOADING_START });
  try {
    const rawNonce = Crypto.randomUUID(); 
    const state = Crypto.randomUUID(); 

    if (Platform.OS === 'web') {
      const provider = new WebAuth.OAuthProvider('apple.com');
      // @ts-ignore
      const result = await WebAuth.signInWithPopup(firebaseAuth, provider);
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
      
      // NATIVE MODULAR
      const auth = getAuth();
      const credential = AppleAuthProvider.credential(response.id_token, rawNonce);

      const firebaseResult = await signInWithCredential(auth, credential);
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

      // NATIVE MODULAR
      const auth = getAuth();
      const fbCredential = AppleAuthProvider.credential(identityToken, rawNonce);
      
      const firebaseResult = await signInWithCredential(auth, fbCredential);
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
      const auth = getAuth();
      await signOut(auth);
    } else {
      await WebAuth.signOut(firebaseAuth);
    }
    dispatch({ type: LOGOUT_SUCCESS });
  } catch (e) {
    console.error(e);
  }
};

export const clearAuthError = () => ({ type: CLEAR_ERROR });
export const closeAuthModal = () => ({ type: CLOSE_MODAL });