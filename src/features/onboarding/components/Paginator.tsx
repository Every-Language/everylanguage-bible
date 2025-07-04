import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import React from 'react';
import Slides from '../screens/slides';
import { useTheme } from '@/shared';

const Paginator = (props: { scrollX: Animated.Value }) => {
  const { scrollX } = props;
  const { colors } = useTheme();

  const { width } = useWindowDimensions();

  const styles = StyleSheet.create({
    paginatorComtainer: {
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      height: '100%',
    },
    dot: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.secondary,
      marginHorizontal: 8,
    },
  });

  return (
    <View style={styles.paginatorComtainer}>
      {Slides.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 30, 10],
          extrapolate: 'clamp',
        });

        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.5, 1, 0.5], // Active dot is fully opaque
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
            key={index.toString()}></Animated.View>
        );
      })}
    </View>
  );
};

export default Paginator;
