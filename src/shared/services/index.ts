/* eslint-disable @typescript-eslint/no-require-imports */
// Image service for handling book images
export const getBookImageSource = (imagePath: string | undefined) => {
  if (!imagePath) {
    return undefined;
  }

  // Static mapping of image paths to require() statements
  // This ensures all images are bundled at build time and loaded efficiently
  // Note: require() is required for React Native static assets, ES6 imports don't work
  const imageMap: { [key: string]: any } = {
    // Old Testament (1-39)
    '01_genesis.png': require('../../../assets/images/books/01_genesis.png'),
    '02_exodus.png': require('../../../assets/images/books/02_exodus.png'),
    '03_leviticus.png': require('../../../assets/images/books/03_leviticus.png'),
    '04_numbers.png': require('../../../assets/images/books/04_numbers.png'),
    '05_deuteronomy.png': require('../../../assets/images/books/05_deuteronomy.png'),
    '06_joshua.png': require('../../../assets/images/books/06_joshua.png'),
    '07_judges.png': require('../../../assets/images/books/07_judges.png'),
    '08_ruth.png': require('../../../assets/images/books/08_ruth.png'),
    '09_1-samuel.png': require('../../../assets/images/books/09_1-samuel.png'),
    '10_2-samuel.png': require('../../../assets/images/books/10_2-samuel.png'),
    '11_1-kings.png': require('../../../assets/images/books/11_1-kings.png'),
    '12_2-kings.png': require('../../../assets/images/books/12_2-kings.png'),
    '13_1-chronicles.png': require('../../../assets/images/books/13_1-chronicles.png'),
    '14_2-chronicles.png': require('../../../assets/images/books/14_2-chronicles.png'),
    '15_ezra.png': require('../../../assets/images/books/15_ezra.png'),
    '16_nehemiah.png': require('../../../assets/images/books/16_nehemiah.png'),
    '17_esther.png': require('../../../assets/images/books/17_esther.png'),
    '18_job.png': require('../../../assets/images/books/18_job.png'),
    '19_psalms.png': require('../../../assets/images/books/19_psalms.png'),
    '20_proverbs.png': require('../../../assets/images/books/20_proverbs.png'),
    '21_ecclesiastes.png': require('../../../assets/images/books/21_ecclesiastes.png'),
    '22_song-of-solomon.png': require('../../../assets/images/books/22_song-of-solomon.png'),
    '23_isaiah.png': require('../../../assets/images/books/23_isaiah.png'),
    '24_jeremiah.png': require('../../../assets/images/books/24_jeremiah.png'),
    '25_lamentations.png': require('../../../assets/images/books/25_lamentations.png'),
    '26_ezekiel.png': require('../../../assets/images/books/26_ezekiel.png'),
    '27_daniel.png': require('../../../assets/images/books/27_daniel.png'),
    '28_hosea.png': require('../../../assets/images/books/28_hosea.png'),
    '29_joel.png': require('../../../assets/images/books/29_joel.png'),
    '30_amos.png': require('../../../assets/images/books/30_amos.png'),
    '31_obadiah.png': require('../../../assets/images/books/31_obadiah.png'),
    '32_jonah.png': require('../../../assets/images/books/32_jonah.png'),
    '33_micah.png': require('../../../assets/images/books/33_micah.png'),
    '34_nahum.png': require('../../../assets/images/books/34_nahum.png'),
    '35_habakkuk.png': require('../../../assets/images/books/35_habakkuk.png'),
    '36_zephaniah.png': require('../../../assets/images/books/36_zephaniah.png'),
    '37_haggai.png': require('../../../assets/images/books/37_haggai.png'),
    '38_zechariah.png': require('../../../assets/images/books/38_zechariah.png'),
    '39_malachi.png': require('../../../assets/images/books/39_malachi.png'),

    // New Testament (40-66)
    '40_matthew.png': require('../../../assets/images/books/40_matthew.png'),
    '41_mark.png': require('../../../assets/images/books/41_mark.png'),
    '42_luke.png': require('../../../assets/images/books/42_luke.png'),
    '43_john.png': require('../../../assets/images/books/43_john.png'),
    '44_acts.png': require('../../../assets/images/books/44_acts.png'),
    '45_romans.png': require('../../../assets/images/books/45_romans.png'),
    '46_1-corinthians.png': require('../../../assets/images/books/46_1-corinthians.png'),
    '47_2-corinthians.png': require('../../../assets/images/books/47_2-corinthians.png'),
    '48_galatians.png': require('../../../assets/images/books/48_galatians.png'),
    '49_ephesians.png': require('../../../assets/images/books/49_ephesians.png'),
    '50_philippians.png': require('../../../assets/images/books/50_philippians.png'),
    '51_colossians.png': require('../../../assets/images/books/51_colossians.png'),
    '52_1-thessalonians.png': require('../../../assets/images/books/52_1-thessalonians.png'),
    '53_2-thessalonians.png': require('../../../assets/images/books/53_2-thessalonians.png'),
    '54_1-timothy.png': require('../../../assets/images/books/54_1-timothy.png'),
    '55_2-timothy.png': require('../../../assets/images/books/55_2-timothy.png'),
    '56_titus.png': require('../../../assets/images/books/56_titus.png'),
    '57_philemon.png': require('../../../assets/images/books/57_philemon.png'),
    '58_hebrews.png': require('../../../assets/images/books/58_hebrews.png'),
    '59_james.png': require('../../../assets/images/books/59_james.png'),
    '60_1-peter.png': require('../../../assets/images/books/60_1-peter.png'),
    '61_2-peter.png': require('../../../assets/images/books/61_2-peter.png'),
    '62_1-john.png': require('../../../assets/images/books/62_1-john.png'),
    '63_2-john.png': require('../../../assets/images/books/63_2-john.png'),
    '64_3-john.png': require('../../../assets/images/books/64_3-john.png'),
    '65_jude.png': require('../../../assets/images/books/65_jude.png'),
    '66_revelation.png': require('../../../assets/images/books/66_revelation.png'),
  };

  return imageMap[imagePath] || undefined;
};
