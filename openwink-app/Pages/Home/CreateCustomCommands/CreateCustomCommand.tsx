import { useState } from "react";

import { CustomCommandStore } from "../../../Storage";
import { MainView } from "./MainView";
import { ModifyType, ModifyView } from "./ModifyView";

enum PageType {
  MAIN,
  MODIFY,
}

export function CreateCustomCommand() {

  const [pageState, setPageState] = useState(CustomCommandStore.getAll().length > 0 ? PageType.MAIN : PageType.MODIFY);
  const [modifyType, setModifyType] = useState(ModifyType.CREATE);
  const [commandName, setCommandName] = useState("");


  return (
    <>
      {
        pageState === PageType.MAIN ? (
          <MainView
            setModifyType={(type) => { setModifyType(type); setPageState(PageType.MODIFY); }}
            setEditCommandName={setCommandName}
          />
        ) : (
          <ModifyView
            type={modifyType}
            commandName={commandName}
            onDiscard={() => setPageState(PageType.MAIN)}
            onSave={() => setPageState(PageType.MAIN)}
          />
        )
      }
    </>
  )
}