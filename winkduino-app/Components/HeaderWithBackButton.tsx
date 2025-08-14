import { ActivityIndicator, Pressable, Text, TextStyle, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import { useNavigation } from "@react-navigation/native";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useBLE } from "../hooks/useBLE";

interface IHeaderWithBackButtonProps {
  backText: string;
  headerText: string;
  headerTextStyle?: TextStyle;
}

export function HeaderWithBackButton({ backText, headerText, headerTextStyle }: IHeaderWithBackButtonProps) {
  const { theme, colorTheme } = useColorTheme();
  const { device, isConnecting, isScanning } = useBLE();
  const navigation = useNavigation();

  return (
    <View style={theme.headerContainer}>
      <Pressable
        style={theme.backButtonContainer}
        onPress={() => navigation.goBack()}
      >
        {
          ({ pressed }) => (
            <>
              <IonIcons style={theme.backButtonContainerIcon} name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

              <Text style={pressed ? theme.backButtonContainerTextPressed : theme.backButtonContainerText}>
                {backText}
              </Text>
              {
                device ? (
                  <IonIcons style={theme.backButtonContainerIcon} name="wifi-outline" color="#367024" size={21} />
                ) : (
                  (isConnecting || isScanning) ?
                    <ActivityIndicator style={theme.backButtonContainerIcon} color={colorTheme.buttonColor} />
                    : (
                      <IonIcons style={theme.backButtonContainerIcon} name="cloud-offline-outline" color="#b3b3b3" size={23} />
                    )
                )
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