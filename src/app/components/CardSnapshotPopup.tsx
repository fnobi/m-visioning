import MockPopup from "~/common/components/MockPopup";
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
  <MockPopup onClose={onClose}>
    <p>カードログ</p>
    <SnapshotForm
      defaultValue={defaultValue}
      onDelete={onDelete}
      onSubmit={v => onSubmit({ ...v, cardId: defaultValue.cardId })}
    />
  </MockPopup>
);

export default CardSnapshotFormPopup;
