import {createStore, combineReducers, applyMiddleware, } from 'redux';
// import { configureStore } from '@reduxjs/toolkit'
import {thunk} from 'redux-thunk';
import moviesReducer from './MoviesReducers'; 
import authReducer from './authReducer';
import { initAuth } from './authActions';


const rootReducer = combineReducers({
  movies: moviesReducer, 
  auth: authReducer,
});


const store = createStore(rootReducer, {}, applyMiddleware(thunk));
store.dispatch(initAuth());
export { store };
