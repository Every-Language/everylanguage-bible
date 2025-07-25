import { QueueItem } from '@/types/queue';
import { verseCountRepository } from '../data/verseCountRepository';

export interface QueueItemDisplayDetails {
  title: string;
  subtitle: string;
  description: string;
  duration: number;
}

export class QueueItemService {
  // Get display information based on item type
  getItemDetails(item: QueueItem): QueueItemDisplayDetails {
    switch (item.type) {
      case 'chapter': {
        const chapter = item.data as any;
        const verseCount = verseCountRepository.getChapterVerseCount(
          chapter.book_name,
          chapter.chapter_number
        );
        return {
          title: `${chapter.book_name} ${chapter.chapter_number}`,
          subtitle: '',
          description: `All ${verseCount} verses`,
          duration: chapter.duration_seconds,
        };
      }
      case 'passage': {
        const passage = item.data as any;
        // Extract book and chapter from the passage title or chapter_id
        const chapterIdMatch = passage.chapter_id?.match(/^(.+)-(\d+)$/);
        if (chapterIdMatch) {
          const bookName = chapterIdMatch[1]
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          const chapterNumber = chapterIdMatch[2];
          return {
            title: `${bookName} ${chapterNumber}:${passage.start_verse}-${passage.end_verse}`,
            subtitle: '',
            description: `${passage.end_verse - passage.start_verse + 1} verses`,
            duration: passage.end_time_seconds - passage.start_time_seconds,
          };
        } else {
          return {
            title: passage.title,
            subtitle: '',
            description: `Verses ${passage.start_verse}-${passage.end_verse}`,
            duration: passage.end_time_seconds - passage.start_time_seconds,
          };
        }
      }
      case 'playlist': {
        const playlist = item.data as any;
        return {
          title: playlist.title,
          subtitle: 'Playlist',
          description: playlist.description || 'Custom playlist',
          duration: 0,
        };
      }
      default:
        return {
          title: 'Unknown Item',
          subtitle: '',
          description: '',
          duration: 0,
        };
    }
  }

  // Format duration for display
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const queueItemService = new QueueItemService();
