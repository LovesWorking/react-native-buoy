/**
 * Game UI Design System Components
 * Reusable components following cyberpunk/sci-fi aesthetic
 */

// Components
export { GameUICollapsibleSection } from "./components/GameUICollapsibleSection";
export type { GameUICollapsibleSectionProps } from "./components/GameUICollapsibleSection";

export { GameUIStatusHeader } from "./components/GameUIStatusHeader";
export type { GameUIStatusHeaderProps } from "./components/GameUIStatusHeader";

export { GameUICompactStats } from "./components/GameUICompactStats";
export type {
  GameUICompactStatsProps,
  StatCardConfig,
} from "./components/GameUICompactStats";

export { GameUIIssuesList } from "./components/GameUIIssuesList";
export type {
  GameUIIssuesListProps,
  IssueItem,
} from "./components/GameUIIssuesList";

// GameUIDevTestMode removed - test component no longer needed

// Hooks
export {
  useGameUIAlertState,
  GAME_UI_ALERT_STATES,
} from "./hooks/useGameUIAlertState";
export type {
  AlertStateType,
  AlertStateConfig,
  GameUIStats,
} from "./hooks/useGameUIAlertState";

// Constants
export {
  gameUIColors,
  dialColors,
} from "./constants/gameUIColors";
export type { GameUIColorKey } from "./constants/gameUIColors";
