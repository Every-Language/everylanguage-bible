/**
 * Mock Bible Repository for Jest Testing
 */

export class BibleRepository {
  async getAllBooks() {
    return [
      {
        id: 'genesis',
        name: 'Genesis',
        localName: 'Genesis',
        testament: 'old' as const,
        chapterCount: 50,
        bookOrder: 1,
        abbreviation: 'Gen',
        alternativeAbbreviations: '["Gn","Ge"]',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  async getBookById(bookId: string) {
    if (bookId === 'genesis') {
      return {
        id: 'genesis',
        name: 'Genesis',
        localName: 'Genesis',
        testament: 'old' as const,
        chapterCount: 50,
        bookOrder: 1,
        abbreviation: 'Gen',
        alternativeAbbreviations: '["Gn","Ge"]',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }

  async getChapterWithAudio(bookId: string, chapterNumber: number) {
    if (bookId === 'genesis' && chapterNumber === 1) {
      return {
        id: 'genesis-1',
        bookId: 'genesis',
        chapterNumber: 1,
        verseCount: 5,
        audioFileUrl: 'https://example.com/genesis-1.mp3',
        audioDuration: 390,
        audioFileSize: 3900000,
        audioQuality: 'high' as const,
        audioLanguageEntityId: 'english-us',
        isAudioDownloaded: false,
        localAudioPath: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        book: {
          id: 'genesis',
          name: 'Genesis',
          testament: 'old' as const,
        },
        verses: [
          {
            id: 'genesis-1-1',
            chapterId: 'genesis-1',
            verseNumber: 1,
            text: 'In the beginning God created the heavens and the earth.',
            textLanguageEntityId: 'english-us',
            audioStartTime: 0,
            audioEndTime: 15,
            audioDuration: 15,
          },
          {
            id: 'genesis-1-2',
            chapterId: 'genesis-1',
            verseNumber: 2,
            text: 'Now the earth was formless and empty...',
            textLanguageEntityId: 'english-us',
            audioStartTime: 15,
            audioEndTime: 35,
            audioDuration: 20,
          },
          {
            id: 'genesis-1-3',
            chapterId: 'genesis-1',
            verseNumber: 3,
            text: 'And God said, "Let there be light," and there was light.',
            textLanguageEntityId: 'english-us',
            audioStartTime: 35,
            audioEndTime: 50,
            audioDuration: 15,
          },
          {
            id: 'genesis-1-4',
            chapterId: 'genesis-1',
            verseNumber: 4,
            text: 'God saw that the light was good...',
            textLanguageEntityId: 'english-us',
            audioStartTime: 50,
            audioEndTime: 70,
            audioDuration: 20,
          },
          {
            id: 'genesis-1-5',
            chapterId: 'genesis-1',
            verseNumber: 5,
            text: 'God called the light "day," and the darkness he called "night."...',
            textLanguageEntityId: 'english-us',
            audioStartTime: 70,
            audioEndTime: 90,
            audioDuration: 20,
          },
        ],
        audioTracks: [
          {
            id: 'genesis-1-audio-english-high',
            chapterId: 'genesis-1',
            languageEntityId: 'english-us',
            url: 'https://example.com/genesis-1.mp3',
            duration: 390,
            fileSize: 3900000,
            quality: 'high' as const,
            format: 'mp3',
            bitrate: 128,
            isDownloaded: false,
          },
        ],
      };
    }
    return null;
  }

  async getVersesByChapter(chapterId: string) {
    if (chapterId === 'genesis-1') {
      return [
        {
          id: 'genesis-1-1',
          chapterId: 'genesis-1',
          verseNumber: 1,
          text: 'In the beginning God created the heavens and the earth.',
          textLanguageEntityId: 'english-us',
          audioStartTime: 0,
          audioEndTime: 15,
          audioDuration: 15,
        },
        {
          id: 'genesis-1-2',
          chapterId: 'genesis-1',
          verseNumber: 2,
          text: 'Now the earth was formless and empty...',
          textLanguageEntityId: 'english-us',
          audioStartTime: 15,
          audioEndTime: 35,
          audioDuration: 20,
        },
      ];
    }
    return [];
  }

  async getPrimaryAudioTrack(chapterId: string) {
    if (chapterId === 'genesis-1') {
      return {
        id: 'genesis-1-audio-english-high',
        chapterId: 'genesis-1',
        languageEntityId: 'english-us',
        url: 'https://example.com/genesis-1.mp3',
        duration: 390,
        fileSize: 3900000,
        quality: 'high' as const,
        format: 'mp3',
        bitrate: 128,
        isDownloaded: false,
      };
    }
    return null;
  }
}
