import {
  faBug,
  faCube,
  faDatabase,
  faGears,
  faGlobe,
  faHandPointer,
  faKey,
  faPalette,
  faPlay,
  faRoute,
  faTriangleExclamation,
  faUser,
} from '@fortawesome/pro-regular-svg-icons';

import { ConsoleTransportEntry, LogLevel, LogType } from '~/lib/utils/logger/types';

// Helper functions - moved outside component to be stable
export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

export const getLevelColor = (level: string) => {
  switch (level) {
    case 'debug':
      return 'text-blue-400';
    case 'info':
      return 'text-cyan-400';
    case 'log':
      return 'text-gray-400';
    case 'warn':
      return 'text-yellow-400';
    case 'error':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

// Add new helper functions for type styling
export const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Auth':
      return faKey;
    case 'Custom':
      return faPalette;
    case 'Debug':
      return faBug;
    case 'Error':
      return faTriangleExclamation;
    case 'Generic':
      return faCube;
    case 'HTTP Request':
      return faGlobe;
    case 'Navigation':
      return faRoute;
    case 'Replay':
      return faPlay;
    case 'State':
      return faDatabase;
    case 'System':
      return faGears;
    case 'Touch':
      return faHandPointer;
    case 'User Action':
      return faUser;
    default:
      return faCube;
  }
};

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'Auth':
      return '#F59E0B'; // yellow-500
    case 'Custom':
      return '#06B6D4'; // cyan-500
    case 'Debug':
      return '#60A5FA'; // blue-400
    case 'Error':
      return '#F87171'; // red-400
    case 'Generic':
      return '#94A3B8'; // slate-400
    case 'HTTP Request':
      return '#2DD4BF'; // teal-400
    case 'Navigation':
      return '#34D399'; // emerald-400
    case 'Replay':
      return '#EC4899'; // pink-500
    case 'State':
      return '#8B5CF6'; // purple-500
    case 'System':
      return '#A78BFA'; // violet-400
    case 'Touch':
      return '#FBBF24'; // amber-400
    case 'User Action':
      return '#FB923C'; // orange-400
    default:
      return '#94A3B8'; // slate-400
  }
};

// Add these helper functions before the LogDumpSection component
export const formatCount = (count: number) => {
  if (count === 0) return '';
  if (count > 99) return ' (99+)';
  return ` (${count})`;
};

export const getTypeCount = (entries: ConsoleTransportEntry[], type: LogType) => {
  return formatCount(entries.filter((entry) => entry.type === type).length);
};

export const getLevelCount = (entries: ConsoleTransportEntry[], level: LogLevel) => {
  return formatCount(entries.filter((entry) => entry.level === level).length);
};

export const formatRelativeTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
};
