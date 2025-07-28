import { View } from 'react-native';
import { faDatabase } from '@fortawesome/pro-regular-svg-icons';

import ConversationStatusDebugView from '~/features/account/components/ConversationStatusDebugView';
import DatabaseStatsView from '~/features/account/components/DatabaseStatsView';
import DataSyncComparisonView from '~/features/account/components/DataSyncComparisonView';
import UserMessageStatsView from '~/features/account/components/UserMessageStatsView';

import { ExpandableSection } from './ExpandableSection';

export function DatabaseManagementSection() {
  return (
    <ExpandableSection
      icon={faDatabase}
      iconColor="#0ea5e9"
      iconBackgroundColor="bg-sky-500/10"
      title="Database Tools"
      subtitle="View system statistics and analytics"
    >
      <View className="space-y-8">
        <DataSyncComparisonView />
        <ConversationStatusDebugView />
        <DatabaseStatsView />
        <UserMessageStatsView />
      </View>
    </ExpandableSection>
  );
}
