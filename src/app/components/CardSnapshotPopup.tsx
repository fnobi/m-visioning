import { useMemo, useState } from "react";
import {
  MockArrayFormRow,
  MockDateTimeFormRow,
  MockFormFrame,
  MockNumberFormRow,
  MockStringFormRow
} from "~/common/components/mock-form-ui";
import MockPopup from "~/common/components/MockPopup";
import FormOrganizer from "~/common/lib/FormOrganizer";
import {
  requiredValidator,
  subArrayFieldValidator
} from "~/common/lib/form-validator";
import type CardSnapshot from "~/app/scheme/CardSnapshot";

const formOrganizer2 = new FormOrganizer<
  CardSnapshot["detail"][number]
>().fieldValidator("label", requiredValidator());
const formOrganizer1 = new FormOrganizer<CardSnapshot>().fieldValidator(
  "detail",
  subArrayFieldValidator(formOrganizer2)
);

const CardSnapshotDetailForm = ({
  value,
  onChange
}: {
  value: CardSnapshot["detail"][number];
  onChange: (v: CardSnapshot["detail"][number]) => void;
}) => {
  const errors = useMemo(() => formOrganizer2.getErrors(value), [value]);
  return (
    <>
      <MockStringFormRow
        label="内容"
        value={value.label}
        onChange={v => onChange({ ...value, label: v })}
        error={errors.label}
      />
      <MockNumberFormRow
        label="金額"
        value={value.price}
        onChange={v => onChange({ ...value, price: v })}
        error={errors.price}
      />
    </>
  );
};

// TODO: Bankとだいぶ共通なので整理したい
const CardSnapshotFormPopup = ({
  defaultValue,
  onClose,
  onSubmit
}: {
  defaultValue: CardSnapshot;
  onClose: () => void;
  onSubmit: (v: CardSnapshot) => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const { validValue, errors } = useMemo(
    () => formOrganizer1.getValidValue(value),
    [value]
  );
  return (
    <MockPopup onClose={onClose}>
      <p>口座ログ</p>
      <div
        style={{
          textAlign: "left"
        }}
      >
        <MockFormFrame validValue={validValue} onSubmit={onSubmit}>
          <MockDateTimeFormRow
            label="日時"
            value={value.timestamp}
            onChange={v => setValue(vv => ({ ...vv, timestamp: v }))}
            error={errors.timestamp}
          />
          <MockNumberFormRow
            label="金額"
            value={value.amount}
            onChange={v => setValue(vv => ({ ...vv, amount: v }))}
            error={errors.amount}
          />
          <MockArrayFormRow
            label="内訳"
            value={value.detail}
            onChange={v => setValue(vv => ({ ...vv, detail: v }))}
            error={errors.detail}
            makeNew={() => ({
              label: "",
              price: 0,
              date: value.timestamp
            })}
            Item={CardSnapshotDetailForm}
          />
        </MockFormFrame>
      </div>
    </MockPopup>
  );
};

export default CardSnapshotFormPopup;
