import { GestureResponderEvent, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native";

interface OpacityButtonProps {
  text: string;
  textStyle: TextStyle;
  buttonStyle: ViewStyle;
  disabled?: boolean;
  onPress: ((event: GestureResponderEvent) => void);
}

class KeyCounter {
  static key_id = 0;
  static newKey() {
    const key = this.key_id;
    this.key_id++;
    return key;
  }
}

export function OpacityButton(props: OpacityButtonProps) {

  return (
    <TouchableOpacity disabled={props.disabled} style={props.buttonStyle} key={KeyCounter.newKey()} onPress={(event) => props.onPress(event)}>
      <Text style={props.textStyle}>
        {props.text}
      </Text>
    </TouchableOpacity>
  )

}