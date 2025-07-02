import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';
import { type Book } from '@/shared/utils';

interface ChapterViewScreenProps {
  book: Book;
  onBack: () => void;
}

export const ChapterViewScreen: React.FC<ChapterViewScreenProps> = ({
  book,
  onBack,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: Dimensions.spacing.xl,
      paddingBottom: Dimensions.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Dimensions.spacing.xs,
    },
    backButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: Dimensions.spacing.md,
      paddingVertical: Dimensions.spacing.sm,
      borderRadius: Dimensions.radius.lg,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: Fonts.size.sm,
      color: colors.background,
      fontWeight: Fonts.weight.medium,
    },
    title: {
      fontSize: Fonts.size['3xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    spacer: {
      width: 44, // Same width as back button to center title
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Dimensions.spacing.xl,
    },
    placeholder: {
      fontSize: Fonts.size.lg,
      color: colors.secondary,
      textAlign: 'center',
      lineHeight: Fonts.size.xl,
    },
    bookInfo: {
      marginTop: Dimensions.spacing.lg,
      padding: Dimensions.spacing.lg,
      backgroundColor: colors.primary + '10',
      borderRadius: Dimensions.radius.lg,
      alignItems: 'center',
    },
    bookName: {
      fontSize: Fonts.size.xl,
      fontWeight: Fonts.weight.semibold,
      color: colors.primary,
      marginBottom: Dimensions.spacing.sm,
    },
    bookDetails: {
      fontSize: Fonts.size.base,
      color: colors.text,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityLabel={t('navigation.back')}
            accessibilityRole='button'
            testID='back-button'>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{book.name}</Text>
          <View style={styles.spacer} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>
          📖{'\n\n'}
          Chapter View Screen{'\n\n'}
          This screen will be implemented later with full chapter content and
          reading features.
        </Text>

        <View style={styles.bookInfo}>
          <Text style={styles.bookName}>{book.name}</Text>
          <Text style={styles.bookDetails}>
            {book.chapters} chapters •{' '}
            {book.testament === 'old' ? 'Old' : 'New'} Testament
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};
