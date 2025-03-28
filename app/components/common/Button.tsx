import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  theme: 'dark' | 'light';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  theme,
  style,
  textStyle,
  disabled = false,
}) => {
  const palette = colors[theme];
  
  const buttonStyles = [
    styles.button,
    variant === 'primary' 
      ? { backgroundColor: palette.primary } 
      : { 
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: palette.primary,
        },
    disabled && { 
      opacity: 0.5,
      backgroundColor: variant === 'primary' ? palette.primary : 'transparent',
    },
    style,
  ];
  
  const textStyles = [
    styles.text,
    variant === 'primary' 
      ? { color: '#FFFFFF' } 
      : { color: palette.primary },
    textStyle,
  ];
  
  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Button;
