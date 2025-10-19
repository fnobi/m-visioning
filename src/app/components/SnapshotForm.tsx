import { useMemo, useState } from "react";
import {
  MockArrayFormRow,
  MockDateTimeFormRow,
  MockFormFrame,
  MockNumberFormRow,
  MockStringFormRow
} from "~/common/components/mock-form-ui";
import FormOrganizer from "~/common/lib/FormOrganizer";
import {
  requiredValidator,
  subArrayFieldValidator
} from "~/common/lib/form-validator";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import type BankSnapshot from "~/app/scheme/BankSnapshot";

const formOrganizer2 = new FormOrganizer<BankSnapshot["detail"][number]>()
  .fieldValidator("label", requiredValidator())
  .fieldValidator("price", requiredValidator())
  .fieldValidator("date", requiredValidator());

const formOrganizer1 = new FormOrganizer<
  BankSnapshot | CardSnapshot
>().fieldValidator("detail", subArrayFieldValidator(formOrganizer2));

const SnapshotDetailForm = ({
  value,
  onChange
}: {
  value: BankSnapshot["detail"][number];
  onChange: (v: BankSnapshot["detail"][number]) => void;
}) => {
  const errors = useMemo(() => formOrganizer2.getErrors(value), [value]);
  return (
    <>
      <MockDateTimeFormRow
        label="日時"
        value={value.date}
        onChange={v => onChange({ ...value, date: v })}
        error={errors.date}
      />
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

const SnapshotForm = ({
  defaultValue,
  onSubmit
}: {
  defaultValue: BankSnapshot | CardSnapshot;
  onSubmit: (v: BankSnapshot | CardSnapshot) => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const { validValue, errors } = useMemo(
    () => formOrganizer1.getValidValue(value),
    [value]
  );
  return (
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
          Item={SnapshotDetailForm}
        />
      </MockFormFrame>
    </div>
  );
};

export default SnapshotForm;
