import { Modal } from "react-native";

interface IEditQuickLinksModal {
  visible: boolean;
  close: () => void;
  initialLinks: [string, string];
}
export function EditQuickLinksModal({

}: IEditQuickLinksModal) {

  return (
    <Modal>

    </Modal>
  )

}