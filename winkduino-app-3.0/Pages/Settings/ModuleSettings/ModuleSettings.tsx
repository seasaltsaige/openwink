import { Pressable, Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useBLE } from "../../../hooks/useBLE";





const moduleSettingsData: Array<{
  pageName: string;
  pageSymbol: string;
  navigationName: string;
}> = [
    {
      pageName: "Automatic Connection",
      navigationName: "AutoConnectSettings",
      pageSymbol: "infinite-outline",
    },
    {
      pageName: "Wave Delay Settings",
      navigationName: "WaveDelaySettings",
      pageSymbol: "settings-outline",
    },
    {
      pageName: "Sleepy Eye Settings",
      navigationName: "SleepyEyeSettings",
      pageSymbol: "settings-outline"
    },
    {
      pageName: "Set Up Custom Wink Buton",
      navigationName: "CustomWinkButton",
      pageSymbol: "options-outline",
    },
    {
      pageName: "Put Module to Sleep",
      navigationName: "LongTermSleep",
      pageSymbol: "moon-outline"
    }
  ]




export function ModuleSettings() {

  const { colorTheme } = useColorTheme();
  const { mac } = useBLE();
  const navigate = useNavigation();

  // const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  const [isBackPressed, setIsBackPressed] = useState(false);
  const backPressed = (bool: boolean) => setIsBackPressed(bool);


  const [accordionOpen, setAccordionOpen] = useState(false);

  return (
    <View
      style={{
        backgroundColor: colorTheme.backgroundPrimaryColor,
        height: "100%",
        padding: 15,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        rowGap: 40,
      }}
    >

      <View style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}>

        <Pressable style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          columnGap: 10,
          height: "100%"
        }}
          onPressIn={() => backPressed(true)}
          onPressOut={() => backPressed(false)}
          onPress={() => navigate.goBack()}
        >
          <IonIcons name="chevron-back-outline" color={isBackPressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

          <Text style={{
            color: isBackPressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
            fontWeight: "500",
            fontSize: 22
          }}>{back}</Text>
        </Pressable>


        <Text style={{
          fontSize: 35,
          fontWeight: "600",
          color: colorTheme.headerTextColor,
          width: "auto",
          marginRight: 10,
        }}
        >Module Settings</Text>

      </View>

      <View
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          // width: "100%",
          rowGap: 15,
        }}
      >

        {
          moduleSettingsData.map((val, i) => (
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                width: "100%",
                padding: 5,
                paddingVertical: 13,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 8,
              })}
              //@ts-ignore
              onPress={() => navigate.navigate(val.navigationName, { back: route.name })}
              key={i}>

              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  columnGap: 10,
                  marginLeft: 10,
                }}
              >

                <IonIcons
                  //@ts-ignore
                  name={val.pageSymbol}
                  size={25}
                  color={colorTheme.headerTextColor}
                />
                <Text
                  style={{
                    color: colorTheme.headerTextColor,
                    fontWeight: "bold",
                    fontSize: 17,
                  }}
                >{val.pageName}</Text>
              </View>
              <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
            </Pressable>
          ))
        }

        {/* AUTO CONNECT */}
        {/* <Pressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
            width: "100%",
            padding: 5,
            paddingVertical: 13,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 8,
          })}
          //@ts-ignore
          onPress={() => navigate.navigate("AutoConnectSettings", { back: route.name })}
          key={1}>

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 10,
              marginLeft: 10,
            }}
          >

            <IonIcons
              name="repeat-outline"
              size={25}
              color={colorTheme.headerTextColor}
            />
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "bold",
                fontSize: 17,
              }}
            >Automatic Connection</Text>
          </View>
          <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
        </Pressable>




        <Pressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
            width: "100%",
            padding: 5,
            paddingVertical: 13,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 8,
          })}
          //@ts-ignore
          onPress={() => navigate.navigate("WaveDelaySettings", { back: route.name })}
          key={2}>

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 10,
              marginLeft: 10,
            }}
          >

            <IonIcons
              name="color-wand-outline"
              size={25}
              color={colorTheme.headerTextColor}
            />
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "bold",
                fontSize: 17,
              }}
            >Wave Delay Settings</Text>
          </View>
          <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
        </Pressable>


        <Pressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
            width: "100%",
            padding: 5,
            paddingVertical: 13,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 8,
          })}
          //@ts-ignore
          onPress={() => navigate.navigate("SleepyEyeSettings", { back: route.name })}
          key={3}>

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 10,
              marginLeft: 10,
            }}
          >

            <IonIcons
              name="color-wand-outline"
              size={25}
              color={colorTheme.headerTextColor}
            />
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "bold",
                fontSize: 17,
              }}
            >Sleepy Eye Settings</Text>
          </View>
          <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
        </Pressable>




        <Pressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
            width: "100%",
            padding: 5,
            paddingVertical: 13,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 8,
          })}
          //@ts-ignore
          onPress={() => navigate.navigate("CustomWinkButton", { back: route.name })}
          key={4}>

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 10,
              marginLeft: 10,
            }}
          >

            <IonIcons
              name="color-wand-outline"
              size={25}
              color={colorTheme.headerTextColor}
            />
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "bold",
                fontSize: 17,
              }}
            >Set Up Custom Wink Button</Text>
          </View>
          <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
        </Pressable>




        <Pressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
            width: "100%",
            padding: 5,
            paddingVertical: 13,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 8,
          })}
          //@ts-ignore
          onPress={() => navigate.navigate("LongTermSleep", { back: route.name })}
          key={5}>

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 10,
              marginLeft: 10,
            }}
          >

            <IonIcons
              name="color-wand-outline"
              size={25}
              color={colorTheme.headerTextColor}
            />
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "bold",
                fontSize: 17,
              }}
            >Put Module to Sleep</Text>
          </View>
          <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
        </Pressable> */}

      </View>

      {/* ADVANCED (DELETE DATA, FORGET MODULE) */}
      {/* <Text
        style={{
          textAlign: "left",
          fontSize: 30,
          fontWeight: "500",
          color: colorTheme.headerTextColor,
          width: "100%",
        }}
      >
        Advanced Settings
      </Text> */}
      <View
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          rowGap: 10,
          backgroundColor: accordionOpen ? colorTheme.dropdownColor : colorTheme.backgroundPrimaryColor,
          paddingBottom: accordionOpen ? 10 : 0,
          borderRadius: 8,
        }}
      >

        <Pressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
            width: "100%",
            padding: 5,
            paddingVertical: 13,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 8,
          })}
          //@ts-ignore
          onPress={() => setAccordionOpen(!accordionOpen)}
          key={6}>

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 10,
              marginLeft: 10,
            }}
          >

            <IonIcons
              name="construct-outline"
              size={25}
              color={colorTheme.headerTextColor}
            />
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "bold",
                fontSize: 17,
              }}
            >Advanced Settings</Text>
          </View>
          <IonIcons name={accordionOpen ? "chevron-up-outline" : "chevron-down-outline"} size={20} color={colorTheme.headerTextColor} />
        </Pressable>


        {
          accordionOpen ? <>


            {/* FORGET MODULE */}
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                width: "95%",
                padding: 5,
                paddingVertical: 10,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 8,
              })}
              //@ts-ignore
              onPress={() => navigate.navigate("ForgetModule", { back: route.name })}
              key={7}>

              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  columnGap: 10,
                  marginLeft: 10,
                }}
              >

                <IonIcons
                  name="reload"
                  size={25}
                  color={colorTheme.headerTextColor}
                />
                <Text
                  style={{
                    color: colorTheme.headerTextColor,
                    fontWeight: "bold",
                    fontSize: 17,
                  }}
                >Forget Module</Text>
              </View>
              <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
            </Pressable>



            {/* DELETE SETTINGS */}
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                width: "95%",
                padding: 5,
                paddingVertical: 10,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 8,
              })}
              //@ts-ignore
              onPress={() => navigate.navigate("LongTermSleep", { back: route.name })}
              key={8}>

              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  columnGap: 10,
                  marginLeft: 10,
                }}
              >

                <IonIcons
                  name="trash-outline"
                  size={25}
                  color={colorTheme.headerTextColor}
                />
                <Text
                  style={{
                    color: colorTheme.headerTextColor,
                    fontWeight: "bold",
                    fontSize: 17,
                  }}
                >Delete Module Settings</Text>
              </View>
              <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
            </Pressable>
          </> : <></>
        }

      </View>


    </View>
  )
}