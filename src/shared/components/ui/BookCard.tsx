import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';

// Import all book images using ES6 imports
// This is obviously going to need to get switched around to come the database, right?
// or do we want to just include these in the app because all will need them
import genesis from '../../../../assets/images/books/01_genesis.png';
import exodus from '../../../../assets/images/books/02_exodus.png';
import leviticus from '../../../../assets/images/books/03_leviticus.png';
import numbers from '../../../../assets/images/books/04_numbers.png';
import deuteronomy from '../../../../assets/images/books/05_deuteronomy.png';
import joshua from '../../../../assets/images/books/06_joshua.png';
import judges from '../../../../assets/images/books/07_judges.png';
import ruth from '../../../../assets/images/books/08_ruth.png';
import samuel1 from '../../../../assets/images/books/09_1-samuel.png';
import samuel2 from '../../../../assets/images/books/10_2-samuel.png';
import kings1 from '../../../../assets/images/books/11_1-kings.png';
import kings2 from '../../../../assets/images/books/12_2-kings.png';
import chronicles1 from '../../../../assets/images/books/13_1-chronicles.png';
import chronicles2 from '../../../../assets/images/books/14_2-chronicles.png';
import ezra from '../../../../assets/images/books/15_ezra.png';
import nehemiah from '../../../../assets/images/books/16_nehemiah.png';
import esther from '../../../../assets/images/books/17_esther.png';
import job from '../../../../assets/images/books/18_job.png';
import psalms from '../../../../assets/images/books/19_psalms.png';
import proverbs from '../../../../assets/images/books/20_proverbs.png';
import ecclesiastes from '../../../../assets/images/books/21_ecclesiastes.png';
import songOfSolomon from '../../../../assets/images/books/22_song-of-solomon.png';
import isaiah from '../../../../assets/images/books/23_isaiah.png';
import jeremiah from '../../../../assets/images/books/24_jeremiah.png';
import lamentations from '../../../../assets/images/books/25_lamentations.png';
import ezekiel from '../../../../assets/images/books/26_ezekiel.png';
import daniel from '../../../../assets/images/books/27_daniel.png';
import hosea from '../../../../assets/images/books/28_hosea.png';
import joel from '../../../../assets/images/books/29_joel.png';
import amos from '../../../../assets/images/books/30_amos.png';
import obadiah from '../../../../assets/images/books/31_obadiah.png';
import jonah from '../../../../assets/images/books/32_jonah.png';
import micah from '../../../../assets/images/books/33_micah.png';
import nahum from '../../../../assets/images/books/34_nahum.png';
import habakkuk from '../../../../assets/images/books/35_habakkuk.png';
import zephaniah from '../../../../assets/images/books/36_zephaniah.png';
import haggai from '../../../../assets/images/books/37_haggai.png';
import zechariah from '../../../../assets/images/books/38_zechariah.png';
import malachi from '../../../../assets/images/books/39_malachi.png';
import matthew from '../../../../assets/images/books/40_matthew.png';
import mark from '../../../../assets/images/books/41_mark.png';
import luke from '../../../../assets/images/books/42_luke.png';
import john from '../../../../assets/images/books/43_john.png';
import acts from '../../../../assets/images/books/44_acts.png';
import romans from '../../../../assets/images/books/45_romans.png';
import corinthians1 from '../../../../assets/images/books/46_1-corinthians.png';
import corinthians2 from '../../../../assets/images/books/47_2-corinthians.png';
import galatians from '../../../../assets/images/books/48_galatians.png';
import ephesians from '../../../../assets/images/books/49_ephesians.png';
import philippians from '../../../../assets/images/books/50_philippians.png';
import colossians from '../../../../assets/images/books/51_colossians.png';
import thessalonians1 from '../../../../assets/images/books/52_1-thessalonians.png';
import thessalonians2 from '../../../../assets/images/books/53_2-thessalonians.png';
import timothy1 from '../../../../assets/images/books/54_1-timothy.png';
import timothy2 from '../../../../assets/images/books/55_2-timothy.png';
import titus from '../../../../assets/images/books/56_titus.png';
import philemon from '../../../../assets/images/books/57_philemon.png';
import hebrews from '../../../../assets/images/books/58_hebrews.png';
import james from '../../../../assets/images/books/59_james.png';
import peter1 from '../../../../assets/images/books/60_1-peter.png';
import peter2 from '../../../../assets/images/books/61_2-peter.png';
import john1 from '../../../../assets/images/books/62_1-john.png';
import john2 from '../../../../assets/images/books/63_2-john.png';
import john3 from '../../../../assets/images/books/64_3-john.png';
import jude from '../../../../assets/images/books/65_jude.png';
import revelation from '../../../../assets/images/books/66_revelation.png';

// Create a mapping object for image lookup
const imageMap: Record<string, any> = {
  '01_genesis.png': genesis,
  '02_exodus.png': exodus,
  '03_leviticus.png': leviticus,
  '04_numbers.png': numbers,
  '05_deuteronomy.png': deuteronomy,
  '06_joshua.png': joshua,
  '07_judges.png': judges,
  '08_ruth.png': ruth,
  '09_1-samuel.png': samuel1,
  '10_2-samuel.png': samuel2,
  '11_1-kings.png': kings1,
  '12_2-kings.png': kings2,
  '13_1-chronicles.png': chronicles1,
  '14_2-chronicles.png': chronicles2,
  '15_ezra.png': ezra,
  '16_nehemiah.png': nehemiah,
  '17_esther.png': esther,
  '18_job.png': job,
  '19_psalms.png': psalms,
  '20_proverbs.png': proverbs,
  '21_ecclesiastes.png': ecclesiastes,
  '22_song-of-solomon.png': songOfSolomon,
  '23_isaiah.png': isaiah,
  '24_jeremiah.png': jeremiah,
  '25_lamentations.png': lamentations,
  '26_ezekiel.png': ezekiel,
  '27_daniel.png': daniel,
  '28_hosea.png': hosea,
  '29_joel.png': joel,
  '30_amos.png': amos,
  '31_obadiah.png': obadiah,
  '32_jonah.png': jonah,
  '33_micah.png': micah,
  '34_nahum.png': nahum,
  '35_habakkuk.png': habakkuk,
  '36_zephaniah.png': zephaniah,
  '37_haggai.png': haggai,
  '38_zechariah.png': zechariah,
  '39_malachi.png': malachi,
  '40_matthew.png': matthew,
  '41_mark.png': mark,
  '42_luke.png': luke,
  '43_john.png': john,
  '44_acts.png': acts,
  '45_romans.png': romans,
  '46_1-corinthians.png': corinthians1,
  '47_2-corinthians.png': corinthians2,
  '48_galatians.png': galatians,
  '49_ephesians.png': ephesians,
  '50_philippians.png': philippians,
  '51_colossians.png': colossians,
  '52_1-thessalonians.png': thessalonians1,
  '53_2-thessalonians.png': thessalonians2,
  '54_1-timothy.png': timothy1,
  '55_2-timothy.png': timothy2,
  '56_titus.png': titus,
  '57_philemon.png': philemon,
  '58_hebrews.png': hebrews,
  '59_james.png': james,
  '60_1-peter.png': peter1,
  '61_2-peter.png': peter2,
  '62_1-john.png': john1,
  '63_2-john.png': john2,
  '64_3-john.png': john3,
  '65_jude.png': jude,
  '66_revelation.png': revelation,
};

interface BookCardProps {
  title: string;
  imagePath?: string;
  onPress: () => void;
  onLongPress?: () => void; // Optional long press handler
  testID?: string;
  isSelected?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  title,
  imagePath,
  onPress,
  onLongPress,
  testID,
  isSelected = false,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const getImageSource = () => {
    if (!imagePath) {
      return null;
    }

    return imageMap[imagePath] || null;
  };

  const imageSource = getImageSource();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: Dimensions.radius.xl,
      padding: Dimensions.spacing.sm,
      marginHorizontal: Dimensions.spacing.xs,
      marginVertical: Dimensions.spacing.xs,
      ...Dimensions.shadow.md,
      minHeight: 110,
      flex: 1,
      borderWidth: 1,
      borderColor: isSelected ? colors.primary : colors.primary + '20', // Highlight border when selected
    },
    imageContainer: {
      alignItems: 'center',
      marginBottom: Dimensions.spacing.md,
    },
    bookImage: {
      width: Dimensions.component.bookImage.width,
      height: Dimensions.component.bookImage.height,
      borderRadius: Dimensions.radius.lg,
      tintColor: colors.text, // Apply theme-aware tinting: black in light mode, white in dark mode
    },
    fallbackIcon: {
      width: Dimensions.component.bookImage.width,
      height: Dimensions.component.bookImage.height,
      borderRadius: Dimensions.radius.lg,
      backgroundColor: colors.secondary + '30', // Use theme secondary with opacity
      justifyContent: 'center',
      alignItems: 'center',
    },
    fallbackEmoji: {
      fontSize: Fonts.size['2xl'],
    },
    textContainer: {
      alignItems: 'center',
    },
    title: {
      fontSize: Fonts.size.sm,
      fontWeight: Fonts.weight.semibold,
      textAlign: 'center',
      color: colors.text, // Use theme text color
      lineHeight: Fonts.size.lg,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      testID={testID}
      accessibilityRole='button'
      accessibilityLabel={t('bible.openBook', { title })}>
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.bookImage}
            resizeMode='contain'
          />
        ) : (
          <View style={styles.fallbackIcon}>
            <Text style={styles.fallbackEmoji}>📖</Text>
          </View>
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
