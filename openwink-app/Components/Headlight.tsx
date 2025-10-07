import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Pattern, Polygon, Rect, Stop } from 'react-native-svg';
import { useColorTheme } from '../hooks/useColorTheme';
import { useBleMonitor } from '../Providers/BleMonitorProvider';

// Shared coordinate points where shapes join
const HEADLIGHT_COORDS = {
  // Left edge points
  leftTop: { x: 0, y: 8 },
  leftMid: { x: 0, y: 52 },
  leftBottom: { x: 5, y: 98 },
  leftBottomPanel: { x: 5, y: 103 },
  
  // Right edge points
  rightTop: { x: 100, y: 6 },
  rightTopClosed: { x: 110, y: 50 },
  rightMid: { x: 110, y: 62 },
  rightBottom: { x: 100, y: 97 },
  rightBottomPanel: { x: 100, y: 102 },
  
  // Inner junction points
  innerBottom: { x: 20, y: 96 },
  innerBottomPanel: { x: 20, y: 101 },
  
  // Fully open top positions
  topLeftOpen: { x: 0, y: 8 },
  topRightOpen: { x: 110, y: 0 },
  
  // Glow center
  glowCenter: { x: 51, y: 53 },
  glowCenterClosed: { y: 140 },
} as const;

interface IHeadlightGlowProps {
  cx: number;
  cy: number;
  clipPathId: string;
  showGrid?: boolean;
}

const HeadlightGlow = ({ cx, cy, clipPathId }: IHeadlightGlowProps) => (
  <>
    <Defs>
      <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ffff00" />
        <Stop offset="100%" stopColor="#ffcc00" />
      </LinearGradient>
      {/* Grid pattern for lens texture */}
      <Pattern id="lensGrid" patternUnits="userSpaceOnUse" width="8" height="8">
        <Rect width="8" height="8" fill="transparent" />
        <Line x1="0" y1="0" x2="8" y2="0" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
        <Line x1="0" y1="0" x2="0" y2="8" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
      </Pattern>
      <ClipPath id="bottomPanelClip">
        <Polygon points={`${HEADLIGHT_COORDS.leftBottomPanel.x},0 ${HEADLIGHT_COORDS.innerBottomPanel.x},0 ${HEADLIGHT_COORDS.rightTop.x},0 ${HEADLIGHT_COORDS.rightTop.x},${HEADLIGHT_COORDS.rightBottomPanel.y} ${HEADLIGHT_COORDS.innerBottomPanel.x},${HEADLIGHT_COORDS.innerBottomPanel.y} ${HEADLIGHT_COORDS.leftBottomPanel.x},${HEADLIGHT_COORDS.leftBottomPanel.y}`} />
      </ClipPath>
    </Defs>
    {/* Outer glow */}
    <Circle cx={cx} cy={cy} r="45" fill="#ffff99" stroke="#ffff99" strokeWidth="2" opacity="0.2" clipPath={`url(#bottomPanelClip)`} />
    {/* Headlight glow */}
    <Circle cx={cx} cy={cy} r="40" fill="url(#grad)" stroke="#C0C0C0" strokeWidth="4" clipPath={`url(#${clipPathId})`} />
    {/* Lens texture grid */}
    <Rect x={cx - 20} y={cy - 20} width="40" height="40" fill="url(#lensGrid)" clipPath={`url(#${clipPathId})`} />
    {/* Inner glow highlight */}
    <Circle cx={cx} cy={cy} r="20" fill="#ffffff" opacity="0.5" clipPath={`url(#${clipPathId})`} />
    {/* Center highlight */}
    <Circle cx={cx} cy={cy} r="5" fill="#ffffff" opacity="0.8" clipPath={`url(#${clipPathId})`} />
  </>
);

const PercentHeadlight = ({ percent = 0, mirrored = false, themeColor = '#ffffff', scale = 1 }) => {
  // Clamp percent between 0 and 100
  const clampedPercent = Math.max(0, Math.min(100, percent));

  const position = (start: number, stop: number, percent: number) => start - (percent / 100) * (start - stop);
  
  // Animation values for top panel (50-100%)
  const topLeftY = (percent: number) => position(HEADLIGHT_COORDS.leftMid.y, HEADLIGHT_COORDS.topLeftOpen.y, percent);
  const topRightX = (percent: number) => position(HEADLIGHT_COORDS.rightTopClosed.x, HEADLIGHT_COORDS.rightTop.x, percent);
  const topRightY = (percent: number) => position(HEADLIGHT_COORDS.rightTopClosed.y, HEADLIGHT_COORDS.topRightOpen.y, percent);
  
  return (
    <Svg 
      height="120"
      width="140"
      // style={mirrored ? { transform: [{ scaleX: -1 }] } : undefined}
      style={mirrored ? { transform: [{ scaleX: -1 }, { scale: scale }] } : { transform: [{ scale: scale }] }}
    >
      <Defs>
        <ClipPath id={"lightClip"}>
          <Polygon points={`${HEADLIGHT_COORDS.leftTop.x},${HEADLIGHT_COORDS.leftTop.y} ${HEADLIGHT_COORDS.rightTop.x},${HEADLIGHT_COORDS.rightTop.y} ${HEADLIGHT_COORDS.rightMid.x},${HEADLIGHT_COORDS.rightMid.y} ${HEADLIGHT_COORDS.rightBottom.x},${HEADLIGHT_COORDS.rightBottom.y} ${HEADLIGHT_COORDS.innerBottom.x},${HEADLIGHT_COORDS.innerBottom.y} ${HEADLIGHT_COORDS.leftBottom.x},${HEADLIGHT_COORDS.leftBottom.y}`} />
        </ClipPath>
      </Defs>
      {/* Upper headlight body */}
      {clampedPercent >= 50 && (() => {
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
        points={`${HEADLIGHT_COORDS.leftTop.x},${HEADLIGHT_COORDS.leftMid.y} ${HEADLIGHT_COORDS.rightTopClosed.x},${HEADLIGHT_COORDS.rightTopClosed.y} ${HEADLIGHT_COORDS.rightMid.x},${HEADLIGHT_COORDS.rightMid.y} ${HEADLIGHT_COORDS.rightBottom.x},${HEADLIGHT_COORDS.rightBottom.y} ${HEADLIGHT_COORDS.innerBottom.x},${HEADLIGHT_COORDS.innerBottom.y} ${HEADLIGHT_COORDS.leftBottom.x},${HEADLIGHT_COORDS.leftBottom.y}`}
        fill="#000000"
        stroke="#000000"
        strokeWidth="2"
      />

      <HeadlightGlow 
        cx={HEADLIGHT_COORDS.glowCenter.x} 
        cy={position(HEADLIGHT_COORDS.glowCenterClosed.y, HEADLIGHT_COORDS.glowCenter.y, clampedPercent)} 
        clipPathId="lightClip" 
      />

      {/* Top panel line */}
      {clampedPercent >= 50 && (() => {
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
      {/* Bottom panel line */}
      <Polygon
        points={`${HEADLIGHT_COORDS.leftBottomPanel.x},${HEADLIGHT_COORDS.leftBottomPanel.y} ${HEADLIGHT_COORDS.innerBottomPanel.x},${HEADLIGHT_COORDS.innerBottomPanel.y} ${HEADLIGHT_COORDS.rightBottomPanel.x},${HEADLIGHT_COORDS.rightBottomPanel.y} ${HEADLIGHT_COORDS.rightBottom.x},${HEADLIGHT_COORDS.rightBottom.y} ${HEADLIGHT_COORDS.innerBottom.x},${HEADLIGHT_COORDS.innerBottom.y} ${HEADLIGHT_COORDS.leftBottom.x},${HEADLIGHT_COORDS.leftBottom.y}`}
        fill={themeColor}
        stroke="#000000"
        strokeWidth="2"
      />
      
      {/* Headlight cover */}
      {clampedPercent < 50 && (() => {
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

const BodyHalf = () => (
  <>
    <Defs>
      <ClipPath id="bodyClip">
        <Polygon points={`0,0 248,0 248,164 0,164`} />
      </ClipPath>
    </Defs>
    {/* Windshield */}
    <Path
      d={"M0,0 C 0,0 69,0 69,10 L 87,43 C 87,43 124,43 0,39 Z"}
      fill="url(#bumperGrad)"
      stroke="#000000"
      strokeWidth="0"
      clipPath="url(#bodyClip)"
    />

    {/* Bonnet */}
    <Path
      d={"M0,39 C 0,39 87,43 87,43 C 87,43 100,72 100,72 C 100,72 0,70 0,70 Z"}
      fill="url(#bumperGrad)"
      stroke="#000000"
      strokeWidth="0"
      clipPath="url(#bodyClip)"
    />

    {/* Top Bumper */}
    <Path
      d={"M0,70 C 0,70 100,72 100,72 C 100,72 118,97 118,97 C 118,97 0,101 0,101 Z"}
      fill="url(#bumperGrad)"
      stroke="#000000"
      strokeWidth="0"
      clipPath="url(#bodyClip)"
    />

    {/* Bottom Bumper */}
    <Path
      d={"M0,101 C 0,101 118,97 121,95 C 121,95 108,134 108,134 C 108,134 0,143 0,143 Z"}
      fill="url(#bumperGrad)"
      stroke="#000000"
      strokeWidth="0"
      clipPath="url(#bodyClip)"
    />

    {/* Lower Lip */}
    <Path
      d={"M0,143 C 0,143 110,134 110,134 C 110,134 0,152 0,152 Z"}
      fill="url(#bumperGrad)"
      stroke="#000000"
      strokeWidth="0"
      clipPath="url(#bodyClip)"
    />

    {/* Fender */}
    <Path
      d={"M87,43 C 87,43 108,52 108,52 C 108,52 122,70 122,70 C 122,70 118,97 118,97 C 118,97 100,72 100,72 Z"}
      fill="url(#bumperGrad)"
      stroke="#000000"
      strokeWidth="0"
      clipPath="url(#bodyClip)"
    />
  </>
);

const Miata = ({ themeColor = '#ffffff' }) => {
  return (
    <Svg height="164" width="248" viewBox="0 0 248 164" style={{ transform: [{ scale: 1 }] }}>
      <Defs>
        <LinearGradient id="bumperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={themeColor} stopOpacity="0.9" />
          <Stop offset="50%" stopColor={themeColor} stopOpacity="0.7" />
          <Stop offset="100%" stopColor={themeColor} stopOpacity="0.5" />
        </LinearGradient>
      </Defs>

      {/* Left side (mirrored) */}
      <G id="leftSide" transform="scale(-1,1) translate(-124,0)">
        <BodyHalf />
      </G>

      {/* Right side */}
      <G id="rightSide" transform="translate(124,0)">
        <BodyHalf />
      </G>
    </Svg>
  );
};

export default function MiataHeadlights() {
  const { colorTheme } = useColorTheme();
  const { leftStatus, rightStatus } = useBleMonitor();

  const statusToPercent = (headlightStatus: number) => {
    if (headlightStatus === 0) return 0; // Closed
    if (headlightStatus === 1) return 100; // Open
    return (headlightStatus * 100); // Partially open
  };

  return (
    <View style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      marginVertical: 0,
      width: '100%'
    }}>
      <Miata themeColor={colorTheme.primary} />
      {/* Headlights */}
      <View style={{
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 42,
        paddingBottom: 47,
        width: '100%',
        maxWidth: 380,
      }}>
        <PercentHeadlight percent={statusToPercent(leftStatus)} themeColor={colorTheme.primary} scale={0.3} />
        <PercentHeadlight percent={statusToPercent(rightStatus)} themeColor={colorTheme.primary} mirrored={true} scale={0.3} />
      </View>
    </View>
  );
}