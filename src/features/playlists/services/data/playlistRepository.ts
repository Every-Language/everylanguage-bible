export interface PlaylistItem {
  id: string;
  title: string;
  description: string;
  iconPath: string; // Path to bible book icon
}

export type PlaylistMode = 'my-playlists' | 'study-bible' | 'meeting-pattern';

export interface PlaylistRepository {
  getPlaylistData(): Record<PlaylistMode, PlaylistItem[]>;
  getPlaylistsByMode(mode: PlaylistMode): PlaylistItem[];
}

// Mock implementation - will be replaced with database calls
export class MockPlaylistRepository implements PlaylistRepository {
  private mockData: Record<PlaylistMode, PlaylistItem[]> = {
    'my-playlists': [
      {
        id: 'playlist-1',
        title: 'Morning Devotions',
        description: 'Start your day with inspiring verses',
        iconPath: '19_psalms.png',
      },
      {
        id: 'playlist-2',
        title: 'Evening Reflections',
        description: 'End your day with peaceful meditation',
        iconPath: '20_proverbs.png',
      },
      {
        id: 'playlist-3',
        title: 'Sunday Worship',
        description: 'Songs and verses for worship time',
        iconPath: '43_john.png',
      },
    ],
    'study-bible': [
      {
        id: 'study-1',
        title: 'Gospel of John Study',
        description: 'Deep dive into the life of Jesus',
        iconPath: '43_john.png',
      },
      {
        id: 'study-2',
        title: 'Psalms of David',
        description: 'Exploring worship and praise',
        iconPath: '19_psalms.png',
      },
      {
        id: 'study-3',
        title: "Paul's Letters",
        description: 'Understanding apostolic teachings',
        iconPath: '45_romans.png',
      },
      {
        id: 'study-4',
        title: 'Old Testament Stories',
        description: 'Faith stories from the beginning',
        iconPath: '01_genesis.png',
      },
    ],
    'meeting-pattern': [
      {
        id: 'meeting-1',
        title: 'Weekly Bible Study',
        description: 'Structured study for group meetings',
        iconPath: '44_acts.png',
      },
      {
        id: 'meeting-2',
        title: 'Prayer Circle',
        description: 'Guided prayers and meditation',
        iconPath: '40_matthew.png',
      },
      {
        id: 'meeting-3',
        title: 'Youth Group Sessions',
        description: 'Engaging content for young believers',
        iconPath: '46_1-corinthians.png',
      },
    ],
  };

  getPlaylistData(): Record<PlaylistMode, PlaylistItem[]> {
    return this.mockData;
  }

  getPlaylistsByMode(mode: PlaylistMode): PlaylistItem[] {
    return this.mockData[mode] || [];
  }
}

// Export singleton instance
export const playlistRepository = new MockPlaylistRepository();
