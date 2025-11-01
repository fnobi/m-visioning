import MockPopup from "~/common/components/MockPopup";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import SnapshotForm from "~/app/components/SnapshotForm";

const BankSnapshotFormPopup = ({
  defaultValue,
  onClose,
  onDelete,
  onSubmit
}: {
  defaultValue: BankSnapshot;
  onClose: () => void;
  onDelete?: () => void;
  onSubmit: (v: BankSnapshot) => void;
}) => (
  <MockPopup onClose={onClose}>
    <p>口座ログ</p>
    <SnapshotForm
      defaultValue={defaultValue}
      onDelete={onDelete}
      onSubmit={v => onSubmit({ ...v, bankId: defaultValue.bankId })}
    />
  </MockPopup>
);

export default BankSnapshotFormPopup;
