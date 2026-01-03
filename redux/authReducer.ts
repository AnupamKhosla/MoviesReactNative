import { 
  LOGIN_SUCCESS, 
  LOGIN_FAILURE, 
  SET_GUEST, 
  SHOW_MODAL, 
  CLOSE_MODAL, 
  LOGOUT_SUCCESS 
} from './authActions';

const initialState = {
  user: null,           // The Firebase User Object
  isGuest: true,        // Are they strictly a guest?
  showModal: false,     // Is the popup visible?
  modalType: 'LOGIN_OPTIONS', // 'LOGIN_OPTIONS' | 'WELCOME'
  error: null,
};

export default function authReducer(state = initialState, action: any) {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isGuest: false,
        error: null,
        // We don't close modal here immediately; we let the UI show "Welcome" first
      };

    case SHOW_MODAL:
      return {
        ...state,
        showModal: true,
        modalType: action.payload, // 'WELCOME' or 'LOGIN_OPTIONS'
      };

    case CLOSE_MODAL:
      return {
        ...state,
        showModal: false,
      };

    case SET_GUEST:
      return {
        ...state,
        isGuest: true,
        showModal: false, // Close immediately for guest
      };
      
    case LOGOUT_SUCCESS:
      return {
        ...initialState,
        // Optional: Open modal again after logout?
        // showModal: true, 
        // modalType: 'LOGIN_OPTIONS'
      };

    case LOGIN_FAILURE:
      return {
        ...state,
        error: action.payload,
        // Keep modal open so they can retry
      };

    default:
      return state;
  }
}