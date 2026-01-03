// src/constants/theme.ts

export const COLORS = {
  // Core Identity
  primary: '#7A0000',    // The Deep Red Background
  primaryDark: '#2b0505', // The Darker/Blackish Red (for gradients/overlays)
  accent: '#FFD700',     // Gold (for Highlights/Active states)
  
  // UI Elements
  card: '#7e1111ff',     // Lighter Red for Cards
  border: '#5c1414',     // Subtle borders
  
  // Text
  textPrimary: '#ffffff',
  textSecondary: '#d1d5db', // Greyish text
  textPlaceholder: '#888888',

  // Social Brands (Centralized here)
  google: '#EA4335',
  facebook: '#1877F2',
  apple: '#000000',

  // Functional
  success: '#10B981',
  error: '#EF4444',
  transparentInput: 'rgba(0, 0, 0, 0.3)',
};

export const GRADIENTS = {
  start: '#360000',
  end: '#7A0000',
  middle: '#9a0000ff',
  mainBackground: ['#360000', '#7A0000'],
};
