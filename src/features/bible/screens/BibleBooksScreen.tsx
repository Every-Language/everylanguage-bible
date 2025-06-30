import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Text,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { BookCard } from '@/shared/components/ui/BookCard';

interface Book {
  id: string;
  name: string;
  testament: 'old' | 'new';
  chapters: number;
  order: number;
  imagePath: string;
}

// Complete Bible books data with all 66 books
const BIBLE_BOOKS: Book[] = [
  // Old Testament
  {
    id: '01',
    name: 'Genesis',
    testament: 'old',
    chapters: 50,
    order: 1,
    imagePath: '01_genesis.png',
  },
  {
    id: '02',
    name: 'Exodus',
    testament: 'old',
    chapters: 40,
    order: 2,
    imagePath: '02_exodus.png',
  },
  {
    id: '03',
    name: 'Leviticus',
    testament: 'old',
    chapters: 27,
    order: 3,
    imagePath: '03_leviticus.png',
  },
  {
    id: '04',
    name: 'Numbers',
    testament: 'old',
    chapters: 36,
    order: 4,
    imagePath: '04_numbers.png',
  },
  {
    id: '05',
    name: 'Deuteronomy',
    testament: 'old',
    chapters: 34,
    order: 5,
    imagePath: '05_deuteronomy.png',
  },
  {
    id: '06',
    name: 'Joshua',
    testament: 'old',
    chapters: 24,
    order: 6,
    imagePath: '06_joshua.png',
  },
  {
    id: '07',
    name: 'Judges',
    testament: 'old',
    chapters: 21,
    order: 7,
    imagePath: '07_judges.png',
  },
  {
    id: '08',
    name: 'Ruth',
    testament: 'old',
    chapters: 4,
    order: 8,
    imagePath: '08_ruth.png',
  },
  {
    id: '09',
    name: '1 Samuel',
    testament: 'old',
    chapters: 31,
    order: 9,
    imagePath: '09_1-samuel.png',
  },
  {
    id: '10',
    name: '2 Samuel',
    testament: 'old',
    chapters: 24,
    order: 10,
    imagePath: '10_2-samuel.png',
  },
  {
    id: '11',
    name: '1 Kings',
    testament: 'old',
    chapters: 22,
    order: 11,
    imagePath: '11_1-kings.png',
  },
  {
    id: '12',
    name: '2 Kings',
    testament: 'old',
    chapters: 25,
    order: 12,
    imagePath: '12_2-kings.png',
  },
  {
    id: '13',
    name: '1 Chronicles',
    testament: 'old',
    chapters: 29,
    order: 13,
    imagePath: '13_1-chronicles.png',
  },
  {
    id: '14',
    name: '2 Chronicles',
    testament: 'old',
    chapters: 36,
    order: 14,
    imagePath: '14_2-chronicles.png',
  },
  {
    id: '15',
    name: 'Ezra',
    testament: 'old',
    chapters: 10,
    order: 15,
    imagePath: '15_ezra.png',
  },
  {
    id: '16',
    name: 'Nehemiah',
    testament: 'old',
    chapters: 13,
    order: 16,
    imagePath: '16_nehemiah.png',
  },
  {
    id: '17',
    name: 'Esther',
    testament: 'old',
    chapters: 10,
    order: 17,
    imagePath: '17_esther.png',
  },
  {
    id: '18',
    name: 'Job',
    testament: 'old',
    chapters: 42,
    order: 18,
    imagePath: '18_job.png',
  },
  {
    id: '19',
    name: 'Psalms',
    testament: 'old',
    chapters: 150,
    order: 19,
    imagePath: '19_psalms.png',
  },
  {
    id: '20',
    name: 'Proverbs',
    testament: 'old',
    chapters: 31,
    order: 20,
    imagePath: '20_proverbs.png',
  },
  {
    id: '21',
    name: 'Ecclesiastes',
    testament: 'old',
    chapters: 12,
    order: 21,
    imagePath: '21_ecclesiastes.png',
  },
  {
    id: '22',
    name: 'Song of Solomon',
    testament: 'old',
    chapters: 8,
    order: 22,
    imagePath: '22_song-of-solomon.png',
  },
  {
    id: '23',
    name: 'Isaiah',
    testament: 'old',
    chapters: 66,
    order: 23,
    imagePath: '23_isaiah.png',
  },
  {
    id: '24',
    name: 'Jeremiah',
    testament: 'old',
    chapters: 52,
    order: 24,
    imagePath: '24_jeremiah.png',
  },
  {
    id: '25',
    name: 'Lamentations',
    testament: 'old',
    chapters: 5,
    order: 25,
    imagePath: '25_lamentations.png',
  },
  {
    id: '26',
    name: 'Ezekiel',
    testament: 'old',
    chapters: 48,
    order: 26,
    imagePath: '26_ezekiel.png',
  },
  {
    id: '27',
    name: 'Daniel',
    testament: 'old',
    chapters: 12,
    order: 27,
    imagePath: '27_daniel.png',
  },
  {
    id: '28',
    name: 'Hosea',
    testament: 'old',
    chapters: 14,
    order: 28,
    imagePath: '28_hosea.png',
  },
  {
    id: '29',
    name: 'Joel',
    testament: 'old',
    chapters: 3,
    order: 29,
    imagePath: '29_joel.png',
  },
  {
    id: '30',
    name: 'Amos',
    testament: 'old',
    chapters: 9,
    order: 30,
    imagePath: '30_amos.png',
  },
  {
    id: '31',
    name: 'Obadiah',
    testament: 'old',
    chapters: 1,
    order: 31,
    imagePath: '31_obadiah.png',
  },
  {
    id: '32',
    name: 'Jonah',
    testament: 'old',
    chapters: 4,
    order: 32,
    imagePath: '32_jonah.png',
  },
  {
    id: '33',
    name: 'Micah',
    testament: 'old',
    chapters: 7,
    order: 33,
    imagePath: '33_micah.png',
  },
  {
    id: '34',
    name: 'Nahum',
    testament: 'old',
    chapters: 3,
    order: 34,
    imagePath: '34_nahum.png',
  },
  {
    id: '35',
    name: 'Habakkuk',
    testament: 'old',
    chapters: 3,
    order: 35,
    imagePath: '35_habakkuk.png',
  },
  {
    id: '36',
    name: 'Zephaniah',
    testament: 'old',
    chapters: 3,
    order: 36,
    imagePath: '36_zephaniah.png',
  },
  {
    id: '37',
    name: 'Haggai',
    testament: 'old',
    chapters: 2,
    order: 37,
    imagePath: '37_haggai.png',
  },
  {
    id: '38',
    name: 'Zechariah',
    testament: 'old',
    chapters: 14,
    order: 38,
    imagePath: '38_zechariah.png',
  },
  {
    id: '39',
    name: 'Malachi',
    testament: 'old',
    chapters: 4,
    order: 39,
    imagePath: '39_malachi.png',
  },

  // New Testament
  {
    id: '40',
    name: 'Matthew',
    testament: 'new',
    chapters: 28,
    order: 40,
    imagePath: '40_matthew.png',
  },
  {
    id: '41',
    name: 'Mark',
    testament: 'new',
    chapters: 16,
    order: 41,
    imagePath: '41_mark.png',
  },
  {
    id: '42',
    name: 'Luke',
    testament: 'new',
    chapters: 24,
    order: 42,
    imagePath: '42_luke.png',
  },
  {
    id: '43',
    name: 'John',
    testament: 'new',
    chapters: 21,
    order: 43,
    imagePath: '43_john.png',
  },
  {
    id: '44',
    name: 'Acts',
    testament: 'new',
    chapters: 28,
    order: 44,
    imagePath: '44_acts.png',
  },
  {
    id: '45',
    name: 'Romans',
    testament: 'new',
    chapters: 16,
    order: 45,
    imagePath: '45_romans.png',
  },
  {
    id: '46',
    name: '1 Corinthians',
    testament: 'new',
    chapters: 16,
    order: 46,
    imagePath: '46_1-corinthians.png',
  },
  {
    id: '47',
    name: '2 Corinthians',
    testament: 'new',
    chapters: 13,
    order: 47,
    imagePath: '47_2-corinthians.png',
  },
  {
    id: '48',
    name: 'Galatians',
    testament: 'new',
    chapters: 6,
    order: 48,
    imagePath: '48_galatians.png',
  },
  {
    id: '49',
    name: 'Ephesians',
    testament: 'new',
    chapters: 6,
    order: 49,
    imagePath: '49_ephesians.png',
  },
  {
    id: '50',
    name: 'Philippians',
    testament: 'new',
    chapters: 4,
    order: 50,
    imagePath: '50_philippians.png',
  },
  {
    id: '51',
    name: 'Colossians',
    testament: 'new',
    chapters: 4,
    order: 51,
    imagePath: '51_colossians.png',
  },
  {
    id: '52',
    name: '1 Thessalonians',
    testament: 'new',
    chapters: 5,
    order: 52,
    imagePath: '52_1-thessalonians.png',
  },
  {
    id: '53',
    name: '2 Thessalonians',
    testament: 'new',
    chapters: 3,
    order: 53,
    imagePath: '53_2-thessalonians.png',
  },
  {
    id: '54',
    name: '1 Timothy',
    testament: 'new',
    chapters: 6,
    order: 54,
    imagePath: '54_1-timothy.png',
  },
  {
    id: '55',
    name: '2 Timothy',
    testament: 'new',
    chapters: 4,
    order: 55,
    imagePath: '55_2-timothy.png',
  },
  {
    id: '56',
    name: 'Titus',
    testament: 'new',
    chapters: 3,
    order: 56,
    imagePath: '56_titus.png',
  },
  {
    id: '57',
    name: 'Philemon',
    testament: 'new',
    chapters: 1,
    order: 57,
    imagePath: '57_philemon.png',
  },
  {
    id: '58',
    name: 'Hebrews',
    testament: 'new',
    chapters: 13,
    order: 58,
    imagePath: '58_hebrews.png',
  },
  {
    id: '59',
    name: 'James',
    testament: 'new',
    chapters: 5,
    order: 59,
    imagePath: '59_james.png',
  },
  {
    id: '60',
    name: '1 Peter',
    testament: 'new',
    chapters: 5,
    order: 60,
    imagePath: '60_1-peter.png',
  },
  {
    id: '61',
    name: '2 Peter',
    testament: 'new',
    chapters: 3,
    order: 61,
    imagePath: '61_2-peter.png',
  },
  {
    id: '62',
    name: '1 John',
    testament: 'new',
    chapters: 5,
    order: 62,
    imagePath: '62_1-john.png',
  },
  {
    id: '63',
    name: '2 John',
    testament: 'new',
    chapters: 1,
    order: 63,
    imagePath: '63_2-john.png',
  },
  {
    id: '64',
    name: '3 John',
    testament: 'new',
    chapters: 1,
    order: 64,
    imagePath: '64_3-john.png',
  },
  {
    id: '65',
    name: 'Jude',
    testament: 'new',
    chapters: 1,
    order: 65,
    imagePath: '65_jude.png',
  },
  {
    id: '66',
    name: 'Revelation',
    testament: 'new',
    chapters: 22,
    order: 66,
    imagePath: '66_revelation.png',
  },
];

interface BibleBooksScreenProps {
  onBookSelect: (book: Book) => void;
}

export const BibleBooksScreen: React.FC<BibleBooksScreenProps> = ({
  onBookSelect,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading books from API/database
    const loadBooks = async () => {
      try {
        // This would be your actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setBooks(BIBLE_BOOKS);
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  // Separate books by testament
  const oldTestamentBooks = books.filter(book => book.testament === 'old');
  const newTestamentBooks = books.filter(book => book.testament === 'new');

  const renderBook = ({ item }: { item: Book }) => (
    <View style={styles.bookContainer}>
      <BookCard
        title={item.name}
        imagePath={item.imagePath}
        onPress={() => onBookSelect(item)}
        testID={`book-card-${item.id}`}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#007AFF' />
        <Text style={styles.loadingText}>Loading Bible books...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bible</Text>
        <Text style={styles.subtitle}>Choose a book to start listening</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Old Testament Section */}
        <View style={styles.testamentSection}>
          <Text style={styles.testamentTitle}>Old Testament</Text>
          <FlatList
            data={oldTestamentBooks}
            renderItem={renderBook}
            keyExtractor={item => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContent}
            testID='old-testament-books-list'
          />
        </View>

        {/* New Testament Section */}
        <View style={styles.testamentSection}>
          <Text style={styles.testamentTitle}>New Testament</Text>
          <FlatList
            data={newTestamentBooks}
            renderItem={renderBook}
            keyExtractor={item => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContent}
            testID='new-testament-books-list'
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for mini-player
  },
  testamentSection: {
    marginBottom: 24,
  },
  testamentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  gridContent: {
    paddingHorizontal: 12,
  },
  bookContainer: {
    flex: 1,
    maxWidth: '33.33%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
});
