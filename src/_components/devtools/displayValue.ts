/**
 * Displays a string regardless the type of the data
 * @param {unknown} value Value to be stringified
 * @param {boolean} beautify Formats json to multiline
 */
export const displayValue = (value: unknown, beautify: boolean = false) => {
  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (_key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    };
  };

  return JSON.stringify(value, getCircularReplacer(), beautify ? 2 : undefined);
};
