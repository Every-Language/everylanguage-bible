import React, { useRef, useState, useCallback } from 'react';
import { View, FlatList, Dimensions, ViewToken } from 'react-native';
import { DatabaseInitStep } from './DatabaseInitStep';
import { DatabaseTablesStep } from './DatabaseTablesStep';
import { OnboardingStep } from './OnboardingStep';
import { OnboardingPagination } from './OnboardingPagination';
import { useOnboarding } from '../hooks/useOnboarding';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingContainerProps {
  onComplete: () => void;
}

export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  onComplete,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const {
    isDatabaseInitializing,
    databaseProgress,
    initializeDatabase,
    retryDatabaseInitialization,
  } = useOnboarding();

  const onboardingSteps = [
    {
      id: 'database-init',
      component: (
        <DatabaseInitStep
          isActive={currentIndex === 0}
          onNext={() => handleNext()}
          onSkip={() => handleSkip()}
          databaseProgress={databaseProgress}
          isDatabaseInitializing={isDatabaseInitializing}
          onInitializeDatabase={initializeDatabase}
          onRetryDatabase={retryDatabaseInitialization}
        />
      ),
    },
    {
      id: 'database-tables',
      component: (
        <DatabaseTablesStep
          isActive={currentIndex === 1}
          onNext={() => handleNext()}
          onSkip={() => handleSkip()}
          isLastStep={false}
        />
      ),
    },
    {
      id: 'welcome',
      component: (
        <OnboardingStep
          isActive={currentIndex === 2}
          onNext={() => handleNext()}
          onSkip={() => handleSkip()}
          isLastStep={false}
          step={{
            id: 'welcome',
            icon: '📖',
            title: 'Welcome to Your Bible App',
            subtitle: 'Your personal scripture companion',
            description:
              'Discover a world of Bible study tools, audio readings, and personalized features designed to deepen your spiritual journey.',
          }}
        />
      ),
    },
    {
      id: 'features',
      component: (
        <OnboardingStep
          isActive={currentIndex === 3}
          onNext={() => handleNext()}
          onSkip={() => handleSkip()}
          isLastStep={false}
          step={{
            id: 'features',
            icon: '✨',
            title: 'Powerful Features',
            subtitle: 'Everything you need to study',
            description:
              'Read multiple translations, listen to audio versions, create playlists, and sync your progress across devices.',
          }}
        />
      ),
    },
    {
      id: 'get-started',
      component: (
        <OnboardingStep
          isActive={currentIndex === 4}
          onNext={() => handleNext()}
          onSkip={() => handleSkip()}
          isLastStep={true}
          step={{
            id: 'get-started',
            icon: '🚀',
            title: "You're All Set!",
            subtitle: 'Ready to begin your journey',
            description:
              'Your Bible app is ready to use. Start exploring scripture, listening to audio, and building your spiritual library.',
          }}
        />
      ),
    },
  ];

  const handleNext = useCallback(() => {
    if (currentIndex < onboardingSteps.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setIsScrolling(true);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    } else {
      onComplete();
    }
  }, [currentIndex, onboardingSteps.length, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && !isScrolling) {
        const newIndex = viewableItems[0]?.index ?? 0;
        setCurrentIndex(newIndex);
      }
    },
    [isScrolling]
  );

  const handleScrollBeginDrag = useCallback(() => {
    setIsScrolling(false);
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    // Reset the flag after a short delay to allow for programmatic scrolling
    setTimeout(() => {
      setIsScrolling(false);
    }, 100);
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={{ width: screenWidth }}>{item.component}</View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={onboardingSteps}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />

      <OnboardingPagination
        totalSteps={onboardingSteps.length}
        currentStep={currentIndex}
        onStepPress={(index: number) => {
          setCurrentIndex(index);
          setIsScrolling(true);
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
          });
        }}
      />
    </View>
  );
};
