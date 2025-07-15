import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';

interface TextAndQueueTabsProps {
  // Optional prop to control the tab from parent if needed
  initialTab?: 'text' | 'queue';
}

export const TextAndQueueTabs: React.FC<TextAndQueueTabsProps> = ({
  initialTab = 'text',
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'text' | 'queue'>(initialTab);

  const renderTextContent = () => {
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
      {
        id: 9,
        text: 'Through Him all things were created. Without Him, nothing was created that has been created',
        current: false,
      },
      {
        id: 10,
        text: 'In him was life, and that life was the light of all mankind.',
        current: false,
      },
      {
        id: 11,
        text: 'The light shines in the darkness, and the darkness has not overcome it.',
        current: false,
      },
      {
        id: 12,
        text: 'There was a man sent from God whose name was John.',
        current: false,
      },
      {
        id: 13,
        text: 'He came as a witness to testify concerning that light, so that through him all might believe.',
        current: false,
      },
      {
        id: 14,
        text: 'He himself was not the light; he came only as a witness to the light.',
        current: false,
      },
    ];

    return (
      <ScrollView
        style={styles.contentScrollView}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
        contentInsetAdjustmentBehavior='never'>
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

  const renderQueueContent = () => {
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
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
        contentInsetAdjustmentBehavior='never'>
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
      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'text' && [
              styles.activeToggle,
              { backgroundColor: theme.colors.primary },
            ],
          ]}
          onPress={() => setActiveTab('text')}>
          <Text
            style={[
              styles.toggleButtonText,
              {
                color:
                  activeTab === 'text'
                    ? theme.colors.background
                    : theme.colors.text,
              },
            ]}>
            Text
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'queue' && [
              styles.activeToggle,
              { backgroundColor: theme.colors.primary },
            ],
          ]}
          onPress={() => setActiveTab('queue')}>
          <Text
            style={[
              styles.toggleButtonText,
              {
                color:
                  activeTab === 'queue'
                    ? theme.colors.background
                    : theme.colors.text,
              },
            ]}>
            Queue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area - Both views are always rendered but only one is visible */}
      <View style={styles.contentContainer}>
        {/* Scrollable Background Container */}
        <View
          style={[
            styles.scrollableBackground,
            {
              backgroundColor:
                theme.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
            },
          ]}>
          {/* Text Content */}
          <View
            style={[
              styles.tabContent,
              { display: activeTab === 'text' ? 'flex' : 'none' },
            ]}>
            {renderTextContent()}
          </View>

          {/* Queue Content */}
          <View
            style={[
              styles.tabContent,
              { display: activeTab === 'queue' ? 'flex' : 'none' },
            ]}>
            {renderQueueContent()}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  activeToggle: {
    // backgroundColor will be set dynamically from theme
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  scrollableBackground: {
    flex: 1,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabContent: {
    flex: 1,
  },
  contentScrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
