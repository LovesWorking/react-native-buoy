import { ReactQueryIcon } from "@react-buoy/shared-ui";
import {
  CheckCircle as SharedCheckCircle,
  Activity as SharedActivity,
  Pause as SharedPause,
  XCircle as SharedXCircle,
} from "@react-buoy/shared-ui";
import { gameUIColors } from "@react-buoy/shared-ui";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function TanstackLogo({ size = 24 }: IconProps) {
  return <ReactQueryIcon size={size} colorPreset="red" variant="circuit" />;
}

export function CheckCircle({
  size = 14,
  color = gameUIColors.success,
  strokeWidth = 2,
}: IconProps) {
  return (
    <SharedCheckCircle size={size} color={color} strokeWidth={strokeWidth} />
  );
}

export function LoadingCircle({
  size = 14,
  color = gameUIColors.warning,
  strokeWidth = 2,
}: IconProps) {
  return <SharedActivity size={size} color={color} strokeWidth={strokeWidth} />;
}

export function PauseCircle({
  size = 14,
  color = gameUIColors.storage,
  strokeWidth = 2,
}: IconProps) {
  return <SharedPause size={size} color={color} strokeWidth={strokeWidth} />;
}

export function XCircle({
  size = 14,
  color = gameUIColors.error,
  strokeWidth = 2,
}: IconProps) {
  return <SharedXCircle size={size} color={color} strokeWidth={strokeWidth} />;
}
