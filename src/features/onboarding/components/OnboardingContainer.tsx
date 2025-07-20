import React, { useRef, useState, useCallback } from 'react';
import { View, FlatList, Dimensions, ViewToken } from 'react-native';
import { DatabaseInitStep } from './DatabaseInitStep';
import { DatabaseTablesStep } from './DatabaseTablesStep';
import { OnboardingStep } from './OnboardingStep';
import { OnboardingPagination } from './OnboardingPagination';
import { useOnboarding } from '../hooks/useOnboarding';
import { OnboardingStepData } from '../types';

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
    state,
    nextStep,
    isDatabaseInitializing,
    databaseProgress,
    initializeDatabase,
    retryDatabaseInitialization,
  } = useOnboarding();

  const renderStepComponent = useCallback(
    (step: OnboardingStepData, index: number) => {
      const isActive = currentIndex === index;
      const isLastStep = index === state.steps.length - 1;

      if (step.isDatabaseStep) {
        if (step.id === 'database-init') {
          return (
            <DatabaseInitStep
              step={step}
              isActive={isActive}
              onNext={nextStep}
              onSkip={onComplete}
              isLastStep={isLastStep}
              databaseProgress={databaseProgress}
              isDatabaseInitializing={isDatabaseInitializing}
              onInitializeDatabase={initializeDatabase}
              onRetryDatabase={retryDatabaseInitialization}
            />
          );
        } else if (step.id === 'database-tables') {
          return (
            <DatabaseTablesStep
              step={step}
              isActive={isActive}
              onNext={nextStep}
              onSkip={onComplete}
              isLastStep={isLastStep}
            />
          );
        }
      }

      return (
        <OnboardingStep
          step={step}
          isActive={isActive}
          onNext={nextStep}
          onSkip={onComplete}
          isLastStep={isLastStep}
        />
      );
    },
    [
      currentIndex,
      state.steps.length,
      nextStep,
      onComplete,
      databaseProgress,
      isDatabaseInitializing,
      initializeDatabase,
      retryDatabaseInitialization,
    ]
  );

  // const handleNext = useCallback(() => {
  //   if (currentIndex < state.steps.length - 1) {
  //     const nextIndex = currentIndex + 1;
  //     setCurrentIndex(nextIndex);
  //     setIsScrolling(true);
  //     flatListRef.current?.scrollToIndex({
  //       index: nextIndex,
  //       animated: true,
  //     });
  //   } else {
  //     onComplete();
  //   }
  // }, [currentIndex, state.steps.length, onComplete]);

  // const handleSkip = useCallback(() => {
  //   onComplete();
  // }, [onComplete]);

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

  const renderItem = ({
    item,
    index,
  }: {
    item: OnboardingStepData;
    index: number;
  }) => (
    <View style={{ width: screenWidth }}>
      {renderStepComponent(item, index)}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={state.steps}
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
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />

      <OnboardingPagination
        totalSteps={state.steps.length}
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
