import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationMode } from 'react-native-navigation-mode';

export const useBottomNavPadding = (): number => {
  const insets = useSafeAreaInsets();
  // Get raw data directly
  const { navigationMode, loading, error } = useNavigationMode();

  return useMemo(() => {
    // 1. iOS: Always use standard Safe Area (handles Home Indicator correctly)
    if (Platform.OS === 'ios') {
      return 0;
    }

    // 2. Safety Fallback: If loading, error, or data missing, use standard Inset
    if (loading || error || !navigationMode) {
      return insets.bottom;
    }

    // 3. Android Logic
    if (navigationMode.type === 'gesture') {
      // Gesture Mode: Return 0 to allow "Edge-to-Edge"
      return 0;
    }

    if (navigationMode.type === '3_button' || navigationMode.type === '2_button') {
      // Button Mode: Return exact height of the black bar
      // Fallback to insets.bottom if height is undefined (safety)
      return navigationMode.navigationBarHeight || insets.bottom;
    }

    // Default Fallback
    return insets.bottom;
  }, [navigationMode, loading, error, insets.bottom]);
};