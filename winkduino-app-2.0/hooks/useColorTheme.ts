import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";


const defaults = {
  backgroundPrimaryColor: "#141414",
  backgroundSecondaryColor: "#1e1e1e",
  buttonColor: "#800020",
  disabledButtonColor: "",
  buttonTextColor: "",
  disabledButtonTextColor: "",
  headerTextColor: "",

}


export function useColorTheme() {
  const [backgroundColor, setBackgroundColor] = useState("");
  const [buttonColor, setButtonColor] = useState("");
  const [buttonTextColor, setButtonTextColor] = useState("");
  const [headerTextColor, setHeaderTextColor] = useState("");
  const [primaryTextColor, setPrimaryTextColor] = useState("");

}