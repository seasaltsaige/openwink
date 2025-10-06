import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Line, LinearGradient, Pattern, Polygon, Rect, Stop } from 'react-native-svg';
import { useColorTheme } from '../hooks/useColorTheme';
import { useBleMonitor } from '../Providers/BleMonitorProvider';

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
        <Polygon points="5,0 20,0 110,0 110,97 20,96 5,98" />
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

const PercentHeadlight = ({ percent = 0, mirrored = false, themeColor = '#ffffff' }) => {
  // Clamp percent between 0 and 100
  const clampedPercent = Math.max(0, Math.min(100, percent));

  const position = (start: number, stop: number, percent: number) => start - (percent / 100) * (start - stop);
  return (
    <Svg 
      height="100"
      width="140"
      style={mirrored ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      <Defs>
        <ClipPath id={"lightClip"}>
          <Polygon points="0,7 110,5 120,50 110,92 20,91 5,93" />
        </ClipPath>
      </Defs>
      {/* Top panel line */}
      {clampedPercent >= 50 && (() => {
        const percentForTop = (clampedPercent - 50) * 2;
        return (
          <Polygon
            points={`
              0,${position(42, 2, percentForTop)}
              ${position(120, 110, percentForTop)},${position(40, 0, percentForTop)}
              ${position(120, 110, percentForTop)},${position(45, 5, percentForTop)}
              0,${position(47, 7, percentForTop)}
            `}
            fill={themeColor}
            stroke="#000000"
            strokeWidth="2"
          />
        );
      })()}
      {/* Upper headlight body */}
      {clampedPercent >= 50 && (() => {
        const percentForTop = (clampedPercent - 50) * 2;
        return (
          <Polygon
            points={`
              0,${position(47, 7, percentForTop)}
              ${position(120, 110, percentForTop)},${position(45, 5, percentForTop)}
              120,50
              110,92
              20,91
              0,47
            `}
            fill="#000000"
            stroke="#000000"
            strokeWidth="2"
          />
        );
      })()}

      {/* Lower headlight body */}
      <Polygon
        points="0,47 120,45 120,50 110,92 20,91 5,93"
        fill="#000000"
        stroke="#000000"
        strokeWidth="2"
      />
      <HeadlightGlow cx={57} cy={position(135, 50, clampedPercent)} clipPathId="lightClip" />
      
      {/* Headlight cover */}
      {clampedPercent < 50 && (() => {
        const percentForCover = clampedPercent * 2; // 0-50% maps to 0-100%
        return (
          <Polygon
            points={`
              0,${position(47, 47, percentForCover)}
              120,${position(45, 45, percentForCover)}
              110,${position(92, 45, percentForCover)}
              20,${position(91, 45, percentForCover)}
              5,${position(93, 47, percentForCover)}
            `}
            fill={themeColor}
            stroke="#000000"
            strokeWidth="2"
          />
        );
      })()}
      
      {/* Bottom panel line */}
      <Polygon
        points="5,98 20,96 110,97 110,92 20,91 5,93"
        fill={themeColor}
        stroke="#000000"
        strokeWidth="2"
      />
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
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      marginVertical: 20,
      paddingHorizontal: 20,
      width: '100%'
    }}>
      <PercentHeadlight percent={statusToPercent(leftStatus)} themeColor={colorTheme.primary} />
      <PercentHeadlight percent={statusToPercent(rightStatus)} themeColor={colorTheme.primary} mirrored={true} />
    </View>
  );
}
