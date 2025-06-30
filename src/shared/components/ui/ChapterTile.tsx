import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ChapterTileProps {
  chapterNumber: number;
  onPress: (chapterNumber: number) => void;
  testID?: string;
}

export const ChapterTile: React.FC<ChapterTileProps> = ({
  chapterNumber,
  onPress,
  testID,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(chapterNumber)}
      accessibilityLabel={`Chapter ${chapterNumber}`}
      accessibilityRole='button'
      testID={testID}>
      <Text style={styles.chapterNumber}>{chapterNumber}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chapterNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
