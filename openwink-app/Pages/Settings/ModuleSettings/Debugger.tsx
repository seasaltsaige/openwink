import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import IonIcons from "@expo/vector-icons/Ionicons";
import ToggleSwitch from "toggle-switch-react-native";
import Tooltip from "react-native-walkthrough-tooltip";
import Toast from "react-native-toast-message";
import * as FileSystem from "expo-file-system";
import * as FileSharing from "expo-sharing";

import { HeaderWithBackButton, SearchBarFilter, SettingsToolbar, TooltipHeader } from "../../../Components";
import { DebugLevel, DebugLevelLabels } from "../../../helper/Constants";
import { DebugLogEntry } from "../../../helper/Types";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useBleConnection } from "../../../Providers/BleConnectionProvider";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";
import { useBleCommand } from "../../../Providers/BleCommandProvider";

const LEVEL_OPTIONS: Array<{
  level: DebugLevel;
  name: string;
}> = [
    { level: DebugLevel.ERROR, name: "Error" },
    { level: DebugLevel.WARN, name: "Warn" },
    { level: DebugLevel.INFO, name: "Info" },
    { level: DebugLevel.DEBUG, name: "Debug" },
    { level: DebugLevel.VERBOSE, name: "Verbose" },
  ];

const FILTER_LEVELS = ["Error", "Warn", "Info", "Debug", "Verbose"] as const;

export function Debugger() {

  const { colorTheme, theme } = useColorTheme();

  const { isConnected } = useBleConnection();
  const { debugLevel, debugLogs, clearDebugLogs } = useBleMonitor();
  const { setModuleDebugLevel } = useBleCommand();

  const route = useRoute();
  //@ts-ignore
  const { back, backHumanReadable } = route.params;

  const [sessionTooltipOpen, setSessionTooltipOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<DebugLevel>(
    debugLevel !== DebugLevel.NONE ? debugLevel : DebugLevel.DEBUG,
  );
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<(typeof FILTER_LEVELS)[number][]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  const debugActive = debugLevel !== DebugLevel.NONE;

  useEffect(() => {
    if (debugLevel !== DebugLevel.NONE) {
      setSelectedLevel(debugLevel);
    }
  }, [debugLevel]);

  const toggleDebugSession = useCallback(async (isOn: boolean) => {
    if (!isConnected) return;
    if (isOn) {
      await setModuleDebugLevel(selectedLevel);
    } else {
      await setModuleDebugLevel(DebugLevel.NONE);
    }
  }, [isConnected, selectedLevel, setModuleDebugLevel]);

  const handleSelectLevel = useCallback(async (level: DebugLevel) => {
    setSelectedLevel(level);
    if (isConnected && debugActive) {
      await setModuleDebugLevel(level);
    }
  }, [isConnected, debugActive, setModuleDebugLevel]);

  const filteredLogs = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    return debugLogs.filter((entry) => {
      if (selectedFilters.length > 0) {
        const levelLabel = DebugLevelLabels[entry.level] as (typeof FILTER_LEVELS)[number];
        if (!selectedFilters.includes(levelLabel)) return false;
      }

      if (query.length > 0) {
        const matchesMessage = entry.message.toLowerCase().includes(query);
        const matchesTag = entry.tag.toLowerCase().includes(query);
        const matchesRaw = entry.raw.toLowerCase().includes(query);
        if (!matchesMessage && !matchesTag && !matchesRaw) return false;
      }

      return true;
    });
  }, [debugLogs, filterText, selectedFilters]);

  const getLevelColor = (levelChar: DebugLogEntry["levelChar"]) => {
    switch (levelChar) {
      case "E": return "#ff6b6b";
      case "W": return "#FFBF00E0";
      case "I": return "#43A5BE";
      case "D": return "#4caf50";
      case "V": return colorTheme.disabledButtonColor;
      default: return colorTheme.textColor;
    }
  };

  const exportLogs = useCallback(async () => {
    if (debugLogs.length === 0) return;

    try {
      const fileShareAvailable = await FileSharing.isAvailableAsync();
      if (!fileShareAvailable) {
        Toast.show({
          type: "error",
          text1: "Unable to Export",
          text2: "File sharing is not available on this device.",
        });
        return;
      }

      const content = debugLogs
        .map((entry) => `${entry.timestamp} ${entry.raw}`)
        .join("\n");

      const fileName = `openwink_debug_${new Date().toISOString().replace(/[:.]/g, "-")}.log`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await FileSharing.shareAsync(filePath, {
        mimeType: "text/plain",
      });
    } catch (error) {
      console.error("Error exporting debug logs:", error);
      Toast.show({
        type: "error",
        text1: "Export Failed",
        text2: "Something went wrong while exporting debug logs.",
      });
    }
  }, [debugLogs]);

  return (
    <SafeAreaView style={[theme.container, {
      rowGap: 15
    }]}>
      <HeaderWithBackButton
        backText={backHumanReadable || back}
        headerText="Debugger"
        deviceStatus
      />

      {/* Debug Session Toggle */}
      <View style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: 10,
      }}>
        <View style={[theme.mainLongButtonPressableContainer, { backgroundColor: undefined, padding: 0, paddingVertical: 0 }]}>
          <View style={theme.mainLongButtonPressableView}>
            <Text style={theme.mainLongButtonPressableText}>
              Debug Session {debugActive ? "Active" : "Inactive"}
            </Text>

            <Tooltip
              isVisible={sessionTooltipOpen}
              onClose={() => setSessionTooltipOpen(false)}
              content={
                <Text style={theme.tooltipContainerText}>
                  Streams real-time diagnostic logs from the OpenWink module over Bluetooth while active. Session remains active while navigating other pages until turned off or disconnected.
                </Text>
              }
              closeOnBackgroundInteraction
              closeOnContentInteraction
              placement="bottom"
              contentStyle={theme.tooltipContainer}
            >
              <Pressable
                hitSlop={20}
                onPress={() => setSessionTooltipOpen(true)}
              >
                {
                  ({ pressed }) => (
                    <IonIcons style={{ marginTop: 2 }} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={22} name="help-circle-outline" />
                  )
                }
              </Pressable>
            </Tooltip>
          </View>

          <View style={theme.mainLongButtonPressableIcon}>
            <ToggleSwitch
              onColor={!isConnected ? colorTheme.disabledButtonColor : colorTheme.buttonColor}
              offColor={colorTheme.disabledButtonColor}
              isOn={debugActive}
              size="medium"
              hitSlop={10}
              disabled={!isConnected}
              circleColor={colorTheme.buttonTextColor}
              onToggle={async (isOn) => await toggleDebugSession(!!isOn)}
              labelStyle={theme.mainLongButtonPressableIcon}
            />
          </View>
        </View>
      </View>

      {/* Log Verbosity Pill Bar */}
      <TooltipHeader
        tooltipContent={
          <Text style={theme.tooltipContainerText}>
            Controls the verbosity of logs transmitted by the module.{"\n"}
            Each level includes all higher-severity levels (e.g. Debug includes Info, Warn, and Error).
          </Text>
        }
        tooltipTitle="Log Verbosity"
      />

      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colorTheme.backgroundSecondaryColor,
        borderRadius: 999,
        padding: 4,
        width: "95%",
        marginBottom: 5,
      }}>
        {
          LEVEL_OPTIONS.map((opt) => {
            const isSelected = opt.level === selectedLevel;
            return (
              <Pressable
                key={opt.name}
                disabled={!isConnected}
                onPress={() => handleSelectLevel(opt.level)}
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: !isConnected
                    ? (isSelected ? colorTheme.disabledButtonColor : "transparent")
                    : (isSelected || pressed)
                      ? colorTheme.buttonColor
                      : "transparent",
                })}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: isSelected ? "IBMPlexSans_700Bold" : "IBMPlexSans_500Medium",
                    fontSize: 13,
                    textAlign: "center",
                    color: !isConnected
                      ? (isSelected ? colorTheme.disabledButtonTextColor : colorTheme.disabledButtonColor)
                      : (isSelected || false)
                        ? colorTheme.buttonTextColor
                        : colorTheme.textColor,
                  }}
                >
                  {opt.name}
                </Text>
              </Pressable>
            );
          })
        }
      </View>

      {/* Search & Filter Bar */}
      <View style={{
        width: "105%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        columnGap: 12,
      }}>
        <SearchBarFilter
          useFilters
          filterTitleText="Filter by Log Level"
          filterables={debugLogs}
          searchFilterKey="raw"
          filters={FILTER_LEVELS}
          placeholderText="Filter by tag or message..."
          onFilterTextChange={(text) => setFilterText(text)}
          onFiltersChange={(filters) => setSelectedFilters(filters)}
          onFilteredItemsUpdate={() => { }}
          filterFn={({ itemsToFilter }) => itemsToFilter}
        />
      </View>

      {/* Live Log Viewer Card */}
      <View style={{
        backgroundColor: colorTheme.debugViewColor,
        width: "95%",
        flex: 1,
        borderRadius: 10,
        flexDirection: "column",
        alignItems: "center",
        padding: 10,
        rowGap: 8,
        marginBottom: 60,
      }}>
        {/* Card Header */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "95%",
        }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            columnGap: 8,
          }}>
            <Text style={{
              color: colorTheme.headerTextColor,
              fontSize: 17,
              fontFamily: "IBMPlexSans_700Bold",
            }}>
              Debug Logs
            </Text>
            <Text style={{
              color: colorTheme.disabledButtonColor,
              fontSize: 13,
              fontFamily: "IBMPlexSans_500Medium",
              marginTop: 2,
            }}>
              ({filteredLogs.length})
            </Text>
          </View>

          <Pressable
            hitSlop={10}
            onPress={() => setAutoScroll((prev) => !prev)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              columnGap: 5,
            }}
          >
            {({ pressed }) => (
              <>
                <Text style={{
                  color: pressed ? colorTheme.buttonColor : autoScroll ? colorTheme.headerTextColor : colorTheme.disabledButtonColor,
                  fontSize: 14,
                  fontFamily: "IBMPlexSans_500Medium",
                }}>
                  Auto Scroll
                </Text>
                <IonIcons
                  style={{ marginTop: 2 }}
                  name={autoScroll ? "checkbox-outline" : "square-outline"}
                  size={17}
                  color={pressed ? colorTheme.buttonColor : autoScroll ? colorTheme.headerTextColor : colorTheme.disabledButtonColor}
                />
              </>
            )}
          </Pressable>
        </View>

        <View style={{ width: "95%", backgroundColor: `${colorTheme.disabledButtonColor}80`, height: 1.6, borderRadius: 5 }} />

        {/* Log Stream */}
        <ScrollView
          ref={scrollViewRef}
          style={{ width: "95%", flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            rowGap: 6,
            paddingVertical: 4,
            justifyContent: filteredLogs.length === 0 ? "center" : "flex-start",
          }}
          onContentSizeChange={() => {
            if (autoScroll && filteredLogs.length > 0) {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }}
        >
          {
            filteredLogs.length > 0 ?
              filteredLogs.map((entry) => (
                <Text
                  key={entry.id}
                  style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_400Regular",
                    fontSize: 13,
                    width: "100%",
                  }}
                >
                  <Text style={{
                    color: `${colorTheme.disabledButtonColor}B0`,
                    fontFamily: "IBMPlexSans_400Regular",
                  }}>
                    {entry.timestamp}{"  "}
                  </Text>
                  <Text style={{
                    color: getLevelColor(entry.levelChar),
                    fontFamily: "IBMPlexSans_700Bold",
                  }}>
                    [{entry.levelChar}][{entry.tag}]{"   "}
                  </Text>
                  {entry.message}
                </Text>
              ))
              : (
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: "IBMPlexSans_500Medium",
                    color: colorTheme.headerTextColor,
                    textAlign: "center",
                  }}
                >
                  {debugLogs.length === 0 ? "No Logs Recorded" : "No Matching Logs"}{"\n"}
                  <Text style={{
                    fontSize: 14,
                    fontFamily: "IBMPlexSans_400Regular",
                    color: colorTheme.disabledButtonColor,
                  }}>
                    {
                      debugLogs.length === 0 ?
                        (isConnected ?
                          (debugActive ? "Waiting for module events..." : "Enable Debug Session above to begin streaming.")
                          : "Connect to module to start a debug session.")
                        : "Try adjusting your search or level filters."
                    }
                  </Text>
                </Text>
              )
          }
        </ScrollView>
      </View>

      <SettingsToolbar
        disabled={debugLogs.length === 0}
        reset={clearDebugLogs}
        save={exportLogs}
        resetText="Clear Logs"
        saveText="Export Logs"
      />
    </SafeAreaView>
  );
}
