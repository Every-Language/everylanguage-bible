import { View, StyleSheet, FlatList, Animated } from 'react-native';
import React, { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/store';
import { StatusBar } from 'expo-status-bar';
import Slides from './slides';
import OnBoardingItem from '../components/OnBoardingItem';
import TopBar from '../components/TopBar';
import BottomBar from '../components/BottomBar';

const OnBoardingScreen = () => {
  // Check list
  // 1. **Splash Screen**: Brief branded loading with progress indicator
  // 2. **Language Detection**: "We think you speak [Language]. Is this correct?"
  // 3. **Audio Sample**: "Tap to hear God's Word in your language"
  // 4. **Basic Setup**: Essential preferences with smart defaults
  // 5. **Content Preview**: Sample of popular content in their language
  // 6. **Quick Start**: "Start listening now" or "Explore more

  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const styles = StyleSheet.create({
    safeAreaStyle: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
  });

  const scrollX = useRef<Animated.Value>(new Animated.Value(0)).current;

  const scrollForward = () => {
    if (currentIndex < Slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const scrollBackWards = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaStyle}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.container}>
        <TopBar
          scrollX={scrollX}
          currentIndex={currentIndex}
          scrollBackWards={scrollBackWards}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          pagingEnabled
          keyExtractor={item => item.id.toString()}
          data={Slides}
          scrollEventThrottle={32}
          ref={flatListRef}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: false,
            }
          )}
          renderItem={({ item }) => (
            <OnBoardingItem
              id={item.id}
              title={item.title}
              subTitle={item.subTitle}
              image={item.image}
              component={item.component}
            />
          )}
        />
        <BottomBar currentIndex={currentIndex} scrollForward={scrollForward} />
      </View>
    </SafeAreaView>
  );
};

export default OnBoardingScreen;
