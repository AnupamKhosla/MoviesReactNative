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
  // signInWithRedirect, // REMOVED
  // getRedirectResult,  // REMOVED
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,     
  sendEmailVerification,          
  sendPasswordResetEmail,         
  updateProfile,                  
  signOut as firebaseSignOut, 
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
// import { Settings, LoginManager, AccessToken } from 'react-native-fbsdk-next'; // COMMENTED (RESTORED)
import { firebaseAuth } from '../firebase/firebaseConfig';
import { Alert, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
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
  emailVerified: boolean; 
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
    emailVerified: user.emailVerified,
    providerId: user.providerData[0]?.providerId,
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
      // Settings.initializeSDK(); // COMMENTED
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
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          dispatch({ 
            type: LOGIN_SUCCESS, 
            payload: mapFirebaseUser(user) 
          });
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

// --- EMAIL/PASSWORD ACTIONS ---

export const startEmailSignUp = (email: string, pass: string) => async (dispatch: Dispatch<any>) => {
  dispatch({ type: LOADING_START });
  try {
    const result = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
    if (result.user) {
        await updateProfile(result.user, { displayName: "Member" });
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
    const result = await signInWithEmailAndPassword(firebaseAuth, email, pass);
    // Logic: If password is wrong, we catch error below. 
    // If correct, we dispatch SUCCESS. The UI then checks emailVerified.
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
    await sendPasswordResetEmail(firebaseAuth, email);
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
        const credential = GoogleAuthProvider.credential(response.data.idToken);
        const firebaseResult = await signInWithCredential(firebaseAuth, credential);
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

/* --- FACEBOOK LOGIN (RESTORED) ---
export const startFacebookLogin = () => async (dispatch: Dispatch<any>) => {
  dispatch({ type: LOADING_START });
  try {
    if (Platform.OS === 'web') {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      dispatch({ type: LOGIN_SUCCESS, payload: mapFirebaseUser(result.user) });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
    } else {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) {
        dispatch({ type: LOADING_END });
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
      
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: response.id_token,
        rawNonce: rawNonce,
      });
      const firebaseResult = await signInWithCredential(firebaseAuth, credential);
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

      const provider = new OAuthProvider('apple.com');
      const fbCredential = provider.credential({ 
        idToken: identityToken,
        rawNonce: rawNonce 
      });
      
      const firebaseResult = await signInWithCredential(firebaseAuth, fbCredential);
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