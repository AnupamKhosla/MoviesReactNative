import {
  GET_MOVIES,
  GET_MOVIES_LOADING,
  GET_MOVIES_ERROR,

  SEARCH_MOVIES,
  SEARCH_MOVIES_LOADING,
  SEARCH_MOVIES_ERROR,

  ADD_FAVORITE_ITEM,
  REMOVE_FAVORITE_ITEM,
} from "./actions";

const initialState = {
  favorites: [],

  // movie lists
  movies: { results: [] },
  searchResults: { results: [] },

  // UI states
  initialLoading: true,   // FIRST LOAD ONLY
  error: null,
};

function moviesReducer(state = initialState, action) {
  switch (action.type) {

    /* -------------------------------------------
       POPULAR MOVIES (Movies.js)
    ------------------------------------------- */
    case GET_MOVIES_LOADING:
      return {
        ...state,
        initialLoading: true,
        error: null,
      };

    case GET_MOVIES_ERROR:
      return {
        ...state,
        initialLoading: false,
        error: action.payload,
      };

    case GET_MOVIES:
      return {
        ...state,
        initialLoading: false,
        error: null,
        movies: action.payload,
      };

    /* -------------------------------------------
       SEARCH MOVIES (Search.tsx)
    ------------------------------------------- */

    // ONLY show loading for FIRST SEARCH
    case SEARCH_MOVIES_LOADING:
      return {
        ...state,
        initialLoading: true,   // only first time the screen loads
        error: null,
      };

    case SEARCH_MOVIES_ERROR:
      return {
        ...state,
        initialLoading: false,
        error: action.payload,
      };

    case SEARCH_MOVIES:
      return {
        ...state,
        initialLoading: false,   // after results come, no loading for future searches
        error: null,
        searchResults: action.payload,
      };

    /* -------------------------------------------
       FAVORITES
    ------------------------------------------- */
    case ADD_FAVORITE_ITEM:
      return {
        ...state,
        favorites: [...state.favorites, action.payload],
      };

    case REMOVE_FAVORITE_ITEM:
      return {
        ...state,
        favorites: state.favorites.filter(
          (movie) => movie.id !== action.payload.id
        ),
      };

    default:
      return state;
  }
}

export default moviesReducer;
