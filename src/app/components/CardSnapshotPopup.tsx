import AppCommonPopup from "~/app/components/AppCommonPopup";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import SnapshotForm from "~/app/components/SnapshotForm";

const CardSnapshotFormPopup = ({
  defaultValue,
  onClose,
  onDelete,
  onSubmit
}: {
  defaultValue: CardSnapshot;
  onClose: () => void;
  onDelete?: () => void;
  onSubmit: (v: CardSnapshot) => void;
}) => (
  <AppCommonPopup title="カードログ" onClose={onClose}>
    <SnapshotForm
      defaultValue={defaultValue}
      onDelete={onDelete}
      onSubmit={v => onSubmit({ ...v, cardId: defaultValue.cardId })}
    />
  </AppCommonPopup>
);

export default CardSnapshotFormPopup;
