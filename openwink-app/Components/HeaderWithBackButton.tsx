import { ActivityIndicator, Pressable, Text, TextStyle, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useColorTheme } from "../hooks/useColorTheme";
import { useBleConnection } from "../Providers/BleConnectionProvider";
import { useBleMonitor } from "../Providers/BleMonitorProvider";

interface IHeaderWithBackButtonProps {
  backText: string;
  headerText: string;
  headerTextStyle?: TextStyle;
  deviceStatus?: boolean;

  pressAction?: (() => void) | undefined;
}

export function HeaderWithBackButton({ pressAction, backText, headerText, headerTextStyle, deviceStatus }: IHeaderWithBackButtonProps) {
  const { theme, colorTheme } = useColorTheme();
  const { isConnecting, isScanning, isConnected } = useBleConnection();
  const navigation = useNavigation();

  return (
    <View style={theme.headerContainer}>
      <Pressable
        style={theme.backButtonContainer}
        onPress={() => pressAction ? pressAction() : navigation.goBack()}
      >
        {
          ({ pressed }) => (
            <>
              <IonIcons style={theme.backButtonContainerIcon} name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

              <Text style={pressed ? theme.backButtonContainerTextPressed : theme.backButtonContainerText}>
                {backText}
              </Text>
              {
                deviceStatus ? (
                  isConnected ? (
                    <IonIcons style={theme.backButtonContainerIcon} name="wifi-outline" color="#367024" size={21} />
                  ) : (
                    (isConnecting || isScanning) ?
                      <ActivityIndicator style={theme.backButtonContainerIcon} color={colorTheme.buttonColor} />
                      : (
                        <IonIcons style={theme.backButtonContainerIcon} name="cloud-offline-outline" color="#b3b3b3" size={23} />
                      )
                  )
                ) : <></>
              }
            </>
          )
        }
      </Pressable>

      <Text style={headerTextStyle ? headerTextStyle : theme.subSettingHeaderText}>
        {headerText}
      </Text>
    </View>
  )
}