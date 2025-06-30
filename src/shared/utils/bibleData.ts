import bibleData from '../../../assets/data/en.json';

export interface Book {
  id: string;
  name: string;
  testament: 'old' | 'new';
  chapters: number;
  order: number;
  imagePath: string;
}

// Testament boundaries (book order)
const OLD_TESTAMENT_END = 39;

// Map book names to their image file names
const getImagePath = (name: string, order: number): string => {
  const paddedOrder = order.toString().padStart(2, '0');

  // Special cases for books with different naming conventions
  const nameMap: { [key: string]: string } = {
    '1 Samuel': '1-samuel',
    '2 Samuel': '2-samuel',
    '1 Kings': '1-kings',
    '2 Kings': '2-kings',
    '1 Chronicles': '1-chronicles',
    '2 Chronicles': '2-chronicles',
    'Song of Solomon': 'song-of-solomon',
    '1 Corinthians': '1-corinthians',
    '2 Corinthians': '2-corinthians',
    '1 Thessalonians': '1-thessalonians',
    '2 Thessalonians': '2-thessalonians',
    '1 Timothy': '1-timothy',
    '2 Timothy': '2-timothy',
    '1 Peter': '1-peter',
    '2 Peter': '2-peter',
    '1 John': '1-john',
    '2 John': '2-john',
    '3 John': '3-john',
  };

  const fileName = nameMap[name] || name.toLowerCase().replace(/\s+/g, '-');
  return `${paddedOrder}_${fileName}.png`;
};

export const loadBibleBooks = (): Book[] => {
  return bibleData.books.map((book, index) => {
    const order = index + 1;
    return {
      id: order.toString().padStart(2, '0'),
      name: book.name,
      testament: order <= OLD_TESTAMENT_END ? 'old' : 'new',
      chapters: book.chapters.length,
      order,
      imagePath: getImagePath(book.name, order),
    };
  });
};
