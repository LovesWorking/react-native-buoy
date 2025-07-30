import { Query, QueryKey, useQueryClient } from "@tanstack/react-query";
import React from "react";
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
  setSelectedQuery: React.Dispatch<
    React.SetStateAction<Query<any, any, any, any> | undefined>
  >;
  query: Query<any, any, any, any> | undefined;
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
      <ActionButton
        disabled={getQueryStatusLabel(query) === "fetching"}
        onClick={() => {
          refetch({
            query,
          });
        }}
        bgColorClass="btnRefetch"
        text="Refetch"
        textColorClass="btnRefetch"
      />
      <ActionButton
        disabled={queryStatus === "pending"}
        onClick={() => {
          invalidate({ query, queryClient });
        }}
        bgColorClass="btnInvalidate"
        text="Invalidate"
        textColorClass="btnInvalidate"
      />
      <ActionButton
        disabled={queryStatus === "pending"}
        onClick={() => {
          reset({ queryClient, query });
        }}
        bgColorClass="btnReset"
        text="Reset"
        textColorClass="btnReset"
      />
      <ActionButton
        disabled={getQueryStatusLabel(query) === "fetching"}
        onClick={() => {
          remove({ queryClient, query });
          setSelectedQuery(undefined);
        }}
        bgColorClass="btnRemove"
        text="Remove"
        textColorClass="btnRemove"
      />
      <ActionButton
        disabled={false}
        onClick={() => {
          triggerLoading({ query });
        }}
        bgColorClass="btnTriggerLoading"
        text={
          query.state.data === undefined ? "Restore Loading" : "Trigger Loading"
        }
        textColorClass="btnTriggerLoading"
      />
      <ActionButton
        disabled={queryStatus === "pending"}
        onClick={() => {
          triggerError({ query, queryClient });
        }}
        bgColorClass="btnTriggerLoadiError"
        text={queryStatus === "error" ? "Restore" : "Trigger Error"}
        textColorClass="btnTriggerLoadiError"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    minWidth: 50,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#171717",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    gap: 8,
    padding: 12,
  },
  headerText: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 12,
    width: "100%",
    fontWeight: "600",
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
    borderRadius: 6,
  },
});
