import {createStore, combineReducers, applyMiddleware} from 'redux';
// import { configureStore } from '@reduxjs/toolkit'
import {thunk} from 'redux-thunk';
import moviesReducer from './reducers';
// import initialState from './reducers';


const rootReducer = combineReducers({
  moviesReducer,
});


export const store = createStore(rootReducer, {}, applyMiddleware(thunk));

// const store = configureStore({ reducer: rootReducer }) 