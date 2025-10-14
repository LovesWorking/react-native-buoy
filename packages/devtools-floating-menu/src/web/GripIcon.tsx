import type { CSSProperties } from 'react';

export interface GripIconProps {
  size?: number;
  color?: string;
}

/**
 * Grip icon for web drag handle
 *
 * Renders a vertical grip pattern using divs to avoid SVG dependencies.
 */
export const GripIcon = ({
  size = 12,
  color = 'rgba(140, 162, 200, 0.8)',
}: GripIconProps) => {
  const containerStyle: CSSProperties = {
    width: size,
    height: size,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const dotSize = Math.max(2, Math.round(size / 6));
  const columnGap = Math.max(2, Math.round(size / 12));
  const rowGap = Math.max(2, Math.round(size / 12));

  const columnStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: columnGap / 2,
    marginRight: columnGap / 2,
  };

  const dotStyle: CSSProperties = {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: color,
    marginTop: rowGap / 2,
    marginBottom: rowGap / 2,
  };

  return (
    <div style={containerStyle}>
      <div style={columnStyle}>
        <div style={dotStyle} />
        <div style={dotStyle} />
        <div style={dotStyle} />
      </div>
      <div style={columnStyle}>
        <div style={dotStyle} />
        <div style={dotStyle} />
        <div style={dotStyle} />
      </div>
    </div>
  );
};
