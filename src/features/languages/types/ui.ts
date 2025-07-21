import type {
  LanguageEntity,
  LanguageHierarchyNode,
  AudioVersion,
  TextVersion,
} from './entities';

// Component Props Types

// Version Selector Buttons
export interface AudioVersionSelectorProps {
  currentVersion: AudioVersion | null;
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'full';
}

export interface TextVersionSelectorProps {
  currentVersion: TextVersion | null;
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'full';
}

// Language Hierarchy Browser
export interface LanguageHierarchyBrowserProps {
  visible: boolean;
  onClose: () => void;
  onLanguageSelect: (language: LanguageEntity) => void;
  onVersionSelect?: (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => void;
  mode: 'browse' | 'select'; // browse for exploration, select for choosing
  title?: string;
}

export interface LanguageNodeProps {
  node: LanguageHierarchyNode;
  isExpanded: boolean;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (language: LanguageEntity) => void;
  depth: number;
}

// Version Selection Modal
export interface VersionSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onVersionSelect: (version: AudioVersion | TextVersion) => void;
  versionType: 'audio' | 'text';
  currentVersion?: AudioVersion | TextVersion | null;
  savedVersions: (AudioVersion | TextVersion)[];
  title: string;
}

export interface VersionListItemProps {
  version: AudioVersion | TextVersion;
  isSelected: boolean;
  onSelect: (version: AudioVersion | TextVersion) => void;
  onRemove?: (versionId: string) => void;
  showRemoveButton?: boolean;
}

// Available Versions List
export interface AvailableVersionsListProps {
  language: LanguageEntity;
  audioVersions: AudioVersion[];
  textVersions: TextVersion[];
  onAddVersion: (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => void;
  isLoading: boolean;
  error?: string | null;
}

export interface VersionCategoryProps {
  title: string;
  versions: (AudioVersion | TextVersion)[];
  versionType: 'audio' | 'text';
  onAddVersion: (version: AudioVersion | TextVersion) => void;
  emptyMessage: string;
}
