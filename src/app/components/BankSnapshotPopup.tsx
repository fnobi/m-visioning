import type BankSnapshot from "~/app/scheme/BankSnapshot";
import SnapshotForm from "~/app/components/SnapshotForm";
import AppCommonPopup from "~/app/components/AppCommonPopup";

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
  <AppCommonPopup title="口座ログ" onClose={onClose}>
    <SnapshotForm
      type="bank"
      defaultValue={defaultValue}
      onDelete={onDelete}
      onSubmit={v => onSubmit({ ...v, bankId: defaultValue.bankId })}
    />
  </AppCommonPopup>
);

export default BankSnapshotFormPopup;
