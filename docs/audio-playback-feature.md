# Audio Playback Feature in Background Downloads

## Overview

The background downloads screen now includes audio playback functionality for completed audio file downloads. Users can play, pause, and resume audio files directly from the download cards.

## Features

### Audio File Detection

- Automatically detects audio files based on file extensions: `.mp3`, `.m4a`, `.wav`, `.aac`, `.ogg`, `.flac`
- Audio files are marked with a small audio icon (🎵) next to the filename

### Play Controls

- **Play Icon**: Appears on completed audio downloads
- **Play/Pause Toggle**: Click to play or pause the audio
- **Visual Feedback**:
  - Playing audio files have a green border and green play icon
  - Paused audio files show a regular play icon
  - Non-audio files don't show play controls

### Integration with Media Player

- Audio playback integrates with the app's media player system
- Media player expands automatically when audio starts playing
- Supports background playback
- Maintains playback state across app navigation

## Implementation Details

### Components Modified

- `BackgroundDownloadsScreen.tsx`: Added play controls and audio detection
- `fileUtils.ts`: Added `isAudioFile()` utility function

### Key Functions

- `isAudioFile(fileName)`: Detects if a file is an audio file
- `handlePlayAudio(download)`: Handles play/pause logic for audio files
- Visual indicators for currently playing audio

### Audio Service Integration

- Uses the existing `AudioService` for audio playback
- Integrates with `MediaPlayerContext` for state management
- Supports local file playback from download storage

## Usage

1. Navigate to the Background Downloads screen
2. Look for completed downloads with audio file extensions
3. Click the play icon to start playback
4. Click the pause icon to pause playback
5. The media player will expand to show playback controls

## Technical Notes

- Audio files must be fully downloaded (status: 'completed') to enable playback
- The feature uses the existing audio service infrastructure
- Playback state is synchronized with the global media player context
- Error handling includes user-friendly alerts for missing files or playback failures
