import { Text, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";

interface InfoBoxProps {
  title: string;
  data: Record<string, string | number>;
}

export function InfoBox({ title, data }: InfoBoxProps) {
  const { theme } = useColorTheme();

  return (
    <View style={theme.infoBoxOuter}>
      <Text style={theme.infoBoxOuterText}>
        {title}
      </Text>

      <View style={theme.infoBoxInner}>
        {Object.keys(data).map((key) => (
          <View
            style={theme.infoBoxInnerContentView}
            key={key}
          >
            <Text style={[theme.infoBoxInnerContentText, { opacity: 0.6 }]}>
              {key}
            </Text>

            <Text style={theme.infoBoxInnerContentText}>
              {data[key]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
