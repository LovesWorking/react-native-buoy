/**
 * Displays a string regardless the type of the data
 * @param {unknown} value Value to be stringified
 * @param {boolean} beautify Formats json to multiline
 */
export const displayValue = (value: unknown, beautify: boolean = false) => {
  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (_key: string, currentValue: unknown) => {
      if (typeof currentValue === "object" && currentValue !== null) {
        if (seen.has(currentValue)) {
          return "[Circular]";
        }
        seen.add(currentValue);
      }
      return currentValue;
    };
  };

  return JSON.stringify(value, getCircularReplacer(), beautify ? 2 : undefined);
};
