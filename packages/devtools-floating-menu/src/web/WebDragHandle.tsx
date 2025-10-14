import { useRef, type ReactNode, type CSSProperties } from 'react';
import type { Position } from '../core/types';

export interface WebDragHandleProps {
  children: ReactNode;
  position: Position;
  onDragStart: (startPosition: Position) => void;
  onDragMove: (newPosition: Position) => void;
  onDragEnd: (finalPosition: Position) => void;
  onTap: () => void;
  enabled?: boolean;
  style?: CSSProperties;
}

/**
 * Web drag handle component using mouse/touch events
 *
 * Provides draggable functionality for web browsers.
 * Handles both mouse and touch interactions.
 */
export const WebDragHandle = ({
  children,
  position,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTap,
  enabled = true,
  style,
}: WebDragHandleProps) => {
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startMouseRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enabled) return;
    e.preventDefault();

    isDraggingRef.current = false;
    startPosRef.current = position;
    startMouseRef.current = { x: e.clientX, y: e.clientY };

    onDragStart(position);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: Event) => {
    const mouseEvent = e as globalThis.MouseEvent;
    const dx = mouseEvent.clientX - startMouseRef.current.x;
    const dy = mouseEvent.clientY - startMouseRef.current.y;

    const totalDistance = Math.abs(dx) + Math.abs(dy);
    if (totalDistance > 5) {
      isDraggingRef.current = true;
    }

    onDragMove({
      x: startPosRef.current.x + dx,
      y: startPosRef.current.y + dy,
    });
  };

  const handleMouseUp = (e: Event) => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    const mouseEvent = e as globalThis.MouseEvent;
    const dx = mouseEvent.clientX - startMouseRef.current.x;
    const dy = mouseEvent.clientY - startMouseRef.current.y;
    const totalDistance = Math.abs(dx) + Math.abs(dy);

    const finalPosition = {
      x: startPosRef.current.x + dx,
      y: startPosRef.current.y + dy,
    };

    if (totalDistance <= 5 && !isDraggingRef.current) {
      onTap();
    } else {
      onDragEnd(finalPosition);
    }

    isDraggingRef.current = false;
  };

  const containerStyle: CSSProperties = {
    cursor: enabled ? 'grab' : 'default',
    userSelect: 'none',
    ...style,
  };

  return (
    <div onMouseDown={handleMouseDown} style={containerStyle}>
      {children}
    </div>
  );
};
