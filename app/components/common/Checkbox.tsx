import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors } from '../../utils/theme';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  theme: 'dark' | 'light';
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onToggle, theme }) => {
  const palette = colors[theme];
  
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[
        styles.checkbox,
        { borderColor: palette.border },
        checked && { backgroundColor: palette.primary, borderColor: palette.primary }
      ]}
      activeOpacity={0.7}
    >
      {checked && (
        <View style={styles.checkmark}>
          <View style={[styles.checkmarkLine, styles.checkmarkLineShort, { backgroundColor: '#fff' }]} />
          <View style={[styles.checkmarkLine, styles.checkmarkLineLong, { backgroundColor: '#fff' }]} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkLine: {
    position: 'absolute',
    height: 2,
  },
  checkmarkLineShort: {
    width: 5,
    transform: [{ rotate: '45deg' }, { translateX: -2 }],
  },
  checkmarkLineLong: {
    width: 10,
    transform: [{ rotate: '-45deg' }, { translateX: 2 }],
  },
});

export default Checkbox;
