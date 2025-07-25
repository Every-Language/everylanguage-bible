import { Dimensions as RNDimensions } from 'react-native';
import { Dimensions } from '@/shared/constants';
import { type Book } from '@/shared/utils';

export class TestamentLayoutService {
  private static readonly TILES_PER_ROW = 2;

  // Calculate tile dimensions for equal spacing
  static calculateTileLayout() {
    const screenWidth = RNDimensions.get('window').width;
    const totalHorizontalPadding = Dimensions.spacing.lg * 2; // Left and right padding
    const availableWidth = screenWidth - totalHorizontalPadding;
    const spaceBetweenTiles = Dimensions.spacing.md;
    const tileWidth = (availableWidth - spaceBetweenTiles) / this.TILES_PER_ROW;

    return {
      tileWidth,
      tilesPerRow: this.TILES_PER_ROW,
    };
  }

  // Group books into rows for proper spacing
  static createBookRows(
    booksList: Book[],
    includeSpecialTile: boolean = false
  ): Book[][] {
    const rows: Book[][] = [];
    const booksToProcess = includeSpecialTile
      ? [
          ...booksList,
          { id: 'go-to-new-testament', isSpecialTile: true } as any,
        ]
      : booksList;

    for (let i = 0; i < booksToProcess.length; i += this.TILES_PER_ROW) {
      rows.push(booksToProcess.slice(i, i + this.TILES_PER_ROW));
    }
    return rows;
  }
}

// Export singleton instance
export const testamentLayoutService = TestamentLayoutService;
