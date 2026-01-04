import { Dispatch } from 'redux';
import { 
  GoogleSignin, 
  isSuccessResponse, 
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  OAuthProvider,
  signInWithCredential, 
  signOut as firebaseSignOut, 
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
// import { LoginManager, AccessToken, Settings } from 'react-native-fbsdk-next';
import * as AppleAuthentication from 'expo-apple-authentication';
import { firebaseAuth } from '../firebase/firebaseConfig';

// --- TYPES ---
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const CLEAR_ERROR = 'CLEAR_ERROR'; // New action to clear error after showing alert
export const SHOW_MODAL = 'SHOW_MODAL';
export const CLOSE_MODAL = 'CLOSE_MODAL';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId?: string;
}

// --- HELPERS ---
const mapFirebaseUser = (user: FirebaseUser): UserProfile => ({
  uid: user.uid,
  displayName: user.displayName || 'User',
  email: user.email,
  photoURL: user.photoURL,
  providerId: user.providerData[0]?.providerId,
});

const configureAuthSDKs = () => {
  console.log("Configuring Auth SDKs...");
  
  // 1. Google Configuration
  try {
    
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: false,
      scopes: ['profile', 'email'],
    });    
  } catch (e) {    
    console.warn("Google SDK Config Warning:", e);
  }


  // 2. Facebook Configuration
  // try {
  //   if (Settings && typeof Settings.initializeSDK === 'function') {
  //      Settings.initializeSDK();
  //   }
  // } catch (e) {
  //   console.warn("Facebook SDK Config Warning:", e);
  // }
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
          dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
        } else {
          dispatch({ type: SHOW_MODAL, payload: { type: 'LOGIN_OPTIONS' } });
        }
        unsubscribe();
      });

    } catch (error) {
      console.error('Init Auth Failed:', error);
      dispatch({ type: SHOW_MODAL, payload: { type: 'LOGIN_OPTIONS' } });
    }
  };
};

// --- GOOGLE LOGIN ---
export const startManualGoogleLogin = () => async (dispatch: Dispatch<any>) => {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    
    if (isSuccessResponse(response) && response.data?.idToken) {
      
      const credential = GoogleAuthProvider.credential(response.data.idToken);
      const firebaseResult = await signInWithCredential(firebaseAuth, credential);
      
      dispatch({ 
        type: LOGIN_SUCCESS, 
        payload: mapFirebaseUser(firebaseResult.user) 
      });
      dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });
    }
  } catch (error: any) {
    let friendlyMessage = 'Google Login Failed';
    
    // Handle "Bad Config" or "Developer Error" specifically
    if (error.code === statusCodes.DEVELOPER_ERROR) {
      friendlyMessage = "Configuration Error: Google Sign-In is not set up correctly. Please contact support.";
    } else if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return; // Ignore cancellation
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      friendlyMessage = "Google Play Services are not available on this device.";
    } else if (error.message) {
      friendlyMessage = error.message;
    }

    dispatch({ type: LOGIN_FAILURE, payload: friendlyMessage });
  }
};

// --- FACEBOOK LOGIN ---
// export const startFacebookLogin = () => async (dispatch: Dispatch<any>) => {
//   try {
//     if (!LoginManager) throw new Error("Facebook SDK not linked.");

//     const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
//     if (result.isCancelled) return;

//     const data = await AccessToken.getCurrentAccessToken();
//     if (!data) throw new Error('Could not obtain Facebook Access Token');

//     const credential = FacebookAuthProvider.credential(data.accessToken);
//     const firebaseResult = await signInWithCredential(firebaseAuth, credential);

//     dispatch({ 
//       type: LOGIN_SUCCESS, 
//       payload: mapFirebaseUser(firebaseResult.user) 
//     });
//     dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });

//   } catch (error: any) {
//     console.warn("FB Error:", error);
//     // If it's a native module error (common in Expo Go), give a hint
//     const msg = error.message?.includes('null') 
//       ? "Facebook Login is not available in this build." 
//       : (error.message || 'Facebook Login Failed');
      
//     dispatch({ type: LOGIN_FAILURE, payload: msg });
//   }
// };

// --- APPLE LOGIN ---
export const startAppleLogin = () => async (dispatch: Dispatch<any>) => {
  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("Apple Sign-In is not available on this device.");
    }

    // 1. Simple Sign In (No Nonce, No Crypto)
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // 2. Extract User Info
    // Note: Apple only sends 'fullName' and 'email' on the VERY FIRST login. 
    // On subsequent logins, it returns null for them (you must cache this if needed).
    const { user: userUuid, fullName, email } = credential;
    
    // 3. Construct User Object for Redux
    const userForRedux = {
      uid: userUuid,
      displayName: fullName ? `${fullName.givenName} ${fullName.familyName}` : 'Apple User',
      email: email || 'No Email Provided', // Apple hides email sometimes
      photoURL: null, // Apple does not provide avatars
      providerId: 'apple.com',
    };

    // 4. Dispatch Success
    dispatch({ 
      type: LOGIN_SUCCESS, 
      payload: userForRedux 
    });
    dispatch({ type: SHOW_MODAL, payload: { type: 'WELCOME' } });

  } catch (error: any) {
    if (error.code === 'ERR_CANCELED') {
      // User cancelled the dialog, do nothing
      return;
    }
    console.log("Apple Auth Error:", error);
    dispatch({ type: LOGIN_FAILURE, payload: "Apple Login Failed" });
  }
};

export const logoutUser = () => async (dispatch: Dispatch) => {
  try {
    try { await GoogleSignin.signOut(); } catch(e) {}
    try { if(LoginManager) await LoginManager.logOut(); } catch(e) {}
    await firebaseSignOut(firebaseAuth);
    dispatch({ type: LOGOUT_SUCCESS });
  } catch (e) {
    console.error(e);
  }
};

export const clearAuthError = () => ({ type: CLEAR_ERROR });
export const closeAuthModal = () => ({ type: CLOSE_MODAL });