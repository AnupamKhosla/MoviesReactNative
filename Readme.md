# MoviesReactNative
Hybrid app in React Native(Expo) to search all released Movies and the create your favourite list. It is using TOBM api for fetching movies https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=1 



## .gitignore
```
#api keys
./firebase/firebaseConfig.ts
./firebase/GoogleService-Info.plist
./firebase/google-services.json

#Private and signing keys
debug.keystore
```

You need to generate these three files to allow google authentication via firebase and google console



##Functionalities
Authentication and login via google, facebook and apple
User data/state persist like redux-persist 