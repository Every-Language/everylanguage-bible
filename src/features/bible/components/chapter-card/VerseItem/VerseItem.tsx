import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Stack, Text as TamaguiText } from '@tamagui/core';
import { Card } from '@tamagui/card';
import { useTheme } from '@/shared/store';
import { PlayIcon, PlusIcon } from '@/shared/components/ui/icons/AudioIcons';
import { createVerseItemStyles } from './VerseItem.styles';

export interface VerseItemProps {
  verseNumber: number;
  verseText: string;
  onPlay: () => void;
  onAddToQueue: () => void;
  testID?: string;
}

export const VerseItem: React.FC<VerseItemProps> = ({
  verseNumber,
  verseText,
  onPlay,
  onAddToQueue,
  testID,
}) => {
  const { colors } = useTheme();
  const styles = createVerseItemStyles(colors);

  return (
    <Card
      size='$4'
      marginVertical='$1'
      marginHorizontal='$2'
      padding='$2'
      backgroundColor={colors.background}
      testID={testID}
      onPress={onPlay}
      pressStyle={{ scale: 0.98 }}>
      <Stack
        flexDirection='row'
        alignItems='center'
        justifyContent='space-between'
        flex={1}>
        <Stack flexDirection='column' flex={1} gap='$1'>
          <TamaguiText fontSize='$4' fontWeight='600' color={colors.text}>
            Verse {verseNumber}
          </TamaguiText>
          <TamaguiText
            fontSize='$3'
            fontWeight='400'
            color={colors.text}
            numberOfLines={2}
            ellipsizeMode='tail'>
            {verseText}
          </TamaguiText>
        </Stack>

        <Stack flexDirection='row' alignItems='center' gap='$2'>
          {/* Add to Queue Button */}
          <TouchableOpacity onPress={onAddToQueue} style={styles.actionButton}>
            <PlusIcon size={18} color={colors.background} />
          </TouchableOpacity>

          {/* Play Button */}
          <TouchableOpacity onPress={onPlay} style={styles.actionButton}>
            <PlayIcon size={20} color={colors.background} />
          </TouchableOpacity>
        </Stack>
      </Stack>
    </Card>
  );
};
