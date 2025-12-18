import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function MoreTrouble() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      headerText="Still Having Trouble?"
      dropdown={
        <>

        </>
      }
      key={"more_trouble"}
    />
  )
}