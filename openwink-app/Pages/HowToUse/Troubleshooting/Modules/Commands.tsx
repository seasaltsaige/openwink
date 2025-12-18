// Commands saying sent but not executing
// check connectors, restart app, reconnect, reset module
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function Commands() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      headerText="Commands not Executing"
      dropdown={
        <>

        </>
      }
      key={"commands"}
    />
  )
}