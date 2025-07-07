import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import React from 'react';
import { useTheme } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';
import genesisImage from '../../../../../assets/images/books/01_genesis.png';
import psalmsImage from '../../../../../assets/images/books/19_psalms.png';
import johnImage from '../../../../../assets/images/books/43_john.png';
import romansImage from '../../../../../assets/images/books/45_romans.png';

interface ContentPreviewProps {
  scrollForward?: () => void;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  scrollForward: _scrollForward,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const popularContent = [
    {
      id: 1,
      title: t('onboarding.contentPreview.book.genesis.title'),
      subtitle: t('onboarding.contentPreview.book.genesis.subtitle'),
      image: genesisImage,
      duration: t('onboarding.contentPreview.book.genesis.duration'),
      chapters: t('onboarding.contentPreview.book.genesis.chapters'),
    },
    {
      id: 2,
      title: t('onboarding.contentPreview.book.psalms.title'),
      subtitle: t('onboarding.contentPreview.book.psalms.subtitle'),
      image: psalmsImage,
      duration: t('onboarding.contentPreview.book.psalms.duration'),
      chapters: t('onboarding.contentPreview.book.psalms.chapters'),
    },
    {
      id: 3,
      title: t('onboarding.contentPreview.book.john.title'),
      subtitle: t('onboarding.contentPreview.book.john.subtitle'),
      image: johnImage,
      duration: t('onboarding.contentPreview.book.john.duration'),
      chapters: t('onboarding.contentPreview.book.john.chapters'),
    },
    {
      id: 4,
      title: t('onboarding.contentPreview.book.romans.title'),
      subtitle: t('onboarding.contentPreview.book.romans.subtitle'),
      image: romansImage,
      duration: t('onboarding.contentPreview.book.romans.duration'),
      chapters: t('onboarding.contentPreview.book.romans.chapters'),
    },
  ];

  const handleContentSelect = (_content: (typeof popularContent)[0]) => {
    // console.log('Selected content:', content.title);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 30,
      paddingVertical: 40,
      paddingBottom: 60,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    icon: {
      width: 80,
      height: 80,
      marginBottom: 20,
      backgroundColor: colors.primary,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconText: {
      fontSize: 32,
      color: colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      opacity: 0.8,
      lineHeight: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
    },
    contentGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 15,
    },
    contentCard: {
      width: '45%',
      backgroundColor: colors.background,
      borderRadius: 15,
      padding: 15,
      borderWidth: 2,
      borderColor: colors.primary,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    contentImage: {
      width: '100%',
      height: 80,
      borderRadius: 10,
      marginBottom: 12,
    },
    contentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    contentSubtitle: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.7,
      marginBottom: 8,
    },
    contentMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    duration: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '500',
    },
    chapters: {
      fontSize: 11,
      color: colors.text,
      opacity: 0.6,
    },
    previewText: {
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
      marginTop: 30,
      opacity: 0.8,
      lineHeight: 20,
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      bounces={true}
      alwaysBounceVertical={false}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>📚</Text>
        </View>
        <Text style={styles.title}>{t('onboarding.contentPreview.title')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.contentPreview.subtitle')}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        {t('onboarding.contentPreview.featuredBooks')}
      </Text>

      <View style={styles.contentGrid}>
        {popularContent.map(content => (
          <TouchableOpacity
            key={content.id}
            style={styles.contentCard}
            onPress={() => handleContentSelect(content)}
            activeOpacity={0.8}>
            <Image
              source={content.image}
              style={styles.contentImage}
              resizeMode='cover'
            />
            <Text style={styles.contentTitle}>{content.title}</Text>
            <Text style={styles.contentSubtitle}>{content.subtitle}</Text>
            <View style={styles.contentMeta}>
              <Text style={styles.duration}>{content.duration}</Text>
              <Text style={styles.chapters}>{content.chapters} chapters</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.previewText}>
        These are just a few examples of the complete Bible available in your
        language. Finish the setup to explore the full library.
      </Text>
    </ScrollView>
  );
};

export default ContentPreview;
