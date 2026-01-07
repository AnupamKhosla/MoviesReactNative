import { Dispatch } from 'redux';
import { 
  GoogleSignin, 
  isSuccessResponse, 
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { 
  GoogleAuthProvider, 
  // FacebookAuthProvider, // COMMENTED (RESTORED)
  OAuthProvider,
  signInWithCredential, 
  signInWithPopup, 
  // signInWithRedirect, // REMOVED (CRASHES ANDROID)
  // getRedirectResult,  // REMOVED (NOT NEEDED WITH INVERTASE)
  signOut as firebaseSignOut, 
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
// import { Settings, LoginManager, AccessToken } from 'react-native-fbsdk-next'; // COMMENTED (RESTORED)
import { firebaseAuth } from '../firebase/firebaseConfig';
import { Alert, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

// IMPORT INVERTASE (Only used for Android)
import { appleAuthAndroid } from '@invertase/react-native-apple-authentication';

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
  providerId?: string;
}

// --- HELPERS ---
const mapFirebaseUser = (user: FirebaseUser): UserProfile => {
  const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
  const appleProvider = user.providerData.find(p => p.providerId === 'apple.com');
  // const facebookProvider = user.providerData.find(p => p.providerId === 'facebook.com'); // COMMENTED

  const bestName = googleProvider?.displayName || 
                   appleProvider?.displayName || 
                   // facebookProvider?.displayName || // COMMENTED
                   user.displayName || 
                   'User';

  const bestPhoto = googleProvider?.photoURL || 
                    // facebookProvider?.photoURL || // COMMENTED
                    appleProvider?.photoURL || 
                    user.photoURL || 
                    null;

  return {
    uid: user.uid,
    displayName: bestName,
    email: user.email,
    photoURL: bestPhoto,
    providerId: user.providerData[0]?.providerId,
  };
};

const configureAuthSDKs = () => {
  if (Platform.OS !== 'web') {
    try {
      // Configure Google
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        offlineAccess: false,
        scopes: ['profile', 'email'],
      });

      // Configure Facebook (COMMENTED)
      // Settings.initializeSDK(); 
    } catch (e) {    
      console.warn("SDK Config Warning:", e);
    }
  }
};

// --- INIT AUTH ---
export const initAuth = () => {
  return async (dispatch: Dispatch) => {
    try {
      configureAuthSDKs();

      // NOTE: We do NOT need getRedirectResult anymore because Invertase
      // handles the result directly in the startAppleLogin promise.

      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          dispatch({ 
            type: LOGIN_SUCCESS, 
            payload: mapFirebaseUser(user) 
          });
          // We don't show WELCOME here because this fires on every app restart
        } else {
          dispatch({ type: SHOW_MODAL, payload: { type: 'LOGIN_OPTIONS' } });
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error('Init Auth Failed:', error);
      dispatch({ type: SHOW_MODAL, payload: { type: 'LOGIN_OPTIONS' } });
    }
  };
};

// --- GOOGLE LOGIN ---
export const startManualGoogleLogin = () => async (dispatch: Dispatch<any>) => {
  dispatch({ type: 'LOADING_START' });
  try {
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(result.user) });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
    } else {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.type === 'cancelled' || !response.data?.idToken) {
         dispatch({ type: 'LOADING_END' });
         return;
      }
      
      if (isSuccessResponse(response) && response.data?.idToken) {
        const credential = GoogleAuthProvider.credential(response.data.idToken);
        const firebaseResult = await signInWithCredential(firebaseAuth, credential);

        dispatch({ 
          type: LOGIN_SUCCESS, 
          payload: mapFirebaseUser(firebaseResult.user) 
        });
        dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
      }
    }
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      dispatch({ type: 'LOADING_END' });
      return;
    } 
    dispatch({ type: LOGIN_FAILURE, payload: error.message || 'Google Login Failed' });
  } finally {
    dispatch({ type: 'LOADING_END' });
  }
};

/* --- FACEBOOK LOGIN (RESTORED) ---
export const startFacebookLogin = () => async (dispatch: Dispatch<any>) => {
  dispatch({ type: 'LOADING_START' });
  try {
    if (Platform.OS === 'web') {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(result.user) });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
    } else {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) {
        dispatch({ type: 'LOADING_END' });
        return;
      }
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) throw new Error('Something went wrong obtaining access token');

      const credential = FacebookAuthProvider.credential(data.accessToken);
      const firebaseResult = await signInWithCredential(firebaseAuth, credential);

      dispatch({ 
        type: LOGIN_SUCCESS, 
        payload: mapFirebaseUser(firebaseResult.user) 
      });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
    }
  } catch (error: any) {
    dispatch({ type: LOGIN_FAILURE, payload: error.message || 'Facebook Login Failed' });
  } finally {
    dispatch({ type: 'LOADING_END' });
  }
};
*/

// --- APPLE LOGIN ---
export const startAppleLogin = () => async (dispatch: Dispatch<any>) => {  
  dispatch({ type: 'LOADING_START' });
  
  try {
    const rawNonce = Crypto.randomUUID(); 
    const state = Crypto.randomUUID(); 

    // --- 1. WEB FLOW ---
    if (Platform.OS === 'web') {
      const provider = new OAuthProvider('apple.com');
      const result = await signInWithPopup(firebaseAuth, provider);
      
      dispatch({ 
        type: LOGIN_SUCCESS, 
        payload: mapFirebaseUser(result.user) 
      });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
      return;
    } 

    // --- 2. ANDROID FLOW (Use Invertase) ---
    else if (Platform.OS === 'android') {
      // Configure interception
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
      
      // EXCHANGE STEP (Interverse Logic):
      // We take the token WE intercepted, and MANUALLY give it to Firebase.
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: response.id_token,
        rawNonce: rawNonce, // Required for Android
      });

      const firebaseResult = await signInWithCredential(firebaseAuth, credential);
      dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(firebaseResult.user) });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
    } 

    // --- 3. IOS FLOW (Use Expo - Your Original Code) ---
    else {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) throw new Error("Apple Sign-In is not available.");

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        // I restored this to your original simple call if you prefer, 
        // but passing a nonce is actually recommended for Firebase. 
        // If your original code didn't have it, you can remove 'nonce: rawNonce'.
        nonce: rawNonce 
      });

      const { identityToken } = credential;
      if (!identityToken) throw new Error("No Identity Token from Apple");

      // EXCHANGE STEP (Expo Logic):
      const provider = new OAuthProvider('apple.com');
      const fbCredential = provider.credential({ 
        idToken: identityToken,
        rawNonce: rawNonce // Match the nonce sent above
      });
      
      const firebaseResult = await signInWithCredential(firebaseAuth, fbCredential);

      dispatch({ 
        type: LOGIN_SUCCESS, 
        payload: mapFirebaseUser(firebaseResult.user) 
      });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
    }
  } catch (error: any) {
    const isCancelled = 
      error.code === 'ERR_CANCELED' || 
      error.code === 'E_SIGNIN_CANCELLED' || 
      error.code === 'auth/cancelled-popup-request' ||
      error.message?.includes('user canceled');

    if (isCancelled) {
      console.log('User canceled Apple Login');
      dispatch({ type: 'LOADING_END' });
      return;
    }
    console.log(error.message)
    dispatch({ type: LOGIN_FAILURE, payload: error.message || "Apple Login Failed" });
  } finally {
    dispatch({ type: 'LOADING_END' });
  }
};

export const logoutUser = () => async (dispatch: Dispatch) => {
  try {
    if (Platform.OS !== 'web') {
      try { await GoogleSignin.signOut(); } catch(e) {}
      // try { LoginManager.logOut(); } catch(e) {} // COMMENTED
    }
    await firebaseSignOut(firebaseAuth);
    dispatch({ type: LOGOUT_SUCCESS });
  } catch (e) {
    console.error(e);
  }
};

export const clearAuthError = () => ({ type: CLEAR_ERROR });
export const closeAuthModal = () => ({ type: CLOSE_MODAL });