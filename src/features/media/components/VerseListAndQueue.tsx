import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';

interface VerseListAndQueueProps {
  viewMode: 'text' | 'queue';
}

export const VerseListAndQueue: React.FC<VerseListAndQueueProps> = ({
  viewMode,
}) => {
  const { theme } = useTheme();

  const renderTextView = () => {
    const mockVerses = [
      {
        id: 1,
        text: 'In the beginning, was the word, and the word was with God, and the word was God',
        current: true,
      },
      { id: 2, text: 'He was with God in the beginning', current: false },
      {
        id: 3,
        text: 'Through Him all things were created. Without Him, nothing was created that has been created',
        current: false,
      },
      {
        id: 4,
        text: 'In him was life, and that life was the light of all mankind.',
        current: false,
      },
      {
        id: 5,
        text: 'The light shines in the darkness, and the darkness has not overcome it.',
        current: false,
      },
      {
        id: 6,
        text: 'There was a man sent from God whose name was John.',
        current: false,
      },
      {
        id: 7,
        text: 'He came as a witness to testify concerning that light, so that through him all might believe.',
        current: false,
      },
      {
        id: 8,
        text: 'He himself was not the light; he came only as a witness to the light.',
        current: false,
      },
    ];

    return (
      <ScrollView
        style={styles.contentScrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.versesContainer}>
          {mockVerses.map(verse => (
            <View key={verse.id} style={styles.verseContainer}>
              <View style={styles.verseHeader}>
                <Text
                  style={[
                    styles.verseNumber,
                    { color: theme.colors.textSecondary },
                  ]}>
                  VERSE {verse.id}
                </Text>
                <TouchableOpacity>
                  <MaterialIcons
                    name='info-outline'
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.verseText,
                  {
                    color: verse.current
                      ? theme.colors.text
                      : theme.colors.textSecondary,
                    opacity: verse.current ? 1 : 0.6,
                  },
                ]}>
                {verse.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderQueueView = () => {
    const mockQueue = [
      {
        id: 1,
        title: 'John Chapter 2',
        subtitle: 'ENGLISH - BSB',
        current: false,
      },
      {
        id: 2,
        title: 'John Chapter 3',
        subtitle: 'ENGLISH - BSB',
        current: false,
      },
      {
        id: 3,
        title: 'John Chapter 4',
        subtitle: 'ENGLISH - BSB',
        current: false,
      },
    ];

    return (
      <ScrollView
        style={styles.contentScrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.queueContainer}>
          <Text
            style={[styles.queueSectionTitle, { color: theme.colors.text }]}>
            User queue
          </Text>

          {mockQueue.map(item => (
            <View key={item.id} style={styles.queueItem}>
              <MaterialIcons
                name='drag-handle'
                size={20}
                color={theme.colors.textSecondary}
              />
              <View style={styles.queueItemText}>
                <Text
                  style={[styles.queueItemTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.queueItemSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
          ))}

          <Text
            style={[
              styles.queueSectionTitle,
              { color: theme.colors.text, marginTop: 24 },
            ]}>
            Up next
          </Text>

          {mockQueue.map(item => (
            <View key={`next-${item.id}`} style={styles.queueItem}>
              <MaterialIcons
                name='play-arrow'
                size={20}
                color={theme.colors.textSecondary}
              />
              <View style={styles.queueItemText}>
                <Text
                  style={[styles.queueItemTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.queueItemSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {viewMode === 'text' ? renderTextView() : renderQueueView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentScrollView: {
    flex: 1,
  },
  versesContainer: {
    paddingBottom: 20,
  },
  verseContainer: {
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
  },
  queueContainer: {
    paddingBottom: 20,
  },
  queueSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  queueItemText: {
    flex: 1,
    marginLeft: 12,
  },
  queueItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  queueItemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
