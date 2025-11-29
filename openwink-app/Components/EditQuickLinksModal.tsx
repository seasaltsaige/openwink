import { Text, View, Pressable, Modal } from "react-native";
import DragList, { DragListRenderItemInfo } from "react-native-draglist";
import IonIcons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useColorTheme } from "../hooks/useColorTheme";
import { ModalBlurBackground, SearchBarFilter } from ".";

export type QuickLink = {
  navigation: {
    page: string;
    back: string;
    backHumanReadable: string;
  };
  icon: keyof typeof IonIcons.glyphMap | null;
  title: string;
};

type RouteType = QuickLink & { display: string; visible: boolean; };


const ROUTES: RouteType[] = [
  {
    display: "Settings",
    icon: "information-circle-outline",
    title: "System Information",
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "Info",
    },
    visible: false,
  },
  {
    display: "Settings",
    icon: "build-outline",
    title: "Module Settings",
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "ModuleSettings",
    },
    visible: false,
  },
  {
    display: "Settings",
    icon: "color-fill-outline",
    title: "Change App Theme",
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "Theme",
    },
    visible: false,
  },
  {
    display: "Settings",
    icon: "document-text-outline",
    title: "System Terms of Use",
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "TermsOfUse",
    },
    visible: false,
  },
  {
    display: "Module Settings",
    icon: "radio-outline",
    title: "Wave Delay Settings",
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "WaveDelaySettings",
    },
    visible: false,
  },
  {
    display: "Module Settings",
    icon: "eye-outline",
    title: "Sleepy Eye Settings",
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "SleepyEyeSettings",
    },
    visible: false,
  },
  {
    display: "Module Settings",
    icon: "speedometer-outline",
    title: "Set Up Custom Wink Button",
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "CustomWinkButton",
    },
    visible: false,
  },
];
type Action =
  | {
    type: "reorder";
    moveData: { from: number; to: number };
  } | {
    type: "toggle";
    link: RouteType,
    moveData?: undefined;
  };

interface IEditQuickLinksModal {
  visible: boolean;
  close: () => void;
  initialLinks: (QuickLink)[];
  onUpdateLinks: (updatedLinks: (QuickLink)[]) => void;
}

export function EditQuickLinksModal({
  close,
  initialLinks,
  onUpdateLinks,
  visible,
}: IEditQuickLinksModal) {
  const mappedInitialLinks = useMemo(() => initialLinks.map(l => l.title), [initialLinks]);

  const { colorTheme, theme } = useColorTheme();

  const [allLinks, setAllLinks] = useState([] as RouteType[]);
  const [filteredLinks, setFilteredLinks] = useState([] as RouteType[]);

  const onRoutesChange = (
    data: Action,
  ) => {
    if (data.type === "toggle") {
      setAllLinks(prev => {
        const mapped = prev.map(l => l.title === data.link.title ? { ...l, visible: !l.visible } : l);
        return [...mapped.filter(l => l.visible), ...mapped.filter(l => !l.visible)];
      });
      setFilteredLinks(prev => {
        const mapped = prev.map(l => l.title === data.link.title ? { ...l, visible: !l.visible } : l);
        return [...mapped.filter(l => l.visible), ...mapped.filter(l => !l.visible)];
      });
    } else {
      const filteredItemToMove = filteredLinks[data.moveData.from];
      const allLinksIndex = allLinks.findIndex(l => l.title === filteredItemToMove.title);

      setAllLinks((prev) => {
        const spliced = prev.toSpliced(allLinksIndex, 1);
        // 'OK' since filtered links is either the same or smaller than allLinks
        spliced.splice(data.moveData.to, 0, filteredItemToMove);

        return [...spliced.filter(l => l.visible), ...spliced.filter(l => !l.visible)];
      });

      setFilteredLinks((prev) => {
        const spliced = prev.toSpliced(data.moveData.from, 1);
        spliced.splice(data.moveData.to, 0, filteredItemToMove);

        return [...spliced.filter(l => l.visible), ...spliced.filter(l => !l.visible)];
      });

    }
  }

  const setInitialValues = () => {
    const mappedLinks = ROUTES.map(r => mappedInitialLinks.includes(r.title) ? { ...r, visible: true } : r);
    const visible = mappedLinks.filter(r => r.visible);
    const hidden = mappedLinks.filter(r => !r.visible);

    setAllLinks([...visible, ...hidden]);
    setFilteredLinks([...visible, ...hidden]);
  }

  useEffect(() => setInitialValues(), []);

  const resetToStart = () => setInitialValues();
  const __saveLinksOnClose = () => {
    onUpdateLinks(allLinks.filter(l => l.visible).map(l => ({ icon: l.icon, navigation: l.navigation, title: l.title })));
    close();
  };

  const renderDragItem = useCallback(
    ({
      isActive,
      item,
      index,
      onDragEnd,
      onDragStart,
    }: DragListRenderItemInfo<RouteType>) => {


      return (
        <View style={{
          width: "100%",
          padding: 13,
          paddingHorizontal: 13,
          borderRadius: 10,
          backgroundColor: colorTheme.backgroundSecondaryColor,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            columnGap: 10,
          }}>
            <Pressable
              onPressIn={onDragStart}
              onPressOut={onDragEnd}
              hitSlop={10}
            >
              {
                ({ pressed }) => (
                  <MaterialIcons name="drag-indicator" size={22} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
                )
              }
            </Pressable>

            <View style={{ flexDirection: "row", alignItems: "center", columnGap: 7, }}>
              <IonIcons style={{
                // padding: 5,
                height: 30,
                width: 30,
                textAlign: "center",
                verticalAlign: "middle",
                justifyContent: "center",
                backgroundColor: `${colorTheme.disabledButtonColor}4D`,
                borderRadius: 7,
              }} name={item.icon!} size={19} color={colorTheme.textColor} />
              <View style={{
                alignItems: "flex-start",
              }}>
                <Text style={{
                  color: colorTheme.textColor,
                  fontFamily: "IBMPlexSans_500Medium"
                }}>
                  {item.title}
                </Text>
                <Text style={{
                  color: item.visible ? colorTheme.disabledButtonColor : `${colorTheme.disabledButtonColor}80`
                }}>
                  {item.visible ? "Visible on home page" : "Hidden from home page"}
                </Text>
              </View>

            </View>
          </View>

          <Pressable
            hitSlop={20}
            onPress={() => onRoutesChange({ type: "toggle", link: item })}
          >
            {
              ({ pressed }) => (
                <IonIcons color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={19} style={{ marginRight: 5, }} name={item.visible ? "eye-outline" : "eye-off-outline"} />
              )
            }
          </Pressable>
        </View>
      )

    }, []);

  return (
    <Modal
      onRequestClose={__saveLinksOnClose}
      transparent
      animationType="fade"
      visible={visible}
    >
      <ModalBlurBackground>
        <View
          style={{
            alignItems: "center",
            justifyContent: "flex-start",
            paddingVertical: 15,
            paddingHorizontal: 20,
            rowGap: 15,
            backgroundColor: colorTheme.backgroundPrimaryColor,
            width: "90%",
            borderRadius: 15,
            boxShadow: "0 3 5px rgba(0, 0, 0, 0.2)"
          }}
        >

          <View style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <Text
              style={{
                fontFamily: "IBMPlexSans_700Bold",
                color: colorTheme.headerTextColor,
                fontSize: 22,
              }}
            >
              Edit Quick Links
            </Text>

            <Pressable
              hitSlop={10}
              onPress={__saveLinksOnClose}
            >
              {
                ({ pressed }) => (
                  <IonIcons name="close-outline" size={25} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
                )
              }
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 10,
              width: "100%",
            }}
          >
            <Pressable
              hitSlop={10}
              onPress={resetToStart}
            >
              {
                ({ pressed }) =>
                  <View style={{
                    alignItems: "center",
                  }}>
                    <IonIcons name="refresh-outline" color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={25} />
                    <Text style={{
                      marginTop: -2,
                      fontSize: 10,
                      color: pressed ? colorTheme.buttonColor : colorTheme.textColor,
                      fontFamily: "IBMPlexSans_500Medium"
                    }}>
                      Reset
                    </Text>
                  </View>
              }
            </Pressable>
            <SearchBarFilter
              useFilters={false}
              filterables={allLinks}
              filterTitleText="Filter by page location"
              searchFilterKey="title"
              onFilterTextChange={() => { }}
              placeholderText="Filter by page name..."
              onFilteredItemsUpdate={(filteredRoutes) => {
                setFilteredLinks(filteredRoutes);
              }}
            />
          </View>

          <View
            style={{
              width: "100%",
              height: 225
            }}
          >
            <DragList
              data={filteredLinks}
              keyExtractor={(item) => `${item.title}-draggable`}
              renderItem={renderDragItem}
              scrollEnabled
              contentContainerStyle={{ rowGap: 12, alignItems: "center" }}
              onReordered={(from, to) => {
                onRoutesChange({ type: "reorder", moveData: { from, to } });
              }}
            />
          </View>

          <View style={{
            width: "100%",
            marginTop: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}>

            <Text style={{
              color: colorTheme.textColor,
              fontFamily: "IBMPlexSans_500Medium",
              fontSize: 12,
            }}>
              Changes are saved automatically
            </Text>

            <Text style={{
              padding: 3,
              paddingHorizontal: 7,
              backgroundColor: colorTheme.backgroundSecondaryColor,
              fontSize: 12,
              borderRadius: 6,
              color: colorTheme.textColor,

              fontFamily: "IBMPlexSans_500Medium",
            }}>
              {allLinks.filter(r => r.visible).length} of {ROUTES.length} visible
            </Text>
          </View>

        </View>
      </ModalBlurBackground>
    </Modal>
  );
}
