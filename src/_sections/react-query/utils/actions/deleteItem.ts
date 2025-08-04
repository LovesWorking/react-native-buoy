import { Query, QueryClient } from "@tanstack/react-query";
import { deleteNestedDataByPath } from "../deleteNestedDataByPath";

interface Props {
  queryClient: QueryClient;
  activeQuery: Query;
  dataPath: Array<string> | undefined;
}
export default function deleteItem({
  activeQuery,
  dataPath,
  queryClient,
}: Props) {
  if (!dataPath) {
    console.error("delete item data path is missing!");
    return;
  }
  const oldData = activeQuery.state.data;
  const newData = deleteNestedDataByPath(oldData, dataPath);
  queryClient.setQueryData(activeQuery.queryKey, newData);
}
