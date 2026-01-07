import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ImageStyle, StyleProp } from 'react-native';

interface SafeAvatarProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  fallbackIcon?: string; // Optional: Allow customizing the emoji/text
}

export const SafeAvatar = ({ uri, style, fallbackIcon = "👤" }: SafeAvatarProps) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if the URI changes (e.g., user logs out and back in as someone else)
  useEffect(() => {
    setHasError(false);
  }, [uri]);

  // A. IF ERROR or NO URI: Return the Gray Placeholder
  if (hasError || !uri) {
    return (
      <View style={[style, styles.fallbackContainer]}>
        <Text style={styles.fallbackText}>{fallbackIcon}</Text>
      </View>
    );
  }

  // B. NORMAL: Try to render the image
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#cccccc', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  fallbackText: {
    fontSize: 40, // Adjusted size to look good in a 100x100 circle
  }
});