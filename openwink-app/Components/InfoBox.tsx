import { Text, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";

interface InfoBoxProps {
  title: string;
  data: Array<Record<string, any>> | Record<string, any>;
}

export function InfoBox({ title, data }: InfoBoxProps) {
  const { theme } = useColorTheme();
  const rows = Array.isArray(data) ? data : [data];

  return (
    <View style={theme.infoBoxOuter}>
      <Text style={theme.infoBoxOuterText}>
        {title}
      </Text>

      <View style={theme.infoBoxInner}>
        {rows.map((obj, idx) => (
          Object.keys(obj).map(key => (
            <View
              style={theme.infoBoxInnerContentView}
              key={key}
            >
              <Text style={[theme.infoBoxInnerContentText, { opacity: rows[idx][key] ? 0.6 : 0.9 }]}>
                {key}
              </Text>

              <Text style={theme.infoBoxInnerContentText}>
                {rows[idx][key]}
              </Text>
            </View>
          ))
        ))}
      </View>
    </View>
  );
}
