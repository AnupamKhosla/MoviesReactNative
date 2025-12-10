// screens/Movies.js

import React, {useEffect} from 'react';
import {View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { getMovies, addFavorite, removeFavorite } from '../redux/actions';


const BooksList = () => {
  const {movies, favorites} = useSelector(state => state.moviesReducer);
  const { initialLoading, error } = useSelector(state => state.moviesReducer);

  const dispatch = useDispatch();
  const fetchMovies = () => dispatch(getMovies());
  const addToFavorites = movie => dispatch(addFavorite(movie));
  const removeFromFavorites = movie => dispatch(removeFavorite(movie));
  const handleAddFavorite = movie => {
    addToFavorites(movie);
  };
  const handleRemoveFavorite = movie => {
    removeFromFavorites(movie);
  };
  const exists = movie => {
    if (favorites.filter(item => item.id === movie.id).length > 0) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchMovies();
  }, []);


  
  if (initialLoading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', paddingHorizontal:40 }}>
        <Text style={{ color:'red', fontSize:16 }}>Failed to load. {error}</Text>

        <TouchableOpacity onPress={() => fetchMovies()}>
          <Text style={{ color:'white', marginTop:10, fontSize:18 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={{flex: 1, marginTop: 0, paddingHorizontal: 20,}}>
      
      <View style={{flex: 1, marginTop: 12}}>
        <FlatList
          data={movies.results}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => {
            const IMAGE_URL =
              'https://image.tmdb.org/t/p/w185' + item.poster_path;
            return (
              <View style={{marginVertical: 12}}>
                <View style={{flexDirection: 'row', flex: 1}}>
                  <Image
                    source={{
                      uri: IMAGE_URL,
                    }}
                    resizeMode="cover"
                    style={{width: 100, height: 150, borderRadius: 10}}
                  />
                  <View style={{flex: 1, marginLeft: 12}}>
                    <View>
                      <Text style={{fontSize: 20, paddingRight: 16, color: 'rgba(256,256,256,0.9)'}}>
                        {item.title}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        marginTop: 10,
                        alignItems: 'center',
                      }}>
                      <Ionicons color="rgb(202, 182, 104)" name="thumbs-up-sharp" size={32} />
                      <Text
                        style={{
                          fontSize: 18,
                          paddingLeft: 10,
                          color: 'rgba(256,256,256,0.7)',
                        }}>
                        {item.vote_count}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          exists(item) ? handleRemoveFavorite(item) : handleAddFavorite(item)
                        }
                        activeOpacity={0.7}
                        style={{
                          marginLeft: 14,
                          flexDirection: 'row',
                          padding: 2,
                          borderRadius: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 40,
                          width: 40,
                        }}>
                        <Ionicons
                          color="orange"
                          size={32}
                          name={exists(item) ? 'heart' : 'heart-outline'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

export default BooksList;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',  
  },
});