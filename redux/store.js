import {createStore, combineReducers, applyMiddleware} from 'redux';
// import { configureStore } from '@reduxjs/toolkit'
import {thunk} from 'redux-thunk';
import moviesReducer from './MoviesReducers'; 
import authReducer from './authReducer';





const rootReducer = combineReducers({
  movies: moviesReducer, 
  auth: authReducer,
});


export const store = createStore(rootReducer, {}, applyMiddleware(thunk));