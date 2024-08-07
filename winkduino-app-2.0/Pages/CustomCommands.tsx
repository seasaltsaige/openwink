import { Modal } from "react-native";
import { Device } from "react-native-ble-plx";


type CustomCommandProps = {
  visible: boolean;
  device: Device | null;
  close: () => void;
  headlightBusy: boolean;
  leftStatus: number;
  rightStatus: number;
}

export function CustomCommands(props: CustomCommandProps) {
  return (
    <Modal
      transparent={false}
      visible={props.visible && props.device !== null}
      animationType="slide"
      hardwareAccelerated
    >

    </Modal>
  )
}