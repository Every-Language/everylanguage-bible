import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';

import React from 'react';
import { Dimensions, useTheme } from '@/shared';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Paginator from './Paginator';
import { NavigationProp } from '@/types/onboarding';
import { useTranslation } from '@/shared/hooks';

const TopBar = (props: {
  scrollX: Animated.Value;
  currentIndex: number;
  scrollBackWards: () => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const { scrollX, currentIndex, scrollBackWards } = props;

  const { width: PAGE_WIDTH } = useWindowDimensions();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: PAGE_WIDTH,
      height: Dimensions.spacing['4xl'],
      padding: Dimensions.spacing.md,
    },

    leftArrowContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: Dimensions.spacing.lg,
    },
    skipText: {
      textAlign: 'center',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 100,

      paddingHorizontal: 10,
      paddingVertical: 4,
      color: colors.primary,
      backgroundColor: colors.secondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftArrowContainer}>
        {currentIndex != 0 ? (
          <TouchableOpacity
            onPress={() => {
              scrollBackWards();
            }}>
            <MaterialCommunityIcons name='arrow-left' size={24} color='black' />
          </TouchableOpacity>
        ) : (
          <></>
        )}
      </View>

      <View>
        {/* Pagination Dots */}
        <Paginator scrollX={scrollX} />
      </View>

      <TouchableOpacity
        onPress={() => {
          navigation.navigate('Home');
        }}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TopBar;
