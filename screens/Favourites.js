// screens/Favorites.js

import React from 'react';
import {Text, View, FlatList, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {removeFavorite} from '../redux/actions';


const Favorites = () => {
  const {favorites} = useSelector(state => state.moviesReducer);
  const dispatch = useDispatch();
  const removeFromFavorites = movie => dispatch(removeFavorite(movie));
  const handleRemoveFavorite = movie => {
    //removeFromFavorites(movie);
    //on Fav page no action on click
  };
  return (
    <View style={{flex: 1, marginTop: 0, paddingHorizontal: 20}}>
      
      <View style={{flex: 1, marginTop: 8}}>
        {favorites.length === 0 ? (
          <Text style={{color: 'rgba(256,256,256,0.9)', fontSize: 18}}>
            Add a movie to the list.
          </Text>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
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
                          onPress={() => handleRemoveFavorite(item)}
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
                          name='heart'
                        />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
};
export default Favorites;