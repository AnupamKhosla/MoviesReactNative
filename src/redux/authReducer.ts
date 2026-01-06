import { 
  LOGIN_SUCCESS, 
  LOGIN_FAILURE, 
  SET_GUEST, 
  SHOW_MODAL, 
  CLOSE_MODAL, 
  LOGOUT_SUCCESS, 
  LOADING_START,
  LOADING_END
} from './authActions';

const initialState = {
  user: null,           
  isGuest: true,        
  isLoading: true,      // <--- ADDED: Blocks UI until Init finishes
  showModal: false,     
  modalType: 'LOGIN_OPTIONS', 
  error: null,
};

export default function authReducer(state = initialState, action: any) {
  switch (action.type) {
    case LOADING_START:
      return {
        ...state,
        isLoading: true,
        error: null, // Clear previous errors when starting new attempt
      };

    case LOADING_END:
      return {
        ...state,
        isLoading: false,
      };


    case LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload, // Contains { displayName, photoURL, ... }
        isGuest: false,
        isLoading: false,     // Loading done
        error: null,
      };

    case SHOW_MODAL:
      return {
        ...state,
        showModal: true,
        // Handle both object payload {type: 'WELCOME'} and string payload 'WELCOME'
        modalType: action.payload.type || action.payload,
        // If showing login options, we know loading is done
        isLoading: action.payload.type === 'LOGIN_OPTIONS' ? false : state.isLoading
      };

    case CLOSE_MODAL:
      return {
        ...state,
        showModal: false,
      };

    case LOGOUT_SUCCESS:
      return {
        ...initialState,
        isLoading: false, // Reset but don't hang on loading
      };

    case LOGIN_FAILURE:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
}