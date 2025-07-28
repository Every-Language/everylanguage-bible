import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ChapterQueueExample } from '../ChapterQueueExample';

// Mock the hooks
jest.mock('../../hooks/useChapterQueue', () => ({
  useChapterQueue: () => ({
    chapterAudioInfo: [
      {
        chapterId: 'ch1',
        hasAudioFiles: true,
        hasVersesMarked: true,
        mediaFiles: [
          {
            id: 'mf1',
            media_type: 'audio',
            duration_seconds: 120,
            file_size: 1024000,
            language_entity_id: 'lang1',
            sequence_id: 'seq1',
            version: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            local_path: '/path/to/file.mp3',
            remote_path: 'https://example.com/file.mp3',
            verses: '["v1", "v2"]',
            upload_status: 'completed',
            publish_status: 'published',
            check_status: 'checked',
            deleted_at: null,
            chapter_id: 'ch1',
          },
        ],
        mediaFileVerses: [
          {
            id: 'mfv1',
            media_file_id: 'mf1',
            verse_id: 'v1',
            start_time_seconds: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            synced_at: '2024-01-01T00:00:00Z',
          },
        ],
        totalDuration: 120,
        totalFileSize: 1024000,
        verseCount: 1,
        audioFileCount: 1,
        localPaths: ['/path/to/file.mp3'],
      },
    ],
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
  useAudioAvailabilityStats: () => ({
    stats: {
      totalChapters: 1,
      chaptersWithAudio: 1,
      chaptersWithVerses: 1,
      totalAudioFiles: 1,
      totalDuration: 120,
      totalFileSize: 1024000,
      totalVerses: 1,
    },
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

describe('ChapterQueueExample', () => {
  it('renders summary view by default', () => {
    render(<ChapterQueueExample />);

    expect(screen.getByText('Chapter Audio Queue')).toBeTruthy();
    expect(screen.getByText('Audio Availability Summary')).toBeTruthy();
    expect(screen.getByText('Chapter ch1')).toBeTruthy();
  });

  it('switches to details view when Details button is pressed', () => {
    render(<ChapterQueueExample />);

    const detailsButton = screen.getByText('Details');
    fireEvent.press(detailsButton);

    expect(screen.getByText('Media File Details')).toBeTruthy();
    expect(screen.getByText('ID: mf1')).toBeTruthy();
    expect(screen.getByText('Type: audio')).toBeTruthy();
  });

  it('switches back to summary view when Summary button is pressed', () => {
    render(<ChapterQueueExample />);

    // Switch to details first
    const detailsButton = screen.getByText('Details');
    fireEvent.press(detailsButton);

    // Switch back to summary
    const summaryButton = screen.getByText('Summary');
    fireEvent.press(summaryButton);

    expect(screen.getByText('Chapter Audio Queue')).toBeTruthy();
    expect(screen.getByText('Audio Availability Summary')).toBeTruthy();
  });
});
