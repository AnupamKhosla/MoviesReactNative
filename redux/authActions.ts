import { Dispatch } from 'redux';
import { signInWithCredential, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';
import { firebaseAuth } from '../firebase/firebaseConfig';

export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';

/* ---------------- GOOGLE ---------------- */
// NOW: Receives the token from the UI, doesn't ask for it
export const loginWithGoogle = (idToken: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(firebaseAuth, credential);
      dispatch({ type: LOGIN_SUCCESS, payload: result.user });
    } catch (e: any) {
      dispatch({ type: LOGIN_FAILURE, payload: e.message });
    }
  };
};

/* ---------------- FACEBOOK ---------------- */
export const loginWithFacebook = (accessToken: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const credential = FacebookAuthProvider.credential(accessToken);
      const result = await signInWithCredential(firebaseAuth, credential);
      dispatch({ type: LOGIN_SUCCESS, payload: result.user });
    } catch (e: any) {
      dispatch({ type: LOGIN_FAILURE, payload: e.message });
    }
  };
};

/* ---------------- APPLE ---------------- */
// Apple logic is usually complex, but keeping it simple here:
export const loginWithApple = (idToken: string, nonce: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken, rawNonce: nonce });
      const result = await signInWithCredential(firebaseAuth, credential);
      dispatch({ type: LOGIN_SUCCESS, payload: result.user });
    } catch (e: any) {
      dispatch({ type: LOGIN_FAILURE, payload: e.message });
    }
  };
};