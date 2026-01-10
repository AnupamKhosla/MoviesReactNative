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
// We now point to your Vercel Proxy (No API Key needed here)
// Jio India blocks TMDB domain, so we use proxy to bypass that.
const PROXY_URL = "https://movie-proxy-nine.vercel.app/api/tmdb";

/* ------------------------------------------------------
   DEV-SAFE LOGS
-------------------------------------------------------*/
if (__DEV__) {
  console.log("=== DEV MODE: PROXY CONFIG ===");
  console.log("PROXY URL:", PROXY_URL);
  console.log("Note: API Key is hidden on server side");
  console.log("==============================");
}

let firstSearchDone = false; //loading spinner on first search only


// Themoviesdb server if sometimes down (may be jio india old issue fixed with proxy now)
// We set timout 5secs on axios and retry one more time and then show error.


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

      // CHANGED: We send 'endpoint' param to let proxy know what to fetch
      const res = await axios.get(PROXY_URL, {
        params: {
          endpoint: '/movie/popular',
          page: 1
        },
        timeout: 5000, // 5 second timeout IMPORTANT
      });

      // Validate TMDB data
      if (!res.data?.results) {
        if (__DEV__) console.log("Invalid TMDB response:", res.data);

        if (tries < 1) {
          setTimeout(() => dispatch(getMovies(tries + 1)), 500);
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
      if (tries < 1) {
        setTimeout(() => dispatch(getMovies(tries + 1)), 500);
      } else {
        dispatch({
          type: GET_MOVIES_ERROR,
          payload: "Popular movies failed after retry",
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

      // CHANGED: We send 'endpoint' param and 'query' param
      const res = await axios.get(PROXY_URL, {
        params: {
          endpoint: '/search/movie',
          query: query
        },
        timeout: 5000, // 5 second timeout
      });

      if (!res.data?.results) {
        if (__DEV__)
          console.log("Invalid TMDB search response:", res.data);

        if (tries < 1) {
          setTimeout(() => dispatch(searchMovies(query, tries + 1)), 500);
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

      if (tries < 1) {
        setTimeout(() => dispatch(searchMovies(query, tries + 1)), 500);
      } else {
        dispatch({
          type: SEARCH_MOVIES_ERROR,
          payload: "Search failed after retry",
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