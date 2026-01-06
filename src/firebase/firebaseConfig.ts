// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAmgu5rLOUrlEZcPzAKtqrrM5PAR-Zramg",
  authDomain: "moviesdatabasecollection.firebaseapp.com",
  projectId: "moviesdatabasecollection",
  storageBucket: "moviesdatabasecollection.firebasestorage.app",
  messagingSenderId: "667258439454",
  appId: "1:667258439454:web:df889d1826f588cac5eb0f",
  measurementId: "G-Q8DGWSWGRK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const firebaseAuth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});