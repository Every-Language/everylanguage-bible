import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { Dimensions, useTheme } from '@/shared';
import Slides from '../screens/Slides';
import { navigate } from '@/app/navigation/NavigationService';

const BottomBar = (props: {
  scrollForward: () => void;
  currentIndex: number;
}) => {
  const { colors } = useTheme();

  const { scrollForward, currentIndex } = props;

  const styles = StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.lg,
    },
    nextButton: {
      paddingVertical: Dimensions.spacing.lg,
      paddingHorizontal: Dimensions.spacing['3xl'],
      borderRadius: 60,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    nextText: {
      color: colors.background,
      fontSize: Dimensions.spacing.lg,
    },
  });
  return (
    <View style={styles.container}>
      {currentIndex == Slides.length - 1 ? (
        <TouchableOpacity
          onPress={() => {
            navigate('Home');
          }}
          style={styles.nextButton}>
          <Text style={styles.nextText}>Finish</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={scrollForward} style={styles.nextButton}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default BottomBar;
