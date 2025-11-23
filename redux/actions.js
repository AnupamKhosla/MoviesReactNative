import axios from "axios";

/* ------------------------------------------------------
   ACTION TYPES
-------------------------------------------------------*/
export const GET_MOVIES = "GET_MOVIES";
export const GET_MOVIES_LOADING = "GET_MOVIES_LOADING";
export const GET_MOVIES_ERROR = "GET_MOVIES_ERROR";

export const SEARCH_MOVIES = "SEARCH_MOVIES";
export const SEARCH_MOVIES_LOADING = "SEARCH_MOVIES_LOADING";
export const SEARCH_MOVIES_ERROR = "SEARCH_MOVIES_ERROR";

export const ADD_FAVORITE_ITEM = "ADD_FAVORITE_ITEM";
export const REMOVE_FAVORITE_ITEM = "REMOVE_FAVORITE_ITEM";


/* ------------------------------------------------------
   API SETUP
-------------------------------------------------------*/
const API_URL = "https://api.themoviedb.org/3/movie/popular";
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const BASE_URL = `${API_URL}?api_key=${API_KEY}&page=1`;

/* ------------------------------------------------------
   DEV-SAFE LOGS
   (Won't leak keys in production)
-------------------------------------------------------*/
if (__DEV__) {
  console.log("=== DEV MODE: TMDB CONFIG ===");
  console.log("API KEY:", API_KEY); // good: only shown in dev mode
  console.log("POPULAR MOVIES URL:", BASE_URL);
  console.log("==============================");
}

let firstSearchDone = false; //loading spinner on first search only


/* ------------------------------------------------------
   GET POPULAR MOVIES
-------------------------------------------------------*/
export const getMovies = (tries = 0) => {
  return async function (dispatch) {
    if (tries === 0) {
      dispatch({ type: GET_MOVIES_LOADING });
    }

    try {
      if (__DEV__) console.log(`Fetching movies (attempt ${tries + 1})`);

      const res = await axios.get(BASE_URL);

      // Validate TMDB data
      if (!res.data?.results) {
        if (__DEV__) console.log("Invalid TMDB response:", res.data);

        if (tries < 3) {
          setTimeout(() => dispatch(getMovies(tries + 1)), 1500);
        } else {
          dispatch({
            type: GET_MOVIES_ERROR,
            payload: "TMDB returned invalid popular movies response",
          });
        }
        return;
      }

      dispatch({
        type: GET_MOVIES,
        payload: res.data,
      });
    } catch (e) {
      const status = e.response?.status;

      if (__DEV__) console.log("Popular movies failed:", status, e.message);

      // Do not retry for permanent client errors
      if (status >= 400 && status < 500 && status !== 429) {
        dispatch({
          type: GET_MOVIES_ERROR,
          payload: "Client error: " + e.message,
        });
        return;
      }

      // Retry transient errors
      if (tries < 3) {
        setTimeout(() => dispatch(getMovies(tries + 1)), 1500);
      } else {
        dispatch({
          type: GET_MOVIES_ERROR,
          payload: "Popular movies failed after 3 retries",
        });
      }
    }
  };
};

/* ------------------------------------------------------
   SEARCH MOVIES
-------------------------------------------------------*/
export const searchMovies = (query, tries = 0) => {
  return async function (dispatch) {
    // Only trigger loading on the very first search in the app
    if (!firstSearchDone && tries === 0) {
      dispatch({ type: SEARCH_MOVIES_LOADING });
    }

    try {
      if (__DEV__) console.log(`Search attempt ${tries + 1}:`, query);

      const res = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`
      );

      if (!res.data?.results) {
        if (__DEV__)
          console.log("Invalid TMDB search response:", res.data);

        if (tries < 3) {
          setTimeout(() => dispatch(searchMovies(query, tries + 1)), 1500);
        } else {
          dispatch({
            type: SEARCH_MOVIES_ERROR,
            payload: "TMDB returned invalid search results",
          });
        }
        return;
      }

      dispatch({
        type: SEARCH_MOVIES,
        payload: res.data,
      });
      firstSearchDone = true;
    } catch (e) {
      const status = e.response?.status;

      if (__DEV__) console.log("Search FAILED:", status, e.message);

      if (status >= 400 && status < 500 && status !== 429) {
        dispatch({
          type: SEARCH_MOVIES_ERROR,
          payload: "Client error: " + e.message,
        });
        firstSearchDone = true;
        return;
      }

      if (tries < 3) {
        setTimeout(() => dispatch(searchMovies(query, tries + 1)), 1500);
      } else {
        dispatch({
          type: SEARCH_MOVIES_ERROR,
          payload: "Search failed after 3 retries",
        });
      }
    }
  };
};

/* ------------------------------------------------------
   FAVORITES (unchanged)
-------------------------------------------------------*/
export const addFavorite = (movie) => (dispatch) => {
  dispatch({
    type: ADD_FAVORITE_ITEM,
    payload: movie,
  });
};

export const removeFavorite = (movie) => (dispatch) => {
  dispatch({
    type: REMOVE_FAVORITE_ITEM,
    payload: movie,
  });
};
