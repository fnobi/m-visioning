import { useMemo } from "react";
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
import type BankSnapshot from "~/app/scheme/BankSnapshot";

const formOrganizer2 = new FormOrganizer<
  BankSnapshot["detail"][number]
>().fieldValidator("label", requiredValidator());
const formOrganizer1 = new FormOrganizer<BankSnapshot>().fieldValidator(
  "detail",
  subArrayFieldValidator(formOrganizer2)
);

const BankSnapshotDetailForm = ({
  value,
  onChange
}: {
  value: BankSnapshot["detail"][number];
  onChange: (v: BankSnapshot["detail"][number]) => void;
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

const NewBankSnapshotPopup = ({
  value,
  onClose,
  onChange,
  onSubmit
}: {
  value: BankSnapshot;
  onClose: () => void;
  onChange: (v: BankSnapshot) => void;
  onSubmit: (v: BankSnapshot) => void;
}) => {
  const { validValue, errors } = useMemo(
    () => formOrganizer1.getValidValue(value),
    [value]
  );
  return (
    <MockPopup onClose={onClose}>
      <p>新規ログ</p>
      <div
        style={{
          textAlign: "left"
        }}
      >
        <MockFormFrame validValue={validValue} onSubmit={onSubmit}>
          <MockDateTimeFormRow
            label="日時"
            value={value.timestamp}
            onChange={v => onChange({ ...value, timestamp: v })}
            error={errors.timestamp}
          />
          <MockNumberFormRow
            label="金額"
            value={value.amount}
            onChange={v => onChange({ ...value, amount: v })}
            error={errors.amount}
          />
          <MockArrayFormRow
            label="内訳"
            value={value.detail}
            onChange={v => onChange({ ...value, detail: v })}
            error={errors.detail}
            makeNew={() => ({ label: "", price: 0, date: value.timestamp })}
            Item={BankSnapshotDetailForm}
          />
        </MockFormFrame>
      </div>
    </MockPopup>
  );
};

export default NewBankSnapshotPopup;
