import { Dispatch } from 'redux';
import { 
  GoogleSignin, 
  isSuccessResponse, 
  isNoSavedCredentialFoundResponse 
} from '@react-native-google-signin/google-signin';
import { signInWithCredential, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { firebaseAuth } from '../firebase/firebaseConfig';

// --- Action Types ---
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const SET_GUEST = 'SET_GUEST';
export const SHOW_MODAL = 'SHOW_MODAL';
export const CLOSE_MODAL = 'CLOSE_MODAL';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';

// --- EXISTING FIREBASE ACTIONS (Keep these as they are) ---
export const loginWithFirebaseGoogle = (idToken: string) => async (dispatch: Dispatch) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(firebaseAuth, credential);
    // Success: Firebase is happy.
    dispatch({ type: LOGIN_SUCCESS, payload: result.user });
    // Trigger the "Welcome Back" modal visualization
    dispatch({ type: SHOW_MODAL, payload: 'WELCOME' });
  } catch (e: any) {
    dispatch({ type: LOGIN_FAILURE, payload: e.message });
  }
};

// redux/authActions.js
export const checkAppLaunchStatus = () => {
  return async (dispatch) => {
    try {
      GoogleSignin.configure({ /* ... */ });

      // 1. Await the result (Does NOT throw for guests anymore)
      const response = await GoogleSignin.signInSilently();

      // 2. Check the 'type' string using helpers
      if (isSuccessResponse(response)) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
        
      } else if (isNoSavedCredentialFoundResponse(response)) {
        // 3. Handle Guest here (formerly catch block)
        dispatch({ type: 'SHOW_MODAL', payload: 'LOGIN_OPTIONS' });
      }

    } catch (error) {
      // 4. Catches ACTUAL crashes (Network down, Config missing)
      console.log('Real Error:', error);
      dispatch({ type: 'SHOW_MODAL', payload: 'LOGIN_OPTIONS' });
    }
  };
};

/**
 * 2. MANUAL GOOGLE BUTTON CLICK
 * User clicks "Sign in with Google" in the modal
 */
export const startManualGoogleLogin = () => async (dispatch: Dispatch<any>) => {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;
    
    if (idToken) {
       await dispatch(loginWithFirebaseGoogle(idToken));
       // Modal will switch to "Welcome" automatically via LOGIN_SUCCESS logic above
    }
  } catch (error: any) {
    if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
      dispatch({ type: LOGIN_FAILURE, payload: error.message });
    }
  }
};

/**
 * 3. GUEST & UI ACTIONS
 */
export const continueAsGuest = () => ({
  type: SET_GUEST,
});

export const closeAuthModal = () => ({
  type: CLOSE_MODAL,
});

export const logoutUser = () => async (dispatch: Dispatch) => {
  try {
    await GoogleSignin.signOut(); // Sign out from Google SDK
    await firebaseSignOut(firebaseAuth); // Sign out from Firebase
    dispatch({ type: LOGOUT_SUCCESS });
  } catch (e) {
    console.error(e);
  }
};