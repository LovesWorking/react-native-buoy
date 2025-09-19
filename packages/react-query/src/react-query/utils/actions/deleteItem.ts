import { Query, QueryClient } from "@tanstack/react-query";
import { deleteNestedDataByPath } from "../deleteNestedDataByPath";

interface Props {
  queryClient: QueryClient;
  activeQuery: Query;
  dataPath: string[] | undefined;
}
export default function deleteItem({
  activeQuery,
  dataPath,
  queryClient,
}: Props) {
  if (!dataPath) {
    // Early return if path is missing
    return;
  }

  const oldData = activeQuery.state.data;
  const newData = deleteNestedDataByPath(oldData, dataPath);

  // Force a new object reference to ensure React detects the change
  const forceNewReference = JSON.parse(JSON.stringify(newData));

  queryClient.setQueryData(activeQuery.queryKey, forceNewReference);
}
