import {
  Filter,
  DynamicFilterView,
  type DynamicFilterConfig,
} from "@react-buoy/shared-ui";

interface RouteFilterViewV2Props {
  ignoredPatterns: Set<string>;
  onTogglePattern: (pattern: string) => void;
  onAddPattern: (pattern: string) => void;
  availablePathnames?: string[];
}

export function RouteFilterViewV2({
  ignoredPatterns,
  onTogglePattern,
  onAddPattern,
  availablePathnames = [],
}: RouteFilterViewV2Props) {
  const filterConfig: DynamicFilterConfig = {
    addFilterSection: {
      enabled: true,
      placeholder: "Enter pattern (e.g., /_sitemap)",
      title: "ACTIVE FILTERS",
      icon: Filter,
    },
    availableItemsSection: {
      enabled: true,
      title: "AVAILABLE ROUTES FROM EVENTS",
      emptyMessage:
        "No routes available. Routes from navigation events will appear here.",
      items: availablePathnames,
    },
    howItWorksSection: {
      enabled: true,
      title: "HOW FILTERS WORK",
      description:
        "Filtered routes will not appear in the route events list. Patterns match if the route contains the specified text.",
      examples: [
        "• /_sitemap → filters /_sitemap routes",
        "• /api → filters /api/users, /api/posts",
        "• [id] → filters all routes with [id] param",
      ],
      icon: Filter,
    },
    onPatternToggle: onTogglePattern,
    onPatternAdd: onAddPattern,
    activePatterns: ignoredPatterns,
  };

  return <DynamicFilterView {...filterConfig} />;
}
