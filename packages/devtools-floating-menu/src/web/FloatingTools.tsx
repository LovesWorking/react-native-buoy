import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import { useFloatingPosition } from '../core/hooks/useFloatingPosition';
import { useFloatingVisibility } from '../core/hooks/useFloatingVisibility';
import { webStorageAdapter } from '../adapters/storage/web.storage';
import { webDimensionsAdapter } from '../adapters/dimensions/web.dimensions';
import { WebDragHandle } from './WebDragHandle';
import { GripIcon } from './GripIcon';
import type { Position } from '../core/types';

export interface FloatingToolsProps {
  enablePositionPersistence?: boolean;
  children?: ReactNode;
}

/**
 * Web implementation of FloatingTools
 *
 * A draggable, floating bubble for development tools on web.
 * Features:
 * - Drag and drop positioning
 * - Hide/show functionality
 * - Position persistence across sessions
 * - Boundary constraints
 */
export const FloatingTools = ({
  enablePositionPersistence = true,
  children,
}: FloatingToolsProps) => {
  const [bubbleSize, setBubbleSize] = useState({ width: 100, height: 32 });
  const [isDragging, setIsDragging] = useState(false);
  const sizeInitializedRef = useRef(false);

  const {
    position,
    setPosition,
    savePosition,
    validatePosition,
  } = useFloatingPosition({
    storage: webStorageAdapter,
    dimensions: webDimensionsAdapter,
    bubbleSize,
    visibleHandleWidth: 32,
    enabled: enablePositionPersistence,
  });

  const {
    isHidden,
    hide,
    toggle,
    checkShouldHide,
    setIsHidden,
  } = useFloatingVisibility({
    dimensions: webDimensionsAdapter,
    bubbleSize,
    onPositionChange: setPosition,
    savePosition,
  });

  // Check if should be hidden on initial load
  useEffect(() => {
    if (!enablePositionPersistence) return;

    const checkInitialHiddenState = () => {
      const { width } = webDimensionsAdapter.getWindow();
      if (position.x >= width - 32 - 5) {
        setIsHidden(true);
      }
    };

    // Delay to ensure position is loaded
    const timer = setTimeout(checkInitialHiddenState, 100);
    return () => clearTimeout(timer);
  }, [enablePositionPersistence, position.x, setIsHidden]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragMove = (newPosition: Position) => {
    setPosition(newPosition);
  };

  const handleDragEnd = (finalPosition: Position) => {
    const validated = validatePosition(finalPosition);
    setPosition(validated);

    if (checkShouldHide(validated)) {
      hide(validated);
    } else {
      // Check if pulling back from hidden state
      const { width } = webDimensionsAdapter.getWindow();
      if (isHidden && validated.x < width - 32 - 10) {
        setIsHidden(false);
      }
      savePosition(validated.x, validated.y);
    }

    setIsDragging(false);
  };

  const handleTap = () => {
    setIsDragging(false);
    toggle(position);
  };

  // Styles
  const bubbleStyle: CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    zIndex: 1001,
    transition: isDragging ? 'none' : 'left 200ms ease-out, top 200ms ease-out',
  };

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    border: isDragging ? '2px solid #6B93D6' : '1px solid rgba(140, 162, 200, 0.4)',
    overflow: 'hidden',
    boxShadow: isDragging
      ? '0 6px 12px rgba(107, 147, 214, 0.6)'
      : '0 4px 8px rgba(0, 0, 0, 0.3)',
  };

  const dragHandleStyle: CSSProperties = {
    padding: '6px',
    backgroundColor: 'rgba(108, 117, 125, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    borderRight: '1px solid rgba(140, 162, 200, 0.4)',
  };

  const contentStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  };

  return (
    <div style={bubbleStyle}>
      <div
        style={containerStyle}
        ref={(el) => {
          if (el && !sizeInitializedRef.current) {
            const rect = el.getBoundingClientRect();
            setBubbleSize({ width: rect.width, height: rect.height });
            sizeInitializedRef.current = true;
          }
        }}
      >
        <WebDragHandle
          position={position}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onTap={handleTap}
          style={dragHandleStyle}
        >
          <GripIcon size={12} />
        </WebDragHandle>

        <div style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};
