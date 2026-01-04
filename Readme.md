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

sha1 keys for OAuth public:
Production: B3:98:78:24:51:2D:6D:22:E3:CE:8F:5C:A7:6F:36:27:B2:A8:59:A3
Dev: B6:08:63:1A:EC:F8:1D:FE:1F:EE:82:B9:6A:B4:23:45:51:E8:95:94


##Functionalities
Authentication and login via google, facebook and apple
User data/state persist like redux-persist 