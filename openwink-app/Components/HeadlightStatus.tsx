import { Text, View, ViewStyle } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import { useBleMonitor } from "../Providers/BleMonitorProvider";
import { useBleConnection } from "../Providers/BleConnectionProvider";

interface IHeadlightStatusProps {
  style?: ViewStyle;
}

export function HeadlightStatus({ style }: IHeadlightStatusProps) {
  const { theme } = useColorTheme();
  const { leftStatus, rightStatus } = useBleMonitor();
  const {
    isConnected
  } = useBleConnection();

  if (!isConnected) {
    return (
      <View style={[theme.headlightStatusContainer, style]}>
        <Text style={theme.headlightStatusText}>
          Not Connected
        </Text>
      </View>
    );
  }

  return (
    <View style={[theme.headlightStatusContainer, style]}>
      {
        ([
          ["Left", leftStatus],
          ["Right", rightStatus]
        ] as const).map(([label, status], i) => (
          <View
            key={i}
            style={theme.headlightStatusSideContainer}
          >
            {/* HEADLIGHT STATUS TEXT */}
            <Text style={theme.headlightStatusText}>
              {label}: {status === 0 ? "Down" : status === 1 ? "Up" : `${(status * 100).toFixed(0)}%`}
            </Text>

            {/* HEADLIGHT STATUS BAR */}
            <View style={theme.headlightStatusBarUnderlay}>
              <View style={[theme.headlightStatusBarOverlay, { width: `${status * 100}%` }]} />
            </View>
          </View>
        ))
      }
    </View>
  );
}