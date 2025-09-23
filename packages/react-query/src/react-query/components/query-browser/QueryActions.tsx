import { Dispatch, SetStateAction } from "react";
import { Query, useQueryClient } from "@tanstack/react-query";
import ActionButton from "./ActionButton";
import { getQueryStatusLabel } from "../../utils/getQueryStatusLabel";
import triggerLoading from "../../utils/actions/triggerLoading";
import refetch from "../../utils/actions/refetch";
import reset from "../../utils/actions/reset";
import remove from "../../utils/actions/remove";
import invalidate from "../../utils/actions/invalidate";
import triggerError from "../../utils/actions/triggerError";
import { View, Text, StyleSheet } from "react-native";
import { gameUIColors } from "@react-buoy/shared-ui";

interface Props {
  setSelectedQuery: Dispatch<SetStateAction<Query | undefined>>;
  query: Query | undefined;
}
/**
 * Action panel rendered in query detail views providing mutation simulation and removal controls.
 */
export default function QueryActions({ query, setSelectedQuery }: Props) {
  const queryClient = useQueryClient();
  if (query === undefined) {
    return null;
  }
  const queryStatus = query.state.status;
  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Actions</Text>
      <View style={styles.buttonsContainer}>
        <ActionButton
          sentry-label="ignore devtools query refetch action"
          disabled={getQueryStatusLabel(query) === "fetching"}
          onClick={() => {
            refetch({
              query,
            });
          }}
          bgColorClass="btnRefetch"
          text="Refetch"
          _textColorClass="btnRefetch"
        />
        <ActionButton
          sentry-label="ignore devtools query invalidate action"
          disabled={queryStatus === "pending"}
          onClick={() => {
            invalidate({ query, queryClient });
          }}
          bgColorClass="btnInvalidate"
          text="Invalidate"
          _textColorClass="btnInvalidate"
        />
        <ActionButton
          sentry-label="ignore devtools query reset action"
          disabled={queryStatus === "pending"}
          onClick={() => {
            reset({ queryClient, query });
          }}
          bgColorClass="btnReset"
          text="Reset"
          _textColorClass="btnReset"
        />
        <ActionButton
          sentry-label="ignore devtools query remove action"
          disabled={getQueryStatusLabel(query) === "fetching"}
          onClick={() => {
            remove({ queryClient, query });
            setSelectedQuery(undefined);
          }}
          bgColorClass="btnRemove"
          text="Remove"
          _textColorClass="btnRemove"
        />
        <ActionButton
          sentry-label="ignore devtools query trigger loading action"
          disabled={false}
          onClick={() => {
            triggerLoading({ query });
          }}
          bgColorClass="btnTriggerLoading"
          text={
            query.state.fetchStatus === "fetching"
              ? "Restore Loading"
              : "Trigger Loading"
          }
          _textColorClass="btnTriggerLoading"
        />
        <ActionButton
          sentry-label="ignore devtools query trigger error action"
          disabled={queryStatus === "pending"}
          onClick={() => {
            triggerError({ query, queryClient });
          }}
          bgColorClass="btnTriggerLoadiError"
          text={queryStatus === "error" ? "Restore Error" : "Trigger Error"}
          _textColorClass="btnTriggerLoadiError"
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: gameUIColors.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gameUIColors.border + "40",
    padding: 16,
    gap: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "700",
    color: gameUIColors.primary,
    marginBottom: 8,
    textAlign: "left",
    fontFamily: "monospace",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  buttonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
