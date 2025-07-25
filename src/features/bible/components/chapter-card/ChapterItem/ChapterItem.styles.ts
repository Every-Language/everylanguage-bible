import { StyleSheet } from 'react-native';

export const createChapterItemStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      marginVertical: 4,
      marginHorizontal: 8,
      padding: 8,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
    },
    textContainer: {
      flexDirection: 'column',
      flex: 1,
      gap: 4,
    },
    chapterTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    verseCount: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.text + '80',
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.navigationSelected,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
