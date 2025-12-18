import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function Button() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      headerText="Button Actions not Working"
      dropdown={
        <>

        </>
      }
      key={"button"}
    />
  )
}