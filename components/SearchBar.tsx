import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';

import { Ionicons } from '@react-native-vector-icons/ionicons';

interface Props {
  placeholder?: string;
  placeholderTextColor?: string;
  onChangeText?: (text: string) => void;
  value?: string;
  onSubmitEditing?: () => void;
  lightTheme?: boolean;

  containerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  inputStyle?: TextStyle;

  searchIcon?: { size: number; color: string };
  clearIcon?: { size: number; color: string };
}

export default function SearchBar({
  placeholder = 'Search...',
  placeholderTextColor = 'rgba(255,255,255,0.4)',
  onChangeText = () => {},
  value = '',
  onSubmitEditing = () => {},
  lightTheme = true,

  containerStyle = {} as ViewStyle,
  inputContainerStyle = {} as ViewStyle,
  inputStyle = {} as TextStyle,

  searchIcon = { size: 24, color: 'white' },
  clearIcon = { size: 24, color: 'white' },
}: Props) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.inputContainer, inputContainerStyle]}>

        {/* Search Icon */}
        <Ionicons
          name="search-outline"
          size={searchIcon.size}
          color={searchIcon.color}
          style={{ marginLeft: 10, marginRight: 10 }}
        />

        {/* Input */}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          onChangeText={onChangeText}
          value={value}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
        />

        {/* Clear button */}
        {value?.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')}>
            <Ionicons
              name="close-circle"
              size={clearIcon.size}
              color={clearIcon.color}
              style={{ marginLeft: 10, marginRight: 10 }}
            />
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: "#52599dff",     
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 18,
    color: 'white',
    //vertical align middle
    textAlignVertical: 'center',
  },
});
