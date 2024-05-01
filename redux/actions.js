import axios from 'axios';
export const GET_MOVIES = 'GET_MOVIES';
export const ADD_FAVORITE_ITEM = 'ADD_FAVORITE_ITEM';
export const REMOVE_FAVORITE_ITEM = 'REMOVE_FAVORITE_ITEM';
export const SEARCH_MOVIES = 'SEARCH_MOVIES';

const API_URL = 'https://api.themoviedb.org/3/movie/popular';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY; // '<your-api-key>'; 
const PARAMS = 'page=1';
const BASE_URL = `${API_URL}?api_key=${API_KEY}&${PARAMS}`;


console.log(`${BASE_URL}&query=test`);

export const getMovies = () => {
  try {
    return async function(dispatch, getState) {
      const res = await axios.get(`${BASE_URL}`);
      if (res.data) {
        dispatch({
          type: GET_MOVIES,
          payload: res.data,
        });
      } else {
        console.log('Unable to fetch');
      }
    };
  } catch (error) {
    // Add custom logic to handle errors
  }
};

export const addFavorite = movie => dispatch => {
  dispatch({
    type: ADD_FAVORITE_ITEM,
    payload: movie,
  });
};
export const removeFavorite = movie => dispatch => {
  dispatch({
    type: REMOVE_FAVORITE_ITEM,
    payload: movie,
  });
};

export const searchMovies = (query) => {
  return async function(dispatch, getState) {
      //const res = await axios.get(`${BASE_URL}&query=${query}`);
      const res = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`      
      );
      if (res.data) {
        dispatch({
          type: SEARCH_MOVIES,
          payload: res.data,
        });
      } else {
        console.log('Unable to fetch');
    }
  };
};