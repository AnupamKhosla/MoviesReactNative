import {GET_MOVIES, ADD_FAVORITE_ITEM, REMOVE_FAVORITE_ITEM, SEARCH_MOVIES} from './actions';
const initialState = {  
  favorites: [],
  searchResults: [],
  movies: [],
};

function moviesReducer(state = initialState, action) {  
  switch (action.type) {
    case SEARCH_MOVIES:      
      return {...state, searchResults: action.payload};
    case GET_MOVIES:      
      return {...state, movies: action.payload};
    case ADD_FAVORITE_ITEM:
      return {...state, favorites: [...state.favorites, action.payload]};

    case REMOVE_FAVORITE_ITEM:
      return {
        ...state,
        favorites: state.favorites.filter(
          movie => movie.id !== action.payload.id,
        ),
      };
    

    default:
      return state;
  }
}
export default moviesReducer;