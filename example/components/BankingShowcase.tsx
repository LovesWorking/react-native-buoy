import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
  channel: "transfer" | "deposit" | "payment" | "payout";
};

type ServerSnapshot = {
  customerName: string;
  membershipTier: "Essential" | "Gold" | "Premier";
  checkingBalance: number;
  savingsBalance: number;
  rewards: number;
  creditUtilization: number;
};

type DashboardPayload = {
  snapshot: ServerSnapshot;
  transactions: Transaction[];
  insights: string[];
};

type SimulatedRequestOptions = {
  delay?: number;
  shouldFail?: boolean;
  errorMessage?: string;
};

const INITIAL_SERVER: ServerSnapshot = {
  customerName: "Jordan Rivers",
  membershipTier: "Gold",
  checkingBalance: 1284.56,
  savingsBalance: 8640.18,
  rewards: 42050,
  creditUtilization: 0.41,
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "txn-1",
    description: "Coffee Collective · Rewards Boost",
    amount: -6.45,
    createdAt: "2024-04-04T14:25:00.000Z",
    channel: "payment",
  },
  {
    id: "txn-2",
    description: "Paycheck · Springfield Studio",
    amount: 2450,
    createdAt: "2024-04-03T09:05:00.000Z",
    channel: "deposit",
  },
  {
    id: "txn-3",
    description: "Transfer to High-Yield Savings",
    amount: -250,
    createdAt: "2024-04-01T18:42:00.000Z",
    channel: "transfer",
  },
];

const NETWORK_DELAYS = [150, 400, 900];

const simulateRequest = async <T,>(
  factory: () => T,
  {
    delay = 450,
    shouldFail = false,
    errorMessage = "Mock request failed",
  }: SimulatedRequestOptions = {}
): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  if (shouldFail) {
    throw new Error(errorMessage);
  }
  return factory();
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const deriveInsights = ({
  checkingBalance,
  rewards,
  creditUtilization,
}: ServerSnapshot) => {
  const insights: string[] = [];

  if (checkingBalance < 0) {
    insights.push("Account overdrawn · enable overdraft protection");
  } else if (checkingBalance > 1_000_000) {
    insights.push("🔥 Elite Reserve unlocked · concierge upgrade available");
  } else if (checkingBalance > 25_000) {
    insights.push("Savings challenge complete · keep it growing!");
  } else {
    insights.push("Everyday essentials covered · keep swiping responsibly");
  }

  if (creditUtilization > 0.75) {
    insights.push("Credit utilization high · consider a payment boost");
  } else if (creditUtilization < 0.2) {
    insights.push("Credit score trending up · utilization in the sweet spot");
  } else {
    insights.push("Credit utilization steady · no alerts");
  }

  insights.push(`Rewards vault: ${(rewards / 100).toFixed(0)}k points`);

  return insights;
};

const getBalanceMood = (balance: number) => {
  if (balance < 0) {
    return {
      label: "Overdrawn",
      tone: "danger",
      caption: "Bring account positive to avoid fees.",
    };
  }
  if (balance === 0) {
    return {
      label: "Zeroed out",
      tone: "warning",
      caption: "Time to top things up.",
    };
  }
  if (balance > 1_000_000) {
    return {
      label: "VIP Reserve",
      tone: "success",
      caption: "Private lounge invites are on the way.",
    };
  }
  if (balance > 10_000) {
    return {
      label: "Cushioned",
      tone: "success",
      caption: "You've got serious runway.",
    };
  }
  return {
    label: "Everyday",
    tone: "neutral",
    caption: "Bills + cold brew covered.",
  };
};

const ControlButton = ({
  label,
  onPress,
  tone = "primary",
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    disabled={disabled || loading}
    style={[
      styles.actionButton,
      tone === "secondary" && styles.actionButtonSecondary,
      tone === "danger" && styles.actionButtonDanger,
      (disabled || loading) && styles.actionButtonDisabled,
    ]}
  >
    {loading ? (
      <ActivityIndicator size="small" color="#fff" />
    ) : (
      <Text style={styles.actionButtonText}>{label}</Text>
    )}
  </TouchableOpacity>
);

export default function BankingShowcase() {
  const queryClient = useQueryClient();
  const [server, setServer] = useState<ServerSnapshot>(INITIAL_SERVER);
  const [transactions, setTransactions] =
    useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [queryDelay, setQueryDelay] = useState(400);
  const [mutationDelay, setMutationDelay] = useState(500);
  const [forceQueryError, setForceQueryError] = useState(false);
  const [forceMutationError, setForceMutationError] = useState(false);

  const pushTransaction = useCallback((entry: Transaction) => {
    setTransactions((prev) => [entry, ...prev].slice(0, 8));
  }, []);

  const fetchDashboard = useCallback(
    () =>
      simulateRequest<DashboardPayload>(
        () => ({
          snapshot: server,
          transactions,
          insights: deriveInsights(server),
        }),
        {
          delay: queryDelay,
          shouldFail: forceQueryError,
          errorMessage: "Unable to load your accounts right now.",
        }
      ),
    [forceQueryError, queryDelay, server, transactions]
  );

  const dashboardQuery = useQuery<DashboardPayload, Error>({
    queryKey: ["banking-dashboard"],
    queryFn: fetchDashboard,
    retry: false,
    staleTime: 1500,
    gcTime: 1000 * 60 * 5,
    // @ts-ignore
    keepPreviousData: true,
  });

  const depositMutation = useMutation<number, Error, number>({
    mutationFn: (amount) =>
      simulateRequest(
        () => {
          if (forceMutationError) {
            throw new Error("Deposits temporarily paused. Try again soon.");
          }
          return amount;
        },
        { delay: mutationDelay }
      ),
    onSuccess: (amount) => {
      setServer((prev) => ({
        ...prev,
        checkingBalance: prev.checkingBalance + amount,
        rewards: prev.rewards + Math.round(amount * 0.12),
      }));
      pushTransaction({
        id: `txn-${Date.now()}`,
        description: "Instant mobile deposit",
        amount,
        createdAt: new Date().toISOString(),
        channel: "deposit",
      });
      queryClient.invalidateQueries({ queryKey: ["banking-dashboard"] });
    },
  });

  const transferMutation = useMutation<number, Error, number>({
    mutationFn: (amount) =>
      simulateRequest(
        () => {
          if (forceMutationError) {
            throw new Error("Transfers offline while we upgrade the rails.");
          }
          return amount;
        },
        { delay: mutationDelay }
      ),
    onSuccess: (amount) => {
      setServer((prev) => ({
        ...prev,
        checkingBalance: prev.checkingBalance - amount,
        savingsBalance: prev.savingsBalance + amount,
      }));
      pushTransaction({
        id: `txn-${Date.now()}`,
        description: "Transfer to Growth Savings",
        amount: -amount,
        createdAt: new Date().toISOString(),
        channel: "transfer",
      });
      queryClient.invalidateQueries({ queryKey: ["banking-dashboard"] });
    },
  });

  const failedTransferMutation = useMutation<void, Error, number>({
    mutationFn: (amount) =>
      simulateRequest(
        () => {
          throw new Error(
            `Destination account 9907 not found. Refunded ${formatCurrency(
              amount
            )}.`
          );
        },
        {
          delay: mutationDelay,
          shouldFail: true,
        }
      ),
  });

  const resetState = useCallback(() => {
    setServer(INITIAL_SERVER);
    setTransactions(INITIAL_TRANSACTIONS);
    queryClient.resetQueries({ queryKey: ["banking-dashboard"] });
  }, [queryClient]);

  const cachedQueries = queryClient.getQueryCache().getAll();

  const data = dashboardQuery.data;
  // @ts-ignore
  const snapshot = data?.snapshot ?? server;
  const balanceMood = getBalanceMood(snapshot.checkingBalance);
  // @ts-ignore
  const resolvedTransactions = data?.transactions ?? transactions;
  // @ts-ignore
  const insights = data?.insights ?? deriveInsights(snapshot);

  return (
    <View style={styles.bankScreen}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroGreeting}>Good morning,</Text>
            <Text style={styles.heroName}>{snapshot.customerName}</Text>
          </View>
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>{snapshot.membershipTier}</Text>
          </View>
        </View>
        <Text style={styles.heroSubtext}>
          Track balances, trigger loading + error states, and watch the dev
          tools react.
        </Text>
        {dashboardQuery.isFetching ? (
          <View style={styles.heroSpinnerRow}>
            <ActivityIndicator size="small" color="#c8d9ff" />
            <Text style={styles.heroSpinnerText}>Refreshing account data…</Text>
          </View>
        ) : null}
        {dashboardQuery.isError ? (
          <Text style={styles.heroErrorText}>
            {dashboardQuery.error
              ? dashboardQuery.error.message
              : "Something went wrong loading your dashboard."}
          </Text>
        ) : null}
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Capital One Checking</Text>
          <View
            style={[
              styles.balanceBadge,
              balanceMood.tone === "danger" && styles.balanceBadgeDanger,
              balanceMood.tone === "warning" && styles.balanceBadgeWarning,
              balanceMood.tone === "success" && styles.balanceBadgeSuccess,
            ]}
          >
            <Text style={styles.balanceBadgeText}>{balanceMood.label}</Text>
          </View>
        </View>
        <Text style={styles.balanceValue}>
          {formatCurrency(snapshot.checkingBalance)}
        </Text>
        <Text style={styles.balanceCaption}>{balanceMood.caption}</Text>
        <View style={styles.accountsRow}>
          <View style={styles.accountTile}>
            <Text style={styles.accountAmount}>
              {formatCurrency(snapshot.savingsBalance)}
            </Text>
            <Text style={styles.accountLabel}>Growth Savings · 2.5% APY</Text>
          </View>
          <View style={[styles.accountTile, styles.accountTileLast]}>
            <Text style={styles.accountAmount}>
              {Math.round(snapshot.creditUtilization * 100)}%
            </Text>
            <Text style={styles.accountLabel}>Credit Utilization</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.sectionHeading}>Quick actions</Text>
        <View style={styles.actionsRow}>
          <ControlButton
            label="Deposit $1,000"
            onPress={() => depositMutation.mutate(1000)}
            loading={depositMutation.isPending}
          />
          <ControlButton
            label="Transfer $250"
            onPress={() => transferMutation.mutate(250)}
            tone="secondary"
            loading={transferMutation.isPending}
          />
          <ControlButton
            label="Transfer to 9907"
            onPress={() => failedTransferMutation.mutate(500)}
            tone="danger"
            loading={failedTransferMutation.isPending}
          />
        </View>
        {depositMutation.isError ? (
          <Text style={styles.mutationError}>
            {depositMutation.error?.message}
          </Text>
        ) : null}
        {transferMutation.isError ? (
          <Text style={styles.mutationError}>
            {transferMutation.error?.message}
          </Text>
        ) : null}
        {failedTransferMutation.isError ? (
          <Text style={styles.mutationError}>
            {failedTransferMutation.error?.message}
          </Text>
        ) : null}
      </View>

      <View style={styles.insightsCard}>
        <Text style={styles.sectionHeading}>Insights</Text>
        <View style={styles.insightChipRow}>
          {insights.map((insight: string) => (
            <View key={insight} style={styles.insightChip}>
              <Text style={styles.insightChipText}>{insight}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.transactionsCard}>
        <Text style={styles.sectionHeading}>Recent activity</Text>
        {dashboardQuery.isLoading && !data ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#4c51bf" />
            <Text style={styles.loadingText}>Loading transactions…</Text>
          </View>
        ) : null}
        {resolvedTransactions.map((txn: Transaction) => (
          <View key={txn.id} style={styles.transactionRow}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDescription}>
                {txn.description}
              </Text>
              <Text style={styles.transactionTimestamp}>
                {formatTimestamp(txn.createdAt)}
              </Text>
            </View>
            <Text
              style={[
                styles.transactionAmount,
                txn.amount < 0 && styles.transactionAmountNegative,
              ]}
            >
              {txn.amount < 0
                ? `-${formatCurrency(Math.abs(txn.amount))}`
                : `+${formatCurrency(txn.amount)}`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bankScreen: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: "#0f172a",
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heroGreeting: {
    color: "#cbd5f5",
    fontSize: 14,
  },
  heroName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
  heroSubtext: {
    color: "#e2e8f0",
    fontSize: 13,
    lineHeight: 18,
  },
  heroSpinnerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  heroSpinnerText: {
    color: "#cbd5f5",
    marginLeft: 8,
    fontSize: 12,
  },
  heroErrorText: {
    color: "#fca5a5",
    marginTop: 12,
    fontSize: 13,
  },
  membershipBadge: {
    backgroundColor: "rgba(59,130,246,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  membershipText: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "600",
  },
  balanceCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#475569",
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: "700",
    color: "#0f172a",
  },
  balanceCaption: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  balanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#cbd5f5",
  },
  balanceBadgeDanger: {
    backgroundColor: "#fee2e2",
  },
  balanceBadgeWarning: {
    backgroundColor: "#fef3c7",
  },
  balanceBadgeSuccess: {
    backgroundColor: "#dcfce7",
  },
  balanceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
  },
  accountsRow: {
    flexDirection: "row",
    marginTop: 20,
  },
  accountTile: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 12,
  },
  accountTileLast: {
    marginRight: 0,
  },
  accountAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  accountLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 6,
  },
  actionsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 12,
  },
  actionButtonSecondary: {
    backgroundColor: "#334155",
  },
  actionButtonDanger: {
    backgroundColor: "#dc2626",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  mutationError: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
  insightsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 18,
  },
  insightChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  insightChip: {
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  insightChipText: {
    color: "#3730a3",
    fontSize: 12,
    fontWeight: "600",
  },
  transactionsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 18,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
  },
  transactionTimestamp: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  transactionAmountNegative: {
    color: "#dc2626",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: "#475569",
    fontSize: 13,
  },
  controlsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  controlRow: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  delayChip: {
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    marginBottom: 8,
  },
  delayChipActive: {
    backgroundColor: "#1d4ed8",
  },
  delayChipText: {
    color: "#1f2937",
    fontSize: 12,
    fontWeight: "600",
  },
  delayChipTextActive: {
    color: "#fff",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  snapshotText: {
    fontSize: 12,
    color: "#475569",
  },
  controlButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
});
