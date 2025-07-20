import React, { useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  Animated,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { Button } from '@/shared/components/ui/Button';
import DatabaseManager from '@/shared/services/database/DatabaseManager';
import { bibleSync } from '@/shared/services/sync';
import { SyncResult } from '@/shared/services/sync/types';

const { width: screenWidth } = Dimensions.get('window');

interface TableInfo {
  name: string;
  recordCount: number;
  description: string;
  icon: string;
  sampleData?: any[];
  syncStatus?: 'idle' | 'syncing' | 'error' | 'success';
  lastSync?: string;
}

interface DatabaseTablesStepProps {
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
  isLastStep: boolean;
}

// Sub-component for the icon section
const IconSection: React.FC<{ theme: any }> = ({ theme }) => (
  <View
    style={{
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    }}>
    <Text style={{ fontSize: 48 }}>🗄️</Text>
  </View>
);

// Sub-component for the content section
const ContentSection: React.FC<{ theme: any }> = ({ theme }) => (
  <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
    <Text
      style={{
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
        lineHeight: theme.typography.lineHeight.xxl,
      }}>
      Your Local Database
    </Text>
    <Text
      style={{
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.accent,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
        fontWeight: '600',
        lineHeight: theme.typography.lineHeight.lg,
      }}>
      Bible content stored on your device
    </Text>
    <Text
      style={{
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: theme.typography.lineHeight.md,
        paddingHorizontal: theme.spacing.md,
      }}>
      Your Bible app stores content locally so you can read and study even
      without an internet connection.
    </Text>
  </View>
);

// Sub-component for the sync section
const SyncSection: React.FC<{
  theme: any;
  isSyncing: boolean;
  syncError: string | null;
  _syncProgress: SyncResult[];
  getSyncStatusText: () => string;
  getSyncStatusColor: () => string;
  handleSync: () => void;
}> = ({
  theme,
  isSyncing,
  syncError,
  _syncProgress,
  getSyncStatusText,
  getSyncStatusColor,
  handleSync,
}) => (
  <View style={{ width: '100%', marginBottom: theme.spacing.lg }}>
    <Text
      style={{
        fontSize: theme.typography.fontSize.lg,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
      }}>
      Sync with Online Database
    </Text>
    <Text
      style={{
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
      }}>
      Download the latest Bible content and updates from our servers.
    </Text>

    {/* Sync Status */}
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: getSyncStatusColor(),
          textAlign: 'center',
          marginBottom: theme.spacing.xs,
        }}>
        {getSyncStatusText()}
      </Text>
      {syncError && (
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.error,
            textAlign: 'center',
          }}>
          {syncError}
        </Text>
      )}
    </View>

    {/* Sync Button */}
    <Button
      title={isSyncing ? 'Syncing...' : 'Sync Now'}
      onPress={handleSync}
      variant='secondary'
      fullWidth
      disabled={isSyncing}
      loading={isSyncing}
    />
  </View>
);

// Sub-component for individual table item
const TableItem: React.FC<{
  table: TableInfo;
  theme: any;
  expandedTable: string | null;
  toggleTableExpansion: (tableName: string) => void;
}> = ({ table, theme, expandedTable, toggleTableExpansion }) => {
  const isExpanded = expandedTable === table.name;

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: theme.spacing.md,
        }}
        onPress={() => toggleTableExpansion(table.name)}
        activeOpacity={0.7}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
          }}>
          <Text style={{ fontSize: 24, marginRight: theme.spacing.sm }}>
            {table.icon}
          </Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.md,
                fontWeight: '600',
                color: theme.colors.text,
                marginBottom: 2,
              }}>
              {table.name}
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                lineHeight: theme.typography.lineHeight.sm,
              }}>
              {table.description}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.accent,
              fontWeight: '500',
              marginBottom: 2,
            }}>
            {table.recordCount} records
          </Text>
          {table.syncStatus && (
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color:
                  table.syncStatus === 'syncing'
                    ? theme.colors.primary
                    : table.syncStatus === 'error'
                      ? theme.colors.error
                      : theme.colors.success,
              }}>
              {table.syncStatus === 'syncing'
                ? '🔄'
                : table.syncStatus === 'error'
                  ? '❌'
                  : '✅'}
            </Text>
          )}
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </View>
      </TouchableOpacity>

      {isExpanded && table.sampleData && table.sampleData.length > 0 && (
        <View
          style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background,
          }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: theme.spacing.sm,
            }}>
            Sample Data:
          </Text>
          {table.sampleData.map((item, index) => (
            <View
              key={index}
              style={{
                marginBottom: theme.spacing.xs,
                padding: theme.spacing.xs,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.sm,
              }}>
              {Object.entries(item).map(([key, value]) => (
                <Text
                  key={key}
                  style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.textSecondary,
                  }}>
                  {key}: {String(value)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Sub-component for the tables list
const TablesList: React.FC<{
  tables: TableInfo[];
  isLoading: boolean;
  loadError: string | null;
  theme: any;
  expandedTable: string | null;
  toggleTableExpansion: (tableName: string) => void;
  handleRetryLoad: () => void;
}> = ({
  tables,
  isLoading,
  loadError,
  theme,
  expandedTable,
  toggleTableExpansion,
  handleRetryLoad,
}) => (
  <View style={{ width: '100%', flex: 1, marginBottom: theme.spacing.lg }}>
    <Text
      style={{
        fontSize: theme.typography.fontSize.lg,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
      }}>
      Database Tables
    </Text>
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {isLoading ? (
        <View
          style={{
            padding: theme.spacing.xl,
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.md,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}>
            Loading table information...
          </Text>
        </View>
      ) : loadError ? (
        <View
          style={{
            padding: theme.spacing.lg,
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: '600',
              color: theme.colors.error,
              marginBottom: theme.spacing.sm,
              textAlign: 'center',
            }}>
            Failed to load database
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.md,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.md,
              textAlign: 'center',
            }}>
            {loadError}
          </Text>
          <Button
            title='Retry'
            onPress={handleRetryLoad}
            variant='secondary'
            fullWidth
          />
        </View>
      ) : (
        tables.map(table => (
          <TableItem
            key={table.name}
            table={table}
            theme={theme}
            expandedTable={expandedTable}
            toggleTableExpansion={toggleTableExpansion}
          />
        ))
      )}
    </ScrollView>
  </View>
);

// Sub-component for the actions section
const ActionsSection: React.FC<{
  isLastStep: boolean;
  onNext: () => void;
  onSkip: () => void;
  theme: any;
}> = ({ isLastStep, onNext, onSkip, theme }) => (
  <View style={{ width: '100%', alignItems: 'center' }}>
    <Button
      title={isLastStep ? 'Get Started' : 'Next'}
      onPress={onNext}
      variant='primary'
      fullWidth
    />

    {!isLastStep && (
      <TouchableOpacity
        style={{
          marginTop: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        }}
        onPress={onSkip}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.textSecondary,
            fontWeight: '500',
          }}>
          Skip
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

export const DatabaseTablesStep: React.FC<DatabaseTablesStepProps> = ({
  isActive,
  onNext,
  onSkip,
  isLastStep,
}) => {
  const { theme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncResult[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      loadTableInfo();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [isActive, fadeAnim, slideAnim]);

  const loadTableInfo = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setLoadError(null);

    // Define table definitions outside try block so they're available in catch
    const tableDefinitions: TableInfo[] = [
      {
        name: 'books',
        recordCount: 0,
        description: 'Bible books with chapters and testament information',
        icon: '📚',
      },
      {
        name: 'chapters',
        recordCount: 0,
        description: 'Bible chapters with verse counts',
        icon: '📖',
      },
      {
        name: 'verses',
        recordCount: 0,
        description: 'Individual Bible verses',
        icon: '✝️',
      },
      {
        name: 'sync_metadata',
        recordCount: 0,
        description: 'Synchronization status and metadata',
        icon: '🔄',
      },
      {
        name: 'user_saved_versions',
        recordCount: 0,
        description: 'Your saved language and version preferences',
        icon: '⭐',
      },
      {
        name: 'language_entities_cache',
        recordCount: 0,
        description: 'Cached language information for offline access',
        icon: '🌍',
      },
      {
        name: 'available_versions_cache',
        recordCount: 0,
        description: 'Available audio and text versions',
        icon: '🎧',
      },
    ];

    try {
      const databaseManager = DatabaseManager.getInstance();

      // Ensure database is initialized
      if (!databaseManager.initialized) {
        console.log('Database not initialized, initializing...');
        await databaseManager.initialize();
      }

      // Double-check that database is ready
      if (!databaseManager.initialized || !databaseManager.isReady()) {
        throw new Error(
          'Database is not ready. Please complete the initialization first.'
        );
      }

      const db = databaseManager.getDatabase();

      // First, check which tables actually exist
      const existingTables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      const existingTableNames = existingTables.map(t => t.name);
      console.log('Existing tables:', existingTableNames);

      // Get record counts and sync metadata for each table
      for (const table of tableDefinitions) {
        try {
          // Check if table exists before querying it
          if (!existingTableNames.includes(table.name)) {
            console.log(`Table ${table.name} does not exist yet`);
            table.recordCount = 0;
            table.syncStatus = 'idle';
            continue;
          }

          const result = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM ${table.name}`
          );
          table.recordCount = result?.count || 0;

          // Get sync metadata for bible tables
          if (['books', 'chapters', 'verses'].includes(table.name)) {
            try {
              const syncMeta = await db.getFirstAsync<{
                last_sync: string;
                sync_status: string;
              }>(
                `SELECT last_sync, sync_status FROM sync_metadata WHERE table_name = ?`,
                [table.name]
              );

              if (syncMeta) {
                table.lastSync = syncMeta.last_sync;
                table.syncStatus = syncMeta.sync_status as any;
              } else {
                // Initialize sync metadata if it doesn't exist
                table.syncStatus = 'idle';
              }
            } catch (error) {
              console.error(
                `Error loading sync metadata for ${table.name}:`,
                error
              );
              table.syncStatus = 'idle';
            }
          }

          // Get sample data for some tables
          if (table.name === 'books' && table.recordCount > 0) {
            const books = await db.getAllAsync<{
              name: string;
              testament: string;
            }>(`SELECT name, testament FROM ${table.name} LIMIT 3`);
            table.sampleData = books;
          } else if (table.name === 'chapters' && table.recordCount > 0) {
            const chapters = await db.getAllAsync<{
              book_name: string;
              chapter_number: number;
              verse_count: number;
            }>(
              `SELECT book_name, chapter_number, verse_count FROM ${table.name} LIMIT 3`
            );
            table.sampleData = chapters;
          }
        } catch (error) {
          console.error(`Error loading table ${table.name}:`, error);
          table.recordCount = 0;
          table.syncStatus = 'error';
        }
      }

      setTables(tableDefinitions);
    } catch (error) {
      console.error('Error loading table information:', error);
      setLoadError(
        error instanceof Error ? error.message : 'Failed to load database'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTableExpansion = (tableName: string) => {
    setExpandedTable(expandedTable === tableName ? null : tableName);
  };

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);
    setSyncProgress([]);

    try {
      // Subscribe to sync progress
      const unsubscribe = bibleSync.onSync(result => {
        setSyncProgress(prev => [...prev, result]);
      });

      // Start the sync
      await bibleSync.syncAll({ forceFullSync: true });

      // Update table info after sync
      await loadTableInfo();

      unsubscribe();
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryLoad = async () => {
    setLoadError(null);
    await loadTableInfo();
  };

  const getSyncStatusText = () => {
    if (isSyncing) {
      const syncedTables = syncProgress.length;
      return `Syncing... (${syncedTables} tables completed)`;
    }
    if (syncError) {
      return 'Sync failed';
    }
    if (syncProgress.length > 0) {
      return 'Sync completed';
    }
    return 'Ready to sync';
  };

  const getSyncStatusColor = () => {
    if (isSyncing) return theme.colors.primary;
    if (syncError) return theme.colors.error;
    if (syncProgress.length > 0) return theme.colors.success;
    return theme.colors.textSecondary;
  };

  return (
    <Animated.View
      style={{
        flex: 1,
        width: screenWidth,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
      <IconSection theme={theme} />

      <ContentSection theme={theme} />

      <SyncSection
        theme={theme}
        isSyncing={isSyncing}
        syncError={syncError}
        _syncProgress={syncProgress}
        getSyncStatusText={getSyncStatusText}
        getSyncStatusColor={getSyncStatusColor}
        handleSync={handleSync}
      />

      <TablesList
        tables={tables}
        isLoading={isLoading}
        loadError={loadError}
        theme={theme}
        expandedTable={expandedTable}
        toggleTableExpansion={toggleTableExpansion}
        handleRetryLoad={handleRetryLoad}
      />

      <ActionsSection
        isLastStep={isLastStep}
        onNext={onNext}
        onSkip={onSkip}
        theme={theme}
      />
    </Animated.View>
  );
};
