/**
 * Deletes nested data by path
 *
 * @param {unknown} oldData Data to be updated
 * @param {Array<string>} deletePath Path to the data to be deleted
 * @returns newData without the deleted items by path
 */
export const deleteNestedDataByPath = (
  oldData: unknown,
  deletePath: Array<string>
): unknown => {
  if (oldData instanceof Map) {
    const newData = new Map(oldData);

    if (deletePath.length === 1) {
      newData.delete(deletePath[0]);
      return newData;
    }

    const [head, ...tail] = deletePath;
    newData.set(head, deleteNestedDataByPath(newData.get(head), tail));
    return newData;
  }

  if (oldData instanceof Set) {
    const setAsArray = deleteNestedDataByPath(Array.from(oldData), deletePath);
    return new Set(setAsArray as Iterable<unknown>);
  }

  if (Array.isArray(oldData)) {
    const newData = [...oldData];

    if (deletePath.length === 1) {
      return newData.filter((_, idx) => idx.toString() !== deletePath[0]);
    }

    const [head, ...tail] = deletePath;

    // @ts-expect-error NAS
    newData[head] = deleteNestedDataByPath(newData[head], tail);

    return newData;
  }

  if (oldData instanceof Object) {
    const newData = { ...oldData };

    if (deletePath.length === 1) {
      // @ts-expect-error NAS
      delete newData[deletePath[0]];
      return newData;
    }

    const [head, ...tail] = deletePath;
    // @ts-expect-error NAS
    newData[head] = deleteNestedDataByPath(newData[head], tail);

    return newData;
  }

  return oldData;
};
