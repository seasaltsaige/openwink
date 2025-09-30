import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { Portal } from "@gorhom/portal";
import IonIcons from "@expo/vector-icons/Ionicons";
import Octicons from "@react-native-vector-icons/octicons";
import ToggleSwitch from "toggle-switch-react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps, BottomSheetView
} from "@gorhom/bottom-sheet";

import { useColorTheme } from "../hooks/useColorTheme";

interface BaseSearchBarFilter<
  T extends ReadonlyArray<string>,
  K extends Array<{ [key: string]: any }>,
  I extends keyof (K[number]) & string,
> {
  searchFilterKey: I;
  onFilterTextChange: (filterText: string) => void;
  onFilteredItemsUpdate: (filteredItems: K) => void;
  filterables: K;
  placeholderText: string;
  filterTitleText: string;
}

interface SearchBarFilterWithFilters<
  T extends ReadonlyArray<string>,
  K extends Array<{ [key: string]: any }>,
  I extends keyof (K[number]) & string,
> extends BaseSearchBarFilter<T, K, I> {
  useFilters: true;
  filters: T;
  onFiltersChange: (selectedFilters: T[number][]) => void;
  filterFn: (filterData: {
    itemsToFilter: K;
    filterType: "narrow" | "inclusive";
    selectedFilters: T[number][];
  }) => K;
}

interface SearchBarFilterWithoutFilters<
  T extends ReadonlyArray<string>,
  K extends Array<{ [key: string]: any }>,
  I extends keyof (K[number]) & string,
> extends BaseSearchBarFilter<T, K, I> {
  useFilters: false;
  filters?: never;
  onFiltersChange?: never;
  filterFn?: never;
}

type ISearchBarFilter<
  T extends ReadonlyArray<string>,
  K extends Array<{ [key: string]: any }>,
  I extends keyof (K[number]) & string,
> =
  | SearchBarFilterWithFilters<T, K, I>
  | SearchBarFilterWithoutFilters<T, K, I>;

export function SearchBarFilter<
  T extends ReadonlyArray<string>,
  K extends Array<{ [key: string]: any }>,
  I extends keyof (K[number]) & string,
  J extends boolean,
>({
  searchFilterKey,
  useFilters,
  filterables,
  filters,
  filterTitleText,
  onFilterTextChange,
  onFiltersChange,
  onFilteredItemsUpdate,
  filterFn,
  placeholderText,
}: ISearchBarFilter<T, K, I>) {

  const { colorTheme } = useColorTheme();


  const bottomSheetRef = useRef<BottomSheet>(null);

  const [__filters, __setFilters] = useState([] as (T[number])[]);
  const [__fitlerText, __setFilterText] = useState("");
  const [filterType, setFilterType] = useState("narrow" as "narrow" | "inclusive");

  const createFilteredItems = () => {
    const fitleredByName: K = [] as any;
    if (__filters.length < 1 && __fitlerText.length < 1) return filterables;
    // Text filter
    for (const item of filterables) {
      if ((item[searchFilterKey].toLowerCase().includes(__fitlerText.toLowerCase()))) {
        fitleredByName.push(item);
        continue;
      }
    }
    // Implementation based filter
    if (useFilters) {
      const filtered = filterFn({ filterType, itemsToFilter: fitleredByName, selectedFilters: __filters });
      return filtered;
    } else return fitleredByName;
  }

  const __onFilterTextChange = (text: string) => __setFilterText(text);


  const __onFiltersChange = (filter: T[number]) => {
    __setFilters((prev) => {
      if (prev.includes(filter)) {
        const index = prev.indexOf(filter);
        const arr = prev.toSpliced(index, 1);
        return arr;
      } else return [...prev, filter]
    });
  }

  const __onFilteredItemsUpdate = (filteredItems: K) => onFilteredItemsUpdate(filteredItems);


  useEffect(() => {
    if (useFilters) {
      onFiltersChange(__filters);
      __onFilteredItemsUpdate(createFilteredItems());
    }
  }, [__filters]);
  useEffect(() => {
    onFilterTextChange(__fitlerText);
    __onFilteredItemsUpdate(createFilteredItems());
  }, [__fitlerText]);
  useEffect(() => {
    __onFilteredItemsUpdate(createFilteredItems());
  }, [filterType]);


  const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => {
    return <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
    />
  }, []);

  return (
    <>
      <View style={{ position: "relative", width: "80%" }}>
        <TextInput
          style={{
            height: 40,
            backgroundColor: colorTheme.backgroundSecondaryColor,
            paddingHorizontal: 40,
            paddingRight: 10,
            borderRadius: 100,
            fontFamily: "IBMPlexSans_400Regular",
            color: colorTheme.textColor,
          }}
          onChangeText={__onFilterTextChange}
          placeholderTextColor={colorTheme.disabledButtonColor}
          placeholder={placeholderText}
        />
        <IonIcons name="search" size={20} color={colorTheme.textColor} style={{ position: "absolute", left: 12, top: 10, }} />
      </View>
      {
        useFilters ?
          <Pressable
            hitSlop={10}
            onPress={() => bottomSheetRef.current?.snapToIndex(0)}
          >
            {
              ({ pressed }) =>
                <Octicons name="sliders" size={23} color={pressed ? colorTheme.buttonColor : colorTheme.textColor} />
            }
          </Pressable>
          : <></>
      }

      {
        useFilters ?
          <Portal
            name="bottomSheet"
          >
            <BottomSheet
              ref={bottomSheetRef}
              index={-1}
              enablePanDownToClose
              backgroundStyle={{
                backgroundColor: colorTheme.backgroundSecondaryColor,
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)"
              }}
              handleIndicatorStyle={{ backgroundColor: colorTheme.buttonTextColor, width: "15%", marginTop: 5 }}
              backdropComponent={renderBackdrop}
            >
              <BottomSheetView

                style={{
                  flex: 1,
                  padding: 36,
                  paddingTop: 10,
                  alignItems: 'center',
                  justifyContent: "flex-start",
                  rowGap: 15,
                  width: "100%",
                  zIndex: 200,
                }}



              >

                <Text style={{
                  textAlign: "center",
                  color: colorTheme.headerTextColor,
                  fontSize: 22,
                  fontFamily: "IBMPlexSans_700Bold"
                }}>
                  {filterTitleText}
                </Text>

                <View style={{ marginVertical: 10, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", columnGap: 15, }}>
                  <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "50%" }}>

                    <Text style={{ color: colorTheme.headerTextColor, fontSize: 17, fontFamily: "IBMPlexSans_500Medium" }}>
                      Filters Narrow:
                    </Text>
                    <ToggleSwitch
                      onColor={colorTheme.buttonColor}
                      offColor={colorTheme.disabledButtonColor}
                      isOn={filterType === "narrow"}
                      size="medium"
                      hitSlop={10}
                      circleColor={colorTheme.buttonTextColor}
                      onToggle={(isOn) => setFilterType(isOn ? "narrow" : "inclusive")}
                    />
                  </View>
                  <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "40%" }}>

                    <Pressable
                      style={{ width: "100%" }}
                      onPress={() => __setFilters([] as T[number][])}
                    >
                      {
                        ({ pressed }) => (
                          <Text style={{
                            textAlign: "right",
                            width: "100%",
                            color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                            textDecorationColor: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                            textDecorationStyle: "solid",
                            textDecorationLine: "underline",
                            fontSize: 17,
                            fontFamily: "IBMPlexSans_500Medium"
                          }}>
                            Clear Filters
                          </Text>
                        )
                      }
                    </Pressable>

                  </View>
                </View>


                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    rowGap: 10,
                    alignItems: "center",
                    justifyContent: "space-between",
                    // width: "100%",
                  }}>
                  {
                    filters.map(filter => (
                      <View
                        key={filter}
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "48%",
                        }}>

                        <Text style={{ color: colorTheme.textColor, fontSize: 17, fontFamily: "IBMPlexSans_500Medium" }}>
                          {filter}
                        </Text>

                        <Pressable
                          hitSlop={10}
                          onPress={() => __onFiltersChange(filter)}
                          style={{ width: 25, height: 25 }}
                        >
                          {
                            ({ pressed }) =>
                              <IonIcons color={(pressed) ? colorTheme.buttonColor : colorTheme.headerTextColor} size={25} name={__filters.includes(filter) ? "checkbox-outline" : "square-outline"} />
                          }
                        </Pressable>
                      </View>
                    ))
                  }
                </View>
              </BottomSheetView>
            </BottomSheet>
          </Portal>
          : <></>
      }
    </>
  )
}
