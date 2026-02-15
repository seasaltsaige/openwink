import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  LinearGradient,
  Pattern,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";
import { HEADLIGHT_COORDS } from "./constants";

const Glow = ({
  cx,
  cy,
  clipPathId,
}: {
  cx: number;
  cy: number;
  clipPathId: string;
}) => (
  <G>
    <Defs>
      <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ffff00" />
        <Stop offset="100%" stopColor="#ffcc00" />
      </LinearGradient>
      {/* Grid pattern for lens texture */}
      <Pattern id="lensGrid" patternUnits="userSpaceOnUse" width="8" height="8">
        <Rect width="8" height="8" fill="transparent" />
        <Line
          x1="0"
          y1="0"
          x2="8"
          y2="0"
          stroke="#ffffff"
          strokeWidth="0.8"
          opacity="0.8"
        />
        <Line
          x1="0"
          y1="0"
          x2="0"
          y2="8"
          stroke="#ffffff"
          strokeWidth="0.8"
          opacity="0.8"
        />
      </Pattern>
      <ClipPath id="bottomPanelClip">
        <Polygon
          points={`
            ${HEADLIGHT_COORDS.leftBottomPanel.x},0
            ${HEADLIGHT_COORDS.innerBottomPanel.x},0
            ${HEADLIGHT_COORDS.rightTop.x},0
            ${HEADLIGHT_COORDS.rightTop.x},${HEADLIGHT_COORDS.rightBottomPanel.y}
            ${HEADLIGHT_COORDS.innerBottomPanel.x},${HEADLIGHT_COORDS.innerBottomPanel.y}
            ${HEADLIGHT_COORDS.leftBottomPanel.x},${HEADLIGHT_COORDS.leftBottomPanel.y}
          `}
        />
      </ClipPath>
    </Defs>
    {/* Outer glow */}
    <Circle
      cx={cx}
      cy={cy}
      r="45"
      fill="#ffff99"
      stroke="#ffff99"
      strokeWidth="2"
      opacity="0.2"
      clipPath={`url(#bottomPanelClip)`}
    />
    {/* Headlight glow */}
    <Circle
      cx={cx}
      cy={cy}
      r="40"
      fill="url(#grad)"
      stroke="#C0C0C0"
      strokeWidth="4"
      clipPath={`url(#${clipPathId})`}
    />
    {/* Lens texture grid */}
    <Rect
      x={cx - 20}
      y={cy - 20}
      width="40"
      height="40"
      fill="url(#lensGrid)"
      clipPath={`url(#${clipPathId})`}
    />
    {/* Inner glow highlight */}
    <Circle
      cx={cx}
      cy={cy}
      r="20"
      fill="#ffffff"
      opacity="0.5"
      clipPath={`url(#${clipPathId})`}
    />
    {/* Center highlight */}
    <Circle
      cx={cx}
      cy={cy}
      r="5"
      fill="#ffffff"
      opacity="0.8"
      clipPath={`url(#${clipPathId})`}
    />
  </G>
);

export const Headlight = ({
  percent = 0,
  mirrored = false,
  themeColor = "#ffffff",
  scale = 1,
}) => {
  // Clamp percent between 0 and 100
  const clampedPercent = Math.max(0, Math.min(100, percent));

  // const scaledScale = scale / 0.30;

  const position = (start: number, stop: number, percent: number) =>
    start - (percent / 100) * (start - stop);

  // Animation values for top panel (50-100%)
  const topLeftY = (percent: number) =>
    position(
      HEADLIGHT_COORDS.leftMid.y,
      HEADLIGHT_COORDS.topLeftOpen.y,
      percent,
    );
  const topRightX = (percent: number) =>
    position(
      HEADLIGHT_COORDS.rightTopClosed.x,
      HEADLIGHT_COORDS.rightTop.x,
      percent,
    );
  const topRightY = (percent: number) =>
    position(
      HEADLIGHT_COORDS.rightTopClosed.y,
      HEADLIGHT_COORDS.topRightOpen.y,
      percent,
    );

  return (
    <Svg
      // height={`${120 * scaledScale}`}
      // width={`${140 * scaledScale}`}
      height={120}
      width={140}
      style={
        mirrored ?
          { transform: [{ scaleX: -1 }, { scale: scale }] }
          : { transform: [{ scale: scale }] }
      }
    >
      <Defs>
        <ClipPath id={"lightClip"}>
          <Polygon
            points={`
              ${HEADLIGHT_COORDS.leftTop.x},${HEADLIGHT_COORDS.leftTop.y}
              ${HEADLIGHT_COORDS.rightTop.x},${HEADLIGHT_COORDS.rightTop.y}
              ${HEADLIGHT_COORDS.rightMid.x},${HEADLIGHT_COORDS.rightMid.y}
              ${HEADLIGHT_COORDS.rightBottom.x},${HEADLIGHT_COORDS.rightBottom.y}
              ${HEADLIGHT_COORDS.innerBottom.x},${HEADLIGHT_COORDS.innerBottom.y}
              ${HEADLIGHT_COORDS.leftBottom.x},${HEADLIGHT_COORDS.leftBottom.y}
            `}
          />
        </ClipPath>
      </Defs>
      {/* Upper headlight body */}
      {clampedPercent >= 50
        && (() => {
          const percentForTop = (clampedPercent - 50) * 2;
          return (
            <Polygon
              points={`
                ${HEADLIGHT_COORDS.leftTop.x},${topLeftY(percentForTop)}
                ${topRightX(percentForTop)},${topRightY(percentForTop) + 5}
                ${HEADLIGHT_COORDS.rightMid.x},${HEADLIGHT_COORDS.rightMid.y}
                ${HEADLIGHT_COORDS.rightBottom.x},${HEADLIGHT_COORDS.rightBottom.y}
                ${HEADLIGHT_COORDS.innerBottom.x},${HEADLIGHT_COORDS.innerBottom.y}
                ${HEADLIGHT_COORDS.leftTop.x},${HEADLIGHT_COORDS.leftMid.y}
              `}
              fill="#000000"
              stroke="#000000"
              strokeWidth="2"
            />
          );
        })()}

      {/* Lower headlight body */}
      <Polygon
        points={`
          ${HEADLIGHT_COORDS.leftTop.x},${HEADLIGHT_COORDS.leftMid.y}
          ${HEADLIGHT_COORDS.rightTopClosed.x},${HEADLIGHT_COORDS.rightTopClosed.y}
          ${HEADLIGHT_COORDS.rightMid.x},${HEADLIGHT_COORDS.rightMid.y}
          ${HEADLIGHT_COORDS.rightBottom.x},${HEADLIGHT_COORDS.rightBottom.y}
          ${HEADLIGHT_COORDS.innerBottom.x},${HEADLIGHT_COORDS.innerBottom.y}
          ${HEADLIGHT_COORDS.leftBottom.x},${HEADLIGHT_COORDS.leftBottom.y}
        `}
        fill="#000000"
        stroke="#000000"
        strokeWidth="2"
      />

      <Glow
        cx={HEADLIGHT_COORDS.glowCenter.x}
        cy={position(
          HEADLIGHT_COORDS.glowCenterClosed.y,
          HEADLIGHT_COORDS.glowCenter.y,
          clampedPercent,
        )}
        clipPathId="lightClip"
      />

      {/* Top panel line */}
      {clampedPercent >= 50
        && (() => {
          const percentForTop = (clampedPercent - 50) * 2;
          return (
            <Polygon
              points={`
              ${HEADLIGHT_COORDS.leftTop.x},${topLeftY(percentForTop) - 6}
              ${topRightX(percentForTop)},${topRightY(percentForTop) - 1}
              ${topRightX(percentForTop)},${topRightY(percentForTop) + 5}
              ${HEADLIGHT_COORDS.leftTop.x},${topLeftY(percentForTop)}
            `}
              fill={themeColor}
              stroke="#000000"
              strokeWidth="2"
            />
          );
        })()}

      {/* Headlight cover */}
      {clampedPercent < 50
        && (() => {
          const percentForCover = clampedPercent * 2; // 0-50% maps to 0-100%
          return (
            <Polygon
              points={`
                ${HEADLIGHT_COORDS.leftTop.x},${position(HEADLIGHT_COORDS.leftMid.y, HEADLIGHT_COORDS.leftMid.y, percentForCover)}
                ${HEADLIGHT_COORDS.rightTopClosed.x},${position(HEADLIGHT_COORDS.rightTopClosed.y, HEADLIGHT_COORDS.rightTopClosed.y, percentForCover)}
                ${HEADLIGHT_COORDS.rightBottom.x},${position(HEADLIGHT_COORDS.rightBottom.y, HEADLIGHT_COORDS.rightTopClosed.y, percentForCover)}
                ${HEADLIGHT_COORDS.innerBottom.x},${position(HEADLIGHT_COORDS.innerBottom.y, HEADLIGHT_COORDS.rightTopClosed.y, percentForCover)}
                ${HEADLIGHT_COORDS.leftBottom.x},${position(HEADLIGHT_COORDS.leftBottom.y, HEADLIGHT_COORDS.leftMid.y, percentForCover)}
              `}
              fill={themeColor}
              stroke="#000000"
              strokeWidth="2"
            />
          );
        })()}
    </Svg>
  );
};
