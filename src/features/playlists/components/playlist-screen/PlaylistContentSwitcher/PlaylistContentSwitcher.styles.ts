import { StyleSheet } from 'react-native';

export const createPlaylistContentSwitcherStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      overflow: 'hidden',
      position: 'relative',
    },
    animatedContainer: {
      flexDirection: 'row',
      width: '300%', // 300% for 3 views
      height: '100%',
    },
    viewContainer: {
      width: '33.333%',
      height: '100%',
    },
  });
