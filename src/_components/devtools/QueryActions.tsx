import { Query, useQueryClient } from "@tanstack/react-query";
import ActionButton from "./ActionButton";
import { getQueryStatusLabel } from "../_util/getQueryStatusLabel";
import triggerLoading from "../_util/actions/triggerLoading";
import refetch from "../_util/actions/refetch";
import reset from "../_util/actions/reset";
import remove from "../_util/actions/remove";
import invalidate from "../_util/actions/invalidate";
import triggerError from "../_util/actions/triggerError";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  setSelectedQuery: React.Dispatch<React.SetStateAction<Query | undefined>>;
  query: Query | undefined;
}
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
          disabled={queryStatus === "pending"}
          onClick={() => {
            invalidate({ query, queryClient });
          }}
          bgColorClass="btnInvalidate"
          text="Invalidate"
          _textColorClass="btnInvalidate"
        />
        <ActionButton
          disabled={queryStatus === "pending"}
          onClick={() => {
            reset({ queryClient, query });
          }}
          bgColorClass="btnReset"
          text="Reset"
          _textColorClass="btnReset"
        />
        <ActionButton
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
          disabled={false}
          onClick={() => {
            triggerLoading({ query });
          }}
          bgColorClass="btnTriggerLoading"
          text={
            query.state.data === undefined
              ? "Restore Loading"
              : "Trigger Loading"
          }
          _textColorClass="btnTriggerLoading"
        />
        <ActionButton
          disabled={queryStatus === "pending"}
          onClick={() => {
            triggerError({ query, queryClient });
          }}
          bgColorClass="btnTriggerLoadiError"
          text={queryStatus === "error" ? "Restore" : "Trigger Error"}
          _textColorClass="btnTriggerLoadiError"
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    gap: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "left",
  },
  buttonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
