import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 

// --- 1. Import Hook ---
import { useBottomNavPadding } from '../hooks/useBottomNavPadding';
import { closeAuthModal } from '../redux/authActions';
import { COLORS, GRADIENTS } from '../constants/theme';

export default function GlobalAuthModal() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  
  // --- 2. Get Dynamic Padding ---
  const bottomPadding = useBottomNavPadding();

  // Select Auth State
  const { showModal, modalType, user } = useSelector((state) => state.auth);
  
  // Watch current screen to auto-hide if on Auth screen
  const currentRouteName = useNavigationState(state => 
    state ? state.routes[state.index].name : undefined
  );

  const slideAnim = useRef(new Animated.Value(100)).current; 
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Auto-close if user manually navigates to Auth screen
  useEffect(() => {
    if (showModal && currentRouteName === 'Auth') {
      handleClose();
    }
  }, [currentRouteName, showModal]);

  // Animation & Timer Logic
  useEffect(() => {
    if (showModal) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0, 
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (modalType === 'WELCOME') {
        const timer = setTimeout(() => handleClose(), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      slideAnim.setValue(100); 
      fadeAnim.setValue(0);
    }
  }, [showModal, modalType]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 100, 
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dispatch(closeAuthModal());
    });
  };

  const handleSignInPress = () => {
    handleClose();
    navigation.navigate('Auth'); 
  };

  if (!showModal) return null;

  // --- 3. Dynamic Calculation ---
  // We want the modal to sit ABOVE the tab bar.
  // Tab Bar Height is typically 60 + bottomPadding.
  // We add 20px extra margin for spacing.
  const dynamicBottomPosition = 60 + bottomPadding + 20;

  return (
    <View 
      style={[
        styles.container, 
        { bottom: dynamicBottomPosition } // <--- Apply Dynamic Height Here
      ]}
    >
      <Animated.View 
        style={[
          styles.toast, 
          { 
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim
          }
        ]}
      >
        {modalType === 'WELCOME' ? (
          <View style={styles.row}>
            <Image 
              source={{ uri: user?.photoURL || 'https://via.placeholder.com/50' }} 
              style={styles.miniAvatar} 
            />
            <Text style={styles.text}>
              Welcome back, <Text style={styles.bold}>{user?.displayName?.split(' ')[0] || 'User'}</Text>
            </Text>
          </View>
        ) : (
          <View style={styles.row}>
            <Text style={[styles.text, { flex: 1 }]}>
              Sync your watchlist
            </Text>

            <TouchableOpacity 
              style={styles.signInBtn} 
              onPress={handleSignInPress}
            >
              <Text style={styles.signInText}>SIGN IN</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleClose} style={styles.closeX}>
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // bottom: 130,  <--- REMOVED (Handled dynamically in render)
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  toast: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: GRADIENTS.middle, 
    paddingVertical: 14,
    paddingLeft: 20,
    paddingRight: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    flexDirection: 'row', 
    alignItems: 'center',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  miniAvatar: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    marginRight: 12, 
    borderWidth: 1, 
    borderColor: COLORS.accent 
  },
  text: { 
    color: COLORS.textPrimary, 
    fontSize: 16, 
    fontWeight: '600',
    letterSpacing: 0.2
  },
  bold: { 
    fontWeight: 'bold', 
    color: COLORS.accent 
  },
  signInBtn: {
    backgroundColor: COLORS.accent, 
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
    minHeight: 40, 
    justifyContent: 'center'
  },
  signInText: { 
    color: '#000000', 
    fontWeight: 'bold', 
    fontSize: 14, 
    letterSpacing: 0.5 
  },
  closeX: { 
    padding: 10, 
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  }
});