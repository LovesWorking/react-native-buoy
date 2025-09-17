import { useEffect, useRef } from "react";
import { Animated, View, Text as RNText } from "react-native";
import Svg, {
  Path,
  Line,
  Rect,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Defs,
  Mask,
  G,
  Ellipse,
  Text,
  Filter,
  FeGaussianBlur,
  FeOffset,
  FeFlood,
  FeComposite,
  FeMerge,
  FeMergeNode,
  Polygon,
  Pattern,
} from "react-native-svg";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/gameUIColors";

export function Trash() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6M3 6h18m-2 0l-.701 10.52c-.105 1.578-.158 2.367-.499 2.965a3 3 0 01-1.298 1.215c-.62.3-1.41.3-2.993.3h-3.018c-1.582 0-2.373 0-2.993-.3A3 3 0 016.2 19.485c-.34-.598-.394-1.387-.499-2.966L5 6m5 4.5v5m4-5v5"
        stroke={gameUIColors.error}
        strokeWidth="1.5"
      />
    </Svg>
  );
}

export function Copier() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 8V5.2C8 4.0799 8 3.51984 8.21799 3.09202C8.40973 2.71569 8.71569 2.40973 9.09202 2.21799C9.51984 2 10.0799 2 11.2 2H18.8C19.9201 2 20.4802 2 20.908 2.21799C21.2843 2.40973 21.5903 2.71569 21.782 3.09202C22 3.51984 22 4.0799 22 5.2V12.8C22 13.9201 22 14.4802 21.782 14.908C21.5903 15.2843 21.2843 15.5903 20.908 15.782C20.4802 16 19.9201 16 18.8 16H16M5.2 22H12.8C13.9201 22 14.4802 22 14.908 21.782C15.2843 21.5903 15.5903 21.2843 15.782 20.908C16 20.4802 16 19.9201 16 18.8V11.2C16 10.0799 16 9.51984 15.782 9.09202C15.5903 8.71569 15.2843 8.40973 14.908 8.21799C14.4802 8 13.9201 8 12.8 8H5.2C4.0799 8 3.51984 8 3.09202 8.21799C2.71569 8.40973 2.40973 8.71569 2.21799 9.09202C2 9.51984 2 10.0799 2 11.2V18.8C2 19.9201 2 20.4802 2.21799 20.908C2.40973 21.2843 2.71569 21.5903 3.09202 21.782C3.51984 22 4.07989 22 5.2 22Z"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={gameUIColors.info}
      />
    </Svg>
  );
}

export function CopiedCopier(props: { theme: "light" | "dark" }) {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.5 12L10.5 15L16.5 9M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"
        stroke={gameUIColors.success}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ErrorCopier() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 9L15 15M15 9L9 15M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"
        stroke={gameUIColors.error}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function List() {
  return (
    <Svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={gameUIColors.muted}
      strokeWidth="2"
    >
      <Rect width="20" height="20" y="2" x="2" rx="2" />
      <Line y1="7" y2="7" x1="6" x2="18" />
      <Line y2="12" y1="12" x1="6" x2="18" />
      <Line y1="17" y2="17" x1="6" x2="18" />
    </Svg>
  );
}

export function CheckCircle() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke={gameUIColors.success}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LoadingCircle() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0784 19.0784L16.25 16.25M19.0784 4.99994L16.25 7.82837M4.92157 19.0784L7.75 16.25M4.92157 4.99994L7.75 7.82837"
        stroke={gameUIColors.warning}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function XCircle() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke={gameUIColors.error}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PauseCircle() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 15V9M14.5 15V9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke={gameUIColors.storage}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function TanstackLogo() {
  return (
    <Svg height="100%" width="100%" viewBox="0 0 633 633">
      <LinearGradient
        x1={-666.45}
        x2={-666.45}
        y1={163.28}
        y2={163.99}
        gradientTransform="matrix(633 0 0 633 422177 -103358)"
        gradientUnits="userSpaceOnUse"
        id="a"
      >
        <Stop stopColor="#6BDAFF" offset={0} />
        <Stop stopColor="#F9FFB5" offset={0.32} />
        <Stop stopColor="#FFA770" offset={0.71} />
        <Stop stopColor="#FF7373" offset={1} />
      </LinearGradient>
      <Circle cx={316.5} cy={316.5} r={316.5} fill="url(#a)" />
      <Defs />
      <Mask
        x={-137.5}
        y={412}
        width={454}
        height={396.9}
        maskUnits="userSpaceOnUse"
        id="c"
      >
        <G filter="url(#b)">
          <Circle cx={316.5} cy={316.5} r={316.5} fill="#fff" />
        </G>
      </Mask>
      <G mask="url(#c)">
        <Ellipse
          cx={89.5}
          cy={610.5}
          rx={214.5}
          ry={186}
          fill="#015064"
          stroke="#00CFE2"
          strokeWidth={25}
        />
      </G>
      <Defs />
      <Mask
        x={316.5}
        y={412}
        width={454}
        height={396.9}
        maskUnits="userSpaceOnUse"
        id="e"
      >
        <G filter="url(#d)">
          <Circle cx={316.5} cy={316.5} r={316.5} fill="#fff" />
        </G>
      </Mask>
      <G mask="url(#e)">
        <Ellipse
          cx={543.5}
          cy={610.5}
          rx={214.5}
          ry={186}
          fill="#015064"
          stroke="#00CFE2"
          strokeWidth={25}
        />
      </G>
      <Defs />
      <Mask
        x={-137.5}
        y={450}
        width={454}
        height={396.9}
        maskUnits="userSpaceOnUse"
        id="g"
      >
        <G filter="url(#f)">
          <Circle cx={316.5} cy={316.5} r={316.5} fill="#fff" />
        </G>
      </Mask>
      <G mask="url(#g)">
        <Ellipse
          cx={89.5}
          cy={648.5}
          rx={214.5}
          ry={186}
          fill="#015064"
          stroke="#00A8B8"
          strokeWidth={25}
        />
      </G>
      <Defs />
      <Mask
        x={316.5}
        y={450}
        width={454}
        height={396.9}
        maskUnits="userSpaceOnUse"
        id="i"
      >
        <G filter="url(#h)">
          <Circle cx={316.5} cy={316.5} r={316.5} fill="#fff" />
        </G>
      </Mask>
      <G mask="url(#i)">
        <Ellipse
          cx={543.5}
          cy={648.5}
          rx={214.5}
          ry={186}
          fill="#015064"
          stroke="#00A8B8"
          strokeWidth={25}
        />
      </G>
      <Defs />
      <Mask
        x={-137.5}
        y={486}
        width={454}
        height={396.9}
        maskUnits="userSpaceOnUse"
        id="k"
      >
        <G filter="url(#j)">
          <Circle cx={316.5} cy={316.5} r={316.5} fill="#fff" />
        </G>
      </Mask>
      <G mask="url(#k)">
        <Ellipse
          cx={89.5}
          cy={684.5}
          rx={214.5}
          ry={186}
          fill="#015064"
          stroke="#007782"
          strokeWidth={25}
        />
      </G>
      <Defs />
      <Mask
        x={316.5}
        y={486}
        width={454}
        height={396.9}
        maskUnits="userSpaceOnUse"
        id="m"
      >
        <G filter="url(#l)">
          <Circle cx={316.5} cy={316.5} r={316.5} fill="#fff" />
        </G>
      </Mask>
      <G mask="url(#m)">
        <Ellipse
          cx={543.5}
          cy={684.5}
          rx={214.5}
          ry={186}
          fill="#015064"
          stroke="#007782"
          strokeWidth={25}
        />
      </G>
      <Defs />
      <Mask
        x={272.2}
        y={308}
        width={176.9}
        height={129.3}
        maskUnits="userSpaceOnUse"
        id="o"
      >
        <G filter="url(#n)">
          <Circle cx={316.5} cy={316.5} r={316.5} fill="#fff" />
        </G>
      </Mask>
      <G mask="url(#o)">
        <Path
          fill="none"
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={11}
          d="M436 403.2L431 431.8"
        />
        <Path
          fill="none"
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={11}
          d="M291 341.5L280 403.5"
        />
        <Path
          fill="none"
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={11}
          d="M332.9 384.1L328.6 411.2"
        />
        <LinearGradient
          x1={-670.75}
          x2={-671.59}
          y1={164.4}
          y2={164.49}
          gradientTransform="matrix(-184.16 -32.472 -11.461 64.997 -121359 -32126)"
          gradientUnits="userSpaceOnUse"
          id="p"
        >
          <Stop stopColor="#EE2700" offset={0} />
          <Stop stopColor="#FF008E" offset={1} />
        </LinearGradient>
        <Path
          d="M344.1 363l97.7 17.2c5.8 2.1 8.2 6.1 7.1 12.1s-4.7 9.2-11 9.9l-106-18.7-57.5-59.2c-3.2-4.8-2.9-9.1.8-12.8s8.3-4.4 13.7-2.1l55.2 53.6z"
          clipRule="evenodd"
          fillRule="evenodd"
          fill="url(#p)"
        />
        <Path
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={7}
          d="M428.2 384.5L429.1 378"
        />
        <Path
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={7}
          d="M395.2 379.5L396.1 373"
        />
        <Path
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={7}
          d="M362.2 373.5L363.1 367.4"
        />
        <Path
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={7}
          d="M324.2 351.3L328.4 347.4"
        />
        <Path
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={7}
          d="M303.2 331.3L307.4 327.4"
        />
      </G>
      <Defs />
      <Mask
        x={73.2}
        y={113.8}
        width={280.6}
        height={317.4}
        maskUnits="userSpaceOnUse"
        id="r"
      >
        <G filter="url(#q)">
          <Circle cx={316.5} cy={316.5} r={316.5} fill="#fff" />
        </G>
      </Mask>
      <G mask="url(#r)">
        <LinearGradient
          x1={-672.16}
          x2={-672.16}
          y1={165.03}
          y2={166.03}
          gradientTransform="matrix(-100.18 48.861 97.976 200.88 -83342 -93.059)"
          gradientUnits="userSpaceOnUse"
          id="s"
        >
          <Stop stopColor="#A17500" offset={0} />
          <Stop stopColor="#5D2100" offset={1} />
        </LinearGradient>
        <Path
          d="M192.3 203c8.1 37.3 14 73.6 17.8 109.1 3.8 35.4 2.8 75.1-3 119.2l61.2-16.7c-15.6-59-25.2-97.9-28.6-116.6s-10.8-51.9-22.1-99.6l-25.3 4.6"
          clipRule="evenodd"
          fillRule="evenodd"
          fill="url(#s)"
        />
        <G stroke="#2F8A00">
          <LinearGradient
            x1={-660.23}
            x2={-660.23}
            y1={166.72}
            y2={167.72}
            gradientTransform="matrix(92.683 4.8573 -2.0259 38.657 61680 -3088.6)"
            gradientUnits="userSpaceOnUse"
            id="t"
          >
            <Stop stopColor="#2F8A00" offset={0} />
            <Stop stopColor="#90FF57" offset={1} />
          </LinearGradient>
          <Path
            d="M195 183.9s-12.6-22.1-36.5-29.9c-15.9-5.2-34.4-1.5-55.5 11.1 15.9 14.3 29.5 22.6 40.7 24.9 16.8 3.6 51.3-6.1 51.3-6.1z"
            clipRule="evenodd"
            fillRule="evenodd"
            strokeWidth={13}
            fill="url(#t)"
          />
          <LinearGradient
            x1={-661.36}
            x2={-661.36}
            y1={164.18}
            y2={165.18}
            gradientTransform="matrix(110 5.7648 -6.3599 121.35 73933 -15933)"
            gradientUnits="userSpaceOnUse"
            id="u"
          >
            <Stop stopColor="#2F8A00" offset={0} />
            <Stop stopColor="#90FF57" offset={1} />
          </LinearGradient>
          <Path
            d="M194.9 184.5s-47.5-8.5-83.2 15.7c-23.8 16.2-34.3 49.3-31.6 99.4 30.3-27.8 52.1-48.5 65.2-61.9 19.8-20.2 49.6-53.2 49.6-53.2z"
            clipRule="evenodd"
            fillRule="evenodd"
            strokeWidth={13}
            fill="url(#u)"
          />
          <LinearGradient
            x1={-656.79}
            x2={-656.79}
            y1={165.15}
            y2={166.15}
            gradientTransform="matrix(62.954 3.2993 -3.5023 66.828 42156 -8754.1)"
            gradientUnits="userSpaceOnUse"
            id="v"
          >
            <Stop stopColor="#2F8A00" offset={0} />
            <Stop stopColor="#90FF57" offset={1} />
          </LinearGradient>
          <Path
            d="M195 183.9c-.8-21.9 6-38 20.6-48.2s29.8-15.4 45.5-15.3c-6.1 21.4-14.5 35.8-25.2 43.4S211.5 178 195 183.9z"
            clipRule="evenodd"
            fillRule="evenodd"
            strokeWidth={13}
            fill="url(#v)"
          />
          <LinearGradient
            x1={-663.07}
            x2={-663.07}
            y1={165.44}
            y2={166.44}
            gradientTransform="matrix(152.47 7.9907 -3.0936 59.029 101884 -4318.7)"
            gradientUnits="userSpaceOnUse"
            id="w"
          >
            <Stop stopColor="#2F8A00" offset={0} />
            <Stop stopColor="#90FF57" offset={1} />
          </LinearGradient>
          <Path
            d="M194.9 184.5c31.9-30 64.1-39.7 96.7-29s50.8 30.4 54.6 59.1c-35.2-5.5-60.4-9.6-75.8-12.1-15.3-2.6-40.5-8.6-75.5-18z"
            clipRule="evenodd"
            fillRule="evenodd"
            strokeWidth={13}
            fill="url(#w)"
          />
          <LinearGradient
            x1={-662.57}
            x2={-662.57}
            y1={164.44}
            y2={165.44}
            gradientTransform="matrix(136.46 7.1517 -5.2163 99.533 91536 -11442)"
            gradientUnits="userSpaceOnUse"
            id="x"
          >
            <Stop stopColor="#2F8A00" offset={0} />
            <Stop stopColor="#90FF57" offset={1} />
          </LinearGradient>
          <Path
            d="M194.9 184.5c35.8-7.6 65.6-.2 89.2 22s37.7 49 42.3 80.3c-39.8-9.7-68.3-23.8-85.5-42.4s-32.5-38.5-46-59.9z"
            clipRule="evenodd"
            fillRule="evenodd"
            strokeWidth={13}
            fill="url(#x)"
          />
          <LinearGradient
            x1={-656.43}
            x2={-656.43}
            y1={163.86}
            y2={164.86}
            gradientTransform="matrix(60.866 3.1899 -8.7773 167.48 41560 -25168)"
            gradientUnits="userSpaceOnUse"
            id="y"
          >
            <Stop stopColor="#2F8A00" offset={0} />
            <Stop stopColor="#90FF57" offset={1} />
          </LinearGradient>
          <Path
            d="M194.9 184.5c-33.6 13.8-53.6 35.7-60.1 65.6s-3.6 63.1 8.7 99.6c27.4-40.3 43.2-69.6 47.4-88s5.6-44.1 4-77.2z"
            clipRule="evenodd"
            fillRule="evenodd"
            strokeWidth={13}
            fill="url(#y)"
          />
          <Path
            d="M196.5 182.3c-14.8 21.6-25.1 41.4-30.8 59.4s-9.5 33-11.1 45.1"
            fill="none"
            strokeLinecap="round"
            strokeWidth={8}
          />
          <Path
            d="M194.9 185.7c-24.4 1.7-43.8 9-58.1 21.8s-24.7 25.4-31.3 37.8M204.5 176.4c29.7-6.7 52-8.4 67-5.1s26.9 8.6 35.8 15.9M196.5 181.4c20.3 9.9 38.2 20.5 53.9 31.9s27.4 22.1 35.1 32"
            fill="none"
            strokeLinecap="round"
            strokeWidth={8}
          />
        </G>
      </G>
      <Defs />
      <Mask
        x={50.5}
        y={399}
        width={532}
        height={633}
        maskUnits="userSpaceOnUse"
        id="A"
      >
        <G filter="url(#z)">
          <Circle cx={316.5} cy={316.5} r={316.5} fill="#fff" />
        </G>
      </Mask>
      <G mask="url(#A)">
        <LinearGradient
          x1={-666.06}
          x2={-666.23}
          y1={163.36}
          y2={163.75}
          gradientTransform="matrix(532 0 0 633 354760 -102959)"
          gradientUnits="userSpaceOnUse"
          id="B"
        >
          <Stop stopColor="#FFF400" offset={0} />
          <Stop stopColor="#3C8700" offset={1} />
        </LinearGradient>
        <Ellipse cx={316.5} cy={715.5} rx={266} ry={316.5} fill="url(#B)" />
      </G>
      <Defs />
      <Mask
        x={391}
        y={-24}
        width={288}
        height={283}
        maskUnits="userSpaceOnUse"
        id="D"
      >
        <G filter="url(#C)">
          <Circle cx={316.5} cy={316.5} r={316.5} fill="#fff" />
        </G>
      </Mask>
      <G mask="url(#D)">
        <LinearGradient
          x1={-664.56}
          x2={-664.56}
          y1={163.79}
          y2={164.79}
          gradientTransform="matrix(227 0 0 227 151421 -37204)"
          gradientUnits="userSpaceOnUse"
          id="E"
        >
          <Stop stopColor="#FFDF00" offset={0} />
          <Stop stopColor="#FF9D00" offset={1} />
        </LinearGradient>
        <Circle cx={565.5} cy={89.5} r={113.5} fill="url(#E)" />
        <LinearGradient
          x1={-644.5}
          x2={-645.77}
          y1={342}
          y2={342}
          gradientTransform="matrix(30 0 0 1 19770 -253)"
          gradientUnits="userSpaceOnUse"
          id="F"
        >
          <Stop stopColor="#FFA400" offset={0} />
          <Stop stopColor="#FF5E00" offset={1} />
        </LinearGradient>
        <Path
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={12}
          stroke="url(#F)"
          d="M427 89L397 89"
        />
        <LinearGradient
          x1={-641.56}
          x2={-642.83}
          y1={196.02}
          y2={196.07}
          gradientTransform="matrix(26.5 0 0 5.5 17439 -1025.5)"
          gradientUnits="userSpaceOnUse"
          id="G"
        >
          <Stop stopColor="#FFA400" offset={0} />
          <Stop stopColor="#FF5E00" offset={1} />
        </LinearGradient>
        <Path
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={12}
          stroke="url(#G)"
          d="M430.5 55.5L404 50"
        />
        <LinearGradient
          x1={-643.73}
          x2={-645}
          y1={185.83}
          y2={185.9}
          gradientTransform="matrix(29 0 0 8 19107 -1361)"
          gradientUnits="userSpaceOnUse"
          id="H"
        >
          <Stop stopColor="#FFA400" offset={0} />
          <Stop stopColor="#FF5E00" offset={1} />
        </LinearGradient>
        <Path
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={12}
          stroke="url(#H)"
          d="M431 122L402 130"
        />
        <LinearGradient
          x1={-638.94}
          x2={-640.22}
          y1={177.09}
          y2={177.39}
          gradientTransform="matrix(24 0 0 13 15783 -2145)"
          gradientUnits="userSpaceOnUse"
          id="I"
        >
          <Stop stopColor="#FFA400" offset={0} />
          <Stop stopColor="#FF5E00" offset={1} />
        </LinearGradient>
        <Path
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={12}
          stroke="url(#I)"
          d="M442 153L418 166"
        />
        <LinearGradient
          x1={-633.42}
          x2={-634.7}
          y1={172.41}
          y2={173.31}
          gradientTransform="matrix(20 0 0 19 13137 -3096)"
          gradientUnits="userSpaceOnUse"
          id="J"
        >
          <Stop stopColor="#FFA400" offset={0} />
          <Stop stopColor="#FF5E00" offset={1} />
        </LinearGradient>
        <Path
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={12}
          stroke="url(#J)"
          d="M464 180L444 199"
        />
        <LinearGradient
          x1={-619.05}
          x2={-619.52}
          y1={170.82}
          y2={171.82}
          gradientTransform="matrix(13.83 0 0 22.85 9050 -3703.4)"
          gradientUnits="userSpaceOnUse"
          id="K"
        >
          <Stop stopColor="#FFA400" offset={0} />
          <Stop stopColor="#FF5E00" offset={1} />
        </LinearGradient>
        <Path
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={12}
          stroke="url(#K)"
          d="M491.4 203L477.5 225.9"
        />
        <LinearGradient
          x1={-578.5}
          x2={-578.63}
          y1={170.31}
          y2={171.31}
          gradientTransform="matrix(7.5 0 0 24.5 4860 -3953)"
          gradientUnits="userSpaceOnUse"
          id="L"
        >
          <Stop stopColor="#FFA400" offset={0} />
          <Stop stopColor="#FF5E00" offset={1} />
        </LinearGradient>
        <Path
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={12}
          stroke="url(#L)"
          d="M524.5 219.5L517 244"
        />
        <LinearGradient
          x1={666.5}
          x2={666.5}
          y1={170.31}
          y2={171.31}
          gradientTransform="matrix(.5 0 0 24.5 231.5 -3944)"
          gradientUnits="userSpaceOnUse"
          id="M"
        >
          <Stop stopColor="#FFA400" offset={0} />
          <Stop stopColor="#FF5E00" offset={1} />
        </LinearGradient>
        <Path
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="bevel"
          strokeWidth={12}
          stroke="url(#M)"
          d="M564.5 228.5L565 253"
        />
      </G>
    </Svg>
  );
}

export function SentryLogo() {
  return (
    <Svg width={16} height={16} viewBox="0 0 72 66">
      <Path
        fill="#a855f7"
        d="M40 13.26a4.67 4.67 0 0 0-8 0l-6.58 11.27a32.21 32.21 0 0 1 17.75 26.66h-4.62a27.68 27.68 0 0 0-15.46-22.72L17 39a15.92 15.92 0 0 1 9.23 12.17H15.62a.76.76 0 0 1-.62-1.11l2.94-5a10.74 10.74 0 0 0-3.36-1.9l-2.91 5a4.54 4.54 0 0 0 1.69 6.24 4.66 4.66 0 0 0 2.26.6h14.53a19.4 19.4 0 0 0-8-17.31l2.31-4A23.87 23.87 0 0 1 34.76 55h12.31a35.88 35.88 0 0 0-16.41-31.8l4.67-8a.77.77 0 0 1 1.05-.27c.53.29 20.29 34.77 20.66 35.17a.76.76 0 0 1-.68 1.13H51.6q.09 1.91 0 3.81h4.78A4.59 4.59 0 0 0 61 50.43a4.49 4.49 0 0 0-.62-2.28Z"
      />
    </Svg>
  );
}

export function ReactQueryButton() {
  return (
    <svg
      width="500"
      height="300"
      viewBox="0 0 500 300"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <linearGradient
          id="tanstack-grad"
          x1="-666.45"
          y1="163.28"
          x2="-666.45"
          y2="163.99"
          gradientTransform="matrix(633 0 0 633 422177 -103358)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6BDAFF" offset="0" />
          <stop stopColor="#F9FFB5" offset="0.32" />
          <stop stopColor="#FFA770" offset="0.71" />
          <stop stopColor="#FF7373" offset="1" />
        </linearGradient>

        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4.5" result="coloredBlur">
            <animate
              attributeName="stdDeviation"
              dur="4s"
              repeatCount="indefinite"
              values="4; 8; 4"
            />
          </feGaussianBlur>
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feFlood floodColor="#FF006E" result="flood" />
          <feComposite in="flood" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g>
        <animateTransform
          attributeName="transform"
          type="scale"
          from="1"
          to="1.02"
          dur="2.5s"
          begin="0s"
          repeatCount="indefinite"
          additive="sum"
          calcMode="spline"
          keyTimes="0; 0.5; 1"
          values="1; 1.02; 1"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />

        <rect
          x="25"
          y="75"
          width="450"
          height="150"
          rx="15"
          fill="rgba(0,0,0,0.85)"
          stroke="#FF006E"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        <rect
          x="25"
          y="75"
          width="450"
          height="150"
          rx="15"
          fill="none"
          stroke="#FF006E"
          strokeWidth="4"
          filter="url(#glow)"
        />

        <rect
          x="30"
          y="80"
          width="440"
          height="140"
          rx="10"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.1"
          strokeWidth="1"
        />

        <g fill="#FF006E">
          <rect x="35" y="85" width="20" height="4" />
          <rect x="35" y="85" width="4" height="20" />
          <rect x="461" y="85" width="-20" height="4" />
          <rect x="461" y="85" width="4" height="20" />
          <rect x="35" y="211" width="20" height="-4" />
          <rect x="35" y="211" width="4" height="-20" />
          <rect x="461" y="211" width="-20" height="-4" />
          <rect x="461" y="211" width="4" height="-20" />
        </g>

        <g transform="translate(50, 110)">
          <g transform="scale(0.12)">
            <circle
              cx="316.5"
              cy="316.5"
              r="316.5"
              fill="url(#tanstack-grad)"
            />
            <g mask="url(#c)">
              <ellipse
                cx="89.5"
                cy="610.5"
                rx="214.5"
                ry="186"
                fill="#015064"
                stroke="#00CFE2"
                strokeWidth="25"
              />
            </g>
            <g mask="url(#e)">
              <ellipse
                cx="543.5"
                cy="610.5"
                rx="214.5"
                ry="186"
                fill="#015064"
                stroke="#00CFE2"
                strokeWidth="25"
              />
            </g>
            <g mask="url(#g)">
              <ellipse
                cx="89.5"
                cy="648.5"
                rx="214.5"
                ry="186"
                fill="#015064"
                stroke="#00A8B8"
                strokeWidth="25"
              />
            </g>
            <g mask="url(#i)">
              <ellipse
                cx="543.5"
                cy="648.5"
                rx="214.5"
                ry="186"
                fill="#015064"
                stroke="#00A8B8"
                strokeWidth="25"
              />
            </g>
            <g mask="url(#k)">
              <ellipse
                cx="89.5"
                cy="684.5"
                rx="214.5"
                ry="186"
                fill="#015064"
                stroke="#007782"
                strokeWidth="25"
              />
            </g>
            <g mask="url(#m)">
              <ellipse
                cx="543.5"
                cy="684.5"
                rx="214.5"
                ry="186"
                fill="#015064"
                stroke="#007782"
                strokeWidth="25"
              />
            </g>
            <g mask="url(#o)">
              <path
                fill="none"
                stroke="#000"
                strokeLinecap="round"
                strokeLinejoin="bevel"
                strokeWidth="11"
                d="M436 403.2L431 431.8"
              />
              <path
                fill="none"
                stroke="#000"
                strokeLinecap="round"
                strokeLinejoin="bevel"
                strokeWidth="11"
                d="M291 341.5L280 403.5"
              />
              <path
                fill="none"
                stroke="#000"
                strokeLinecap="round"
                strokeLinejoin="bevel"
                strokeWidth="11"
                d="M332.9 384.1L328.6 411.2"
              />
              <path
                d="M344.1 363l97.7 17.2c5.8 2.1 8.2 6.1 7.1 12.1s-4.7 9.2-11 9.9l-106-18.7-57.5-59.2c-3.2-4.8-2.9-9.1.8-12.8s8.3-4.4 13.7-2.1l55.2 53.6z"
                fill="red"
              />
            </g>
            <g mask="url(#r)">
              <path
                d="M192.3 203c8.1 37.3 14 73.6 17.8 109.1 3.8 35.4 2.8 75.1-3 119.2l61.2-16.7c-15.6-59-25.2-97.9-28.6-116.6s-10.8-51.9-22.1-99.6l-25.3 4.6"
                fill="brown"
              />
              <g stroke="#2F8A00">
                <path
                  d="M195 183.9s-12.6-22.1-36.5-29.9c-15.9-5.2-34.4-1.5-55.5 11.1 15.9 14.3 29.5 22.6 40.7 24.9 16.8 3.6 51.3-6.1 51.3-6.1z"
                  strokeWidth="13"
                  fill="green"
                />
                <path
                  d="M194.9 184.5s-47.5-8.5-83.2 15.7c-23.8 16.2-34.3 49.3-31.6 99.4 30.3-27.8 52.1-48.5 65.2-61.9 19.8-20.2 49.6-53.2 49.6-53.2z"
                  strokeWidth="13"
                  fill="green"
                />
                <path
                  d="M195 183.9c-.8-21.9 6-38 20.6-48.2s29.8-15.4 45.5-15.3c-6.1 21.4-14.5 35.8-25.2 43.4S211.5 178 195 183.9z"
                  strokeWidth="13"
                  fill="green"
                />
                <path
                  d="M194.9 184.5c31.9-30 64.1-39.7 96.7-29s50.8 30.4 54.6 59.1c-35.2-5.5-60.4-9.6-75.8-12.1-15.3-2.6-40.5-8.6-75.5-18z"
                  strokeWidth="13"
                  fill="green"
                />
                <path
                  d="M194.9 184.5c35.8-7.6 65.6-.2 89.2 22s37.7 49 42.3 80.3c-39.8-9.7-68.3-23.8-85.5-42.4s-32.5-38.5-46-59.9z"
                  strokeWidth="13"
                  fill="green"
                />
                <path
                  d="M194.9 184.5c-33.6 13.8-53.6 35.7-60.1 65.6s-3.6 63.1 8.7 99.6c27.4-40.3 43.2-69.6 47.4-88s5.6-44.1 4-77.2z"
                  strokeWidth="13"
                  fill="green"
                />
              </g>
            </g>
            <g mask="url(#A)">
              <ellipse
                cx="316.5"
                cy="715.5"
                rx="266"
                ry="316.5"
                fill="yellow"
              />
            </g>
            <g mask="url(#D)">
              <circle cx="565.5" cy="89.5" r="113.5" fill="orange" />
            </g>
          </g>

          <g transform="translate(150, 30)">
            <text
              y="20"
              fontFamily="monospace, sans-serif"
              fontSize="32"
              fontWeight="900"
              letterSpacing="1.5"
              fill="#FF006E"
              filter="url(#text-glow)"
            >
              QUERY
            </text>
            <text
              y="55"
              fontFamily="monospace, sans-serif"
              fontSize="22"
              fontWeight="600"
              letterSpacing="1"
              fill="#FF80AB"
              opacity="0.8"
            >
              DATABASE
            </text>
          </g>
        </g>

        <text
          x="440"
          y="210"
          fontFamily="monospace"
          fontSize="14"
          fill="#FF006E"
          opacity="0.4"
        >
          010101
        </text>

        <rect x="25" y="75" width="450" height="3" fill="#FF80AB" opacity="0.3">
          <animate
            attributeName="y"
            dur="3s"
            from="75"
            to="222"
            repeatCount="indefinite"
          />
        </rect>

        <g
          fontFamily="monospace, sans-serif"
          fontSize="32"
          fontWeight="900"
          letterSpacing="1.5"
        >
          <text x="200" y="150" fill="#00FFFF" opacity="0">
            <animate
              attributeName="opacity"
              values="0;0.8;0"
              dur="3s"
              begin="1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x"
              values="200; 203; 198; 200"
              dur="0.1s"
              begin="1s"
              repeatCount="indefinite"
            />
          </text>
          <text x="200" y="150" fill="#FF00FF" opacity="0">
            <animate
              attributeName="opacity"
              values="0;0.8;0"
              dur="2.5s"
              begin="0.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x"
              values="200; 197; 202; 200"
              dur="0.1s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </text>
        </g>
      </g>
    </svg>
  );
}

// Simplified cyberpunk border box component that exactly matches CyberpunkGridMenu
export function CyberpunkBorderBox({
  color = "#FF006E",
  secondaryColor = "#FF4081",
  accentColor = "#FF80AB",
}) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 105 65"
      preserveAspectRatio="none"
      style={{ position: "absolute" }}
    >
      <Defs>
        {/* Inner glow gradient for better text readability */}
        <RadialGradient id={`innerGlow-${color}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <Stop offset="70%" stopColor={color} stopOpacity="0.08" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </RadialGradient>

        {/* Drop shadow filter */}
        <Filter id={`shadow-${color}`}>
          <FeGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <FeOffset dx="0" dy="0" result="offsetblur" />
          <FeFlood floodColor={color} floodOpacity="0.5" />
          <FeComposite in2="offsetblur" operator="in" />
          <FeMerge>
            <FeMergeNode />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>

      <G>
        {/* Background exactly like cyberBorder in CyberpunkGridMenu */}
        <Rect
          x="3.5"
          y="3.5"
          width="98"
          height="58"
          rx="6"
          fill="rgba(0,0,0,0.98)"
        />

        {/* Inner glow layer for text readability */}
        <Rect
          x="3.5"
          y="3.5"
          width="98"
          height="58"
          rx="6"
          fill={`url(#innerGlow-${color})`}
        />

        {/* Background tint */}
        <Rect
          x="3.5"
          y="3.5"
          width="98"
          height="58"
          rx="6"
          fill={color}
          fillOpacity={0.08}
        />

        {/* Outer thin border - more spacing from main border, 1px width */}
        <Rect
          x="0"
          y="0"
          width="105"
          height="65"
          rx="8"
          fill="none"
          stroke={color}
          strokeOpacity={0.5}
          strokeWidth="1"
        />

        {/* Inner shadow for depth */}
        <Rect
          x="3.5"
          y="3.5"
          width="98"
          height="58"
          rx="6"
          fill="none"
          stroke="rgba(0,0,0,0.5)"
          strokeOpacity={0.8}
          strokeWidth="1"
        />

        {/* Main cyberBorder - with more gap from outer border */}
        <Rect
          x="3.5"
          y="3.5"
          width="98"
          height="58"
          rx="6"
          fill="none"
          stroke={color}
          strokeOpacity={0.8}
          strokeWidth="1.5"
          filter={`url(#shadow-${color})`}
        />

        {/* Corner accents - positioned inside from the new border */}
        {/* Top Left - vertical - primary */}
        <Rect x="4.5" y="4.5" width="2" height="12" fill={color} />
        {/* Top Right - horizontal - secondary */}
        <Rect x="88.5" y="4.5" width="12" height="2" fill={secondaryColor} />
        {/* Bottom Left - horizontal - secondary */}
        <Rect x="4.5" y="58.5" width="12" height="2" fill={secondaryColor} />
        {/* Bottom Right - vertical - primary */}
        <Rect x="98.5" y="48.5" width="2" height="12" fill={color} />
      </G>
    </Svg>
  );
}

// Animated Cyberpunk Border Box with multiple cool effects
export function AnimatedCyberpunkBorderBox({
  color = "#FF006E",
  secondaryColor = "#FF4081",
  accentColor = "#FF80AB",
  animationType = "pulse", // pulse, scan, glitch, rotate, matrix
}) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    switch (animationType) {
      case "pulse":
        // Pulsing glow effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: false,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: false,
            }),
          ]),
        ).start();
        break;

      case "scan":
        // Scanning line effect
        Animated.loop(
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
        ).start();
        break;

      case "glitch":
        // Random glitch effect with more intensity
        const glitchLoop = () => {
          const delay = 1000 + Math.random() * 2000; // Random delay between glitches
          Animated.sequence([
            Animated.timing(glitchAnim, {
              toValue: 0,
              duration: delay,
              useNativeDriver: false,
            }),
            Animated.timing(glitchAnim, {
              toValue: 1,
              duration: 30,
              useNativeDriver: false,
            }),
            Animated.timing(glitchAnim, {
              toValue: 0,
              duration: 20,
              useNativeDriver: false,
            }),
            Animated.timing(glitchAnim, {
              toValue: 0.8,
              duration: 40,
              useNativeDriver: false,
            }),
            Animated.timing(glitchAnim, {
              toValue: 0.3,
              duration: 20,
              useNativeDriver: false,
            }),
            Animated.timing(glitchAnim, {
              toValue: 1,
              duration: 30,
              useNativeDriver: false,
            }),
            Animated.timing(glitchAnim, {
              toValue: 0,
              duration: 50,
              useNativeDriver: false,
            }),
          ]).start(() => glitchLoop());
        };
        glitchLoop();
        break;

      case "rotate":
        // Rotating corner accents
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: false,
          }),
        ).start();
        break;
    }
  }, [animationType, pulseAnim, scanAnim, glitchAnim, rotateAnim]);

  const AnimatedRect = Animated.createAnimatedComponent(Rect);
  const AnimatedLine = Animated.createAnimatedComponent(Line);

  if (animationType === "pulse") {
    return (
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 105 65"
        preserveAspectRatio="none"
        style={{ position: "absolute" }}
      >
        <Defs>
          <LinearGradient
            id="pulseGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={color} stopOpacity="0" />
            <Stop offset="50%" stopColor={accentColor} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={secondaryColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <G>
          <Rect
            x="3.5"
            y="3.5"
            width="98"
            height="58"
            rx="6"
            fill="rgba(0,0,0,0.98)"
          />
          <Rect
            x="3.5"
            y="3.5"
            width="98"
            height="58"
            rx="6"
            fill={color}
            fillOpacity={0.08}
          />

          {/* Animated pulsing border */}
          <AnimatedRect
            x="0"
            y="0"
            width="105"
            height="65"
            rx="8"
            fill="none"
            stroke="url(#pulseGradient)"
            strokeWidth="2"
            strokeOpacity={pulseAnim}
          />

          <Rect
            x="3.5"
            y="3.5"
            width="98"
            height="58"
            rx="6"
            fill="none"
            stroke={color}
            strokeOpacity={0.8}
            strokeWidth="1.5"
          />

          {/* Animated corner accents */}
          <AnimatedRect
            x="4.5"
            y="4.5"
            width="2"
            height="12"
            fill={color}
            opacity={pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            })}
          />
          <AnimatedRect
            x="88.5"
            y="4.5"
            width="12"
            height="2"
            fill={secondaryColor}
            opacity={pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            })}
          />
          <AnimatedRect
            x="4.5"
            y="58.5"
            width="12"
            height="2"
            fill={secondaryColor}
            opacity={pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            })}
          />
          <AnimatedRect
            x="98.5"
            y="48.5"
            width="2"
            height="12"
            fill={color}
            opacity={pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            })}
          />
        </G>
      </Svg>
    );
  }

  if (animationType === "scan") {
    return (
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 105 65"
        preserveAspectRatio="none"
        style={{ position: "absolute" }}
      >
        <Defs>
          <LinearGradient id="scanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={accentColor} stopOpacity="0" />
            <Stop offset="50%" stopColor={accentColor} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <G>
          <Rect
            x="3.5"
            y="3.5"
            width="98"
            height="58"
            rx="6"
            fill="rgba(0,0,0,0.98)"
          />
          <Rect
            x="3.5"
            y="3.5"
            width="98"
            height="58"
            rx="6"
            fill={color}
            fillOpacity={0.08}
          />

          {/* Scanning overlay - removed to avoid gradient issues */}

          <Rect
            x="0"
            y="0"
            width="105"
            height="65"
            rx="8"
            fill="none"
            stroke={color}
            strokeOpacity={0.5}
            strokeWidth="1"
          />
          <Rect
            x="3.5"
            y="3.5"
            width="98"
            height="58"
            rx="6"
            fill="none"
            stroke={color}
            strokeOpacity={0.8}
            strokeWidth="1.5"
          />

          {/* Scanning line */}
          <AnimatedLine
            x1="3.5"
            x2="101.5"
            y1={scanAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [3.5, 61.5],
            })}
            y2={scanAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [3.5, 61.5],
            })}
            stroke={accentColor}
            strokeWidth="2"
            opacity="0.8"
          />

          <Rect x="4.5" y="4.5" width="2" height="12" fill={color} />
          <Rect x="88.5" y="4.5" width="12" height="2" fill={secondaryColor} />
          <Rect x="4.5" y="58.5" width="12" height="2" fill={secondaryColor} />
          <Rect x="98.5" y="48.5" width="2" height="12" fill={color} />
        </G>
      </Svg>
    );
  }

  if (animationType === "glitch") {
    return (
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 105 65"
        preserveAspectRatio="none"
        style={{ position: "absolute" }}
      >
        <G>
          <Rect
            x="3.5"
            y="3.5"
            width="98"
            height="58"
            rx="6"
            fill="rgba(0,0,0,0.98)"
          />
          <Rect
            x="3.5"
            y="3.5"
            width="98"
            height="58"
            rx="6"
            fill={color}
            fillOpacity={0.08}
          />

          {/* Multiple glitched borders for more dramatic effect */}
          <AnimatedRect
            x={glitchAnim.interpolate({
              inputRange: [0, 0.3, 0.5, 0.8, 1],
              outputRange: [0, -3, 2, -1, 4],
            })}
            y={glitchAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 1, -1],
            })}
            width="105"
            height="65"
            rx="8"
            fill="none"
            stroke="#00FFFF"
            strokeOpacity={glitchAnim}
            strokeWidth="1"
          />

          <AnimatedRect
            x={glitchAnim.interpolate({
              inputRange: [0, 0.3, 0.5, 0.8, 1],
              outputRange: [3.5, 5.5, 1.5, 4.5, 2.5],
            })}
            y={glitchAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [3.5, 2.5, 4.5],
            })}
            width="98"
            height="58"
            rx="6"
            fill="none"
            stroke="#FF00FF"
            strokeOpacity={glitchAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.8, 0.6],
            })}
            strokeWidth="1.5"
          />

          {/* Additional glitch layer */}
          <AnimatedRect
            x={glitchAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [3.5, 2, 5],
            })}
            y="3.5"
            width="98"
            height="58"
            rx="6"
            fill="none"
            stroke="#FFFF00"
            strokeOpacity={glitchAnim.interpolate({
              inputRange: [0, 0.3, 0.8, 1],
              outputRange: [0, 0.5, 0.3, 0],
            })}
            strokeWidth="1"
          />

          <Rect
            x="0"
            y="0"
            width="105"
            height="65"
            rx="8"
            fill="none"
            stroke={color}
            strokeOpacity={0.5}
            strokeWidth="1"
          />
          <Rect
            x="3.5"
            y="3.5"
            width="98"
            height="58"
            rx="6"
            fill="none"
            stroke={color}
            strokeOpacity={0.8}
            strokeWidth="1.5"
          />

          {/* Glitched corner accents */}
          <AnimatedRect
            x="4.5"
            y={glitchAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [4.5, 3.5, 5.5],
            })}
            width="2"
            height="12"
            fill={glitchAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [color, "#00FFFF", "#FF00FF"],
            })}
          />
          <Rect x="88.5" y="4.5" width="12" height="2" fill={secondaryColor} />
          <Rect x="4.5" y="58.5" width="12" height="2" fill={secondaryColor} />
          <Rect x="98.5" y="48.5" width="2" height="12" fill={color} />
        </G>
      </Svg>
    );
  }

  // Default static version
  return (
    <CyberpunkBorderBox
      color={color}
      secondaryColor={secondaryColor}
      accentColor={accentColor}
    />
  );
}

// React Native compatible version of ReactQueryButton - now uses the border box
export function ReactQueryButtonNative() {
  return (
    <View style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Border box SVG */}
      <CyberpunkBorderBox color="#FF006E" secondaryColor="#FF4081" />

      {/* Content inside the border */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 6,
          height: "100%",
        }}
      >
        {/* TanStack logo */}
        <View style={{ width: 18, height: 18, marginRight: 6 }}>
          <TanstackLogo />
        </View>

        {/* Text labels */}
        <View>
          <RNText
            style={{
              fontSize: 11,
              fontWeight: "900",
              letterSpacing: 1.5,
              fontFamily: "monospace",
              color: "#FF006E",
            }}
          >
            QUERY
          </RNText>
          <RNText
            style={{
              fontSize: 8,
              fontWeight: "600",
              letterSpacing: 1,
              fontFamily: "monospace",
              color: "#FF80AB",
              opacity: 0.7,
              marginTop: -2,
            }}
          >
            DATABASE
          </RNText>
        </View>
      </View>

      {/* Data stream text */}
      <RNText
        style={{
          position: "absolute",
          bottom: 2,
          right: 4,
          fontSize: 6,
          fontFamily: "monospace",
          color: "#FF006E",
          opacity: 0.4,
        }}
      >
        010101
      </RNText>
    </View>
  );
}
// Cyber punk button outline
export function CyberpunkButtonOutline() {
  return (
    <Svg viewBox="0 0 280 80">
      <Defs></Defs>
      <Path
        d="M 15 5 L 250 5 L 270 25 L 270 55 L 255 70 L 25 70 L 10 55 L 10 25 Z"
        fill="none"
        stroke="#00ff88"
        strokeWidth={2}
        filter="url(#neonGlow)"
      />
      <Path
        d="M 18 8 L 247 8 L 267 28 L 267 52 L 252 67 L 28 67 L 13 52 L 13 28 Z"
        fill="none"
        stroke="#00ff88"
        strokeWidth={1}
        opacity={0.6}
      />
      <G stroke="#00ffff" strokeWidth={1} fill="none" filter="url(#outerGlow)">
        <Line x1={250} y1={5} x2={245} y2={10} />
        <Line x1={250} y1={5} x2={255} y2={10} />
        <Line x1={270} y1={25} x2={265} y2={20} />
        <Line x1={270} y1={25} x2={265} y2={30} />
      </G>
      <G stroke="#00ffff" strokeWidth={1} fill="none" filter="url(#outerGlow)">
        <Line x1={270} y1={55} x2={265} y2={50} />
        <Line x1={270} y1={55} x2={265} y2={60} />
        <Line x1={255} y1={70} x2={260} y2={65} />
        <Line x1={255} y1={70} x2={250} y2={65} />
      </G>
      <G stroke="#00ffff" strokeWidth={1} fill="none" filter="url(#outerGlow)">
        <Line x1={25} y1={70} x2={30} y2={65} />
        <Line x1={25} y1={70} x2={20} y2={65} />
        <Line x1={10} y1={55} x2={15} y2={60} />
        <Line x1={10} y1={55} x2={15} y2={50} />
      </G>
      <G stroke="#00ffff" strokeWidth={1} fill="none" filter="url(#outerGlow)">
        <Line x1={10} y1={25} x2={15} y2={30} />
        <Line x1={10} y1={25} x2={15} y2={20} />
        <Line x1={15} y1={5} x2={20} y2={10} />
        <Line x1={15} y1={5} x2={25} y2={10} />
      </G>
      <Rect x={80} y={2} width={20} height={1} fill="#00ffff" opacity={0.8} />
      <Rect x={105} y={2} width={8} height={1} fill="#00ffff" opacity={0.6} />
      <Rect x={118} y={2} width={15} height={1} fill="#00ffff" opacity={0.8} />
      <Rect x={180} y={77} width={25} height={1} fill="#00ffff" opacity={0.8} />
      <Rect x={210} y={77} width={12} height={1} fill="#00ffff" opacity={0.6} />
      <Rect x={227} y={77} width={18} height={1} fill="#00ffff" opacity={0.8} />
      <Circle cx={6} cy={25} r={1.5} fill="#ff0080" opacity={0.9} />
      <Circle cx={6} cy={40} r={1} fill="#00ffff" opacity={0.7} />
      <Circle cx={6} cy={55} r={1.5} fill="#ff0080" opacity={0.9} />
      <Rect x={273} y={30} width={2} height={4} fill="#ff0080" opacity={0.9} />
      <Rect x={273} y={38} width={2} height={2} fill="#00ffff" opacity={0.7} />
      <Rect x={273} y={44} width={2} height={6} fill="#ff0080" opacity={0.9} />
      <Polygon
        points="140,1 145,6 140,11 135,6"
        fill="none"
        stroke="#ff0080"
        strokeWidth={1}
        opacity={0.8}
        filter="url(#outerGlow)"
      />
    </Svg>
  );
}
// Modal header cyber punk
export function ModalHeaderCyberpunk() {
  return (
    <Svg viewBox="0 0 375 60">
      <Defs>
        <Pattern
          id="gridPattern"
          x={0}
          y={0}
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
        >
          <Path
            d="M 8 0 L 0 0 0 8"
            fill="none"
            stroke="#333333"
            strokeWidth={0.5}
            opacity={0.3}
          />
        </Pattern>
      </Defs>
      <Path
        d="M 15 0 L 360 0 L 375 15 L 375 60 L 0 60 L 0 15 Z"
        fill="#1A1A1A"
        fillOpacity={0.9}
      />
      <Path
        d="M 15 0 L 360 0 L 375 15 L 375 60 L 0 60 L 0 15 Z"
        fill="url(#gridPattern)"
      />
      <Path
        d="M 15 0 L 360 0 L 375 15"
        fill="none"
        stroke="#00BFFF"
        strokeWidth={1}
        filter="url(#electricGlow)"
      />
      <Rect
        x={167.5}
        y={8}
        width={40}
        height={6}
        rx={3}
        ry={3}
        fill="#000000"
        opacity={0.8}
      />
      <Rect
        x={167.5}
        y={8}
        width={40}
        height={6}
        rx={3}
        ry={3}
        fill="none"
        stroke="#00BFFF"
        strokeWidth={0.5}
        opacity={0.6}
      />
      <Text
        x={125}
        y={16}
        fontFamily="'Courier New', monospace"
        fontSize={8}
        fill="#00BFFF"
        opacity={0.8}
      >
        {"ID: //"}
      </Text>
      <Text
        x={230}
        y={16}
        fontFamily="'Courier New', monospace"
        fontSize={8}
        fill="#00BFFF"
        opacity={0.8}
      >
        {"STAT: OK"}
      </Text>
      <Text
        x={25}
        y={20}
        fontFamily="'Arial', sans-serif"
        fontSize={10}
        fontWeight="bold"
        letterSpacing="1px"
        fill="#FFFFFF"
        opacity={0.9}
      >
        {"// SECURE_ACCESS"}
      </Text>
      <Rect x={5} y={20} width={2} height={8} fill="#00BFFF" opacity={0.6} />
      <Rect x={8} y={22} width={4} height={2} fill="#00BFFF" opacity={0.4} />
      <Rect x={368} y={20} width={2} height={8} fill="#00BFFF" opacity={0.6} />
      <Rect x={363} y={22} width={4} height={2} fill="#00BFFF" opacity={0.4} />
      <Circle cx={20} cy={35} r={1.5} fill="#00FF88" opacity={0.8} />
      <Circle cx={25} cy={35} r={1} fill="#00BFFF" opacity={0.6} />
      <Circle cx={30} cy={35} r={1} fill="#FF4444" opacity={0.5} />
      <Line
        x1={50}
        y1={50}
        x2={90}
        y2={50}
        stroke="#00BFFF"
        strokeWidth={0.5}
        opacity={0.4}
      />
      <Line
        x1={285}
        y1={50}
        x2={325}
        y2={50}
        stroke="#00BFFF"
        strokeWidth={0.5}
        opacity={0.4}
      />
      <Text
        x={340}
        y={45}
        fontFamily="'Courier New', monospace"
        fontSize={6}
        fill="#00BFFF"
        opacity={0.5}
      >
        {"v2.7.1"}
      </Text>
    </Svg>
  );
}
