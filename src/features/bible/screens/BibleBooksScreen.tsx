import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { BookGrid } from '../components/BookGrid';
import { MediaPlayer } from '@/features/media';
import { useBibleBooks } from '../hooks/useBibleBooks';
import type { Book } from '../types';

type Testament = 'old' | 'new';

export const BibleBooksScreen: React.FC = () => {
  const { theme } = useTheme();
  const [selectedTestament, setSelectedTestament] = useState<Testament>('old');
  
  const {
    books,
    loading,
    error,
    selectedBook,
    selectBook,
  } = useBibleBooks();

  const handleBookSelect = (book: Book) => {
    selectBook(book);
    Alert.alert('Book Selected', `You selected: ${book.name}`);
  };

  // Filter books by testament (we'll use book_number ranges for now)
  const filteredBooks = books.filter(book => {
    if (selectedTestament === 'old') {
      return book.book_number <= 39; // Old Testament (Genesis to Malachi)
    } else {
      return book.book_number >= 40; // New Testament (Matthew onwards)
    }
  });

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
          Error Loading Books
        </Text>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Testament Selection */}
      <View style={styles.testamentContainer}>
        <TouchableOpacity
          style={[
            styles.testamentButton,
            selectedTestament === 'old' && [styles.activeTestament, { backgroundColor: theme.colors.accent }]
          ]}
          onPress={() => setSelectedTestament('old')}
        >
          <Text style={[
            styles.testamentText,
            { color: selectedTestament === 'old' ? theme.colors.textInverse : theme.colors.text }
          ]}>
            Old testament
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.testamentButton,
            selectedTestament === 'new' && [styles.activeTestament, { backgroundColor: theme.colors.accent }]
          ]}
          onPress={() => setSelectedTestament('new')}
        >
          <Text style={[
            styles.testamentText,
            { color: selectedTestament === 'new' ? theme.colors.textInverse : theme.colors.text }
          ]}>
            New testament
          </Text>
        </TouchableOpacity>
      </View>

      {/* Book Grid */}
      <BookGrid
        books={filteredBooks}
        selectedBook={selectedBook}
        onBookSelect={handleBookSelect}
        loading={loading}
      />

      {/* Media Player */}
      <MediaPlayer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  testamentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  testamentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  activeTestament: {
    // backgroundColor set dynamically
  },
  testamentText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 