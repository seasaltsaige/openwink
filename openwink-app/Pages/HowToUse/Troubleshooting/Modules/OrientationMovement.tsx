import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function OrientationMovement() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      headerText="Headlight Orientation & Movement"
      dropdown={
        <>

        </>
      }
      key={"orientation"}
    />
  )
}