import { type ComponentPropsWithoutRef, useMemo, useState } from "react";
import {
  MockArrayFormRow,
  MockDateTimeFormRow,
  MockFormFrame,
  MockPulldownFormRow,
  MockStringFormRow
} from "~/common/components/mock-form-ui";
import FormOrganizer from "~/common/lib/FormOrganizer";
import {
  requiredValidator,
  subArrayFieldValidator
} from "~/common/lib/form-validator";
import MockActionButton from "~/common/components/MockActionButton";
import PriceFormRow from "~/app/components/PriceFormRow";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import { SPENDING_CATEGORIES } from "~/app/scheme/SpendingCategory";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "未分類" },
  ...SPENDING_CATEGORIES.map(c => ({ value: c.value, label: c.label }))
];

type BankDetailItem = BankSnapshot["detail"][number];
type CardDetailItem = CardSnapshot["detail"][number];

const bankDetailOrganizer = new FormOrganizer<BankDetailItem>()
  .fieldValidator("label", requiredValidator())
  .fieldValidator("price", requiredValidator())
  .fieldValidator("date", requiredValidator());

const cardDetailOrganizer = new FormOrganizer<CardDetailItem>()
  .fieldValidator("label", requiredValidator())
  .fieldValidator("price", requiredValidator())
  .fieldValidator("date", requiredValidator());

const bankFormOrganizer = new FormOrganizer<BankSnapshot>()
  .fieldValidator("amount", requiredValidator())
  .fieldValidator("detail", subArrayFieldValidator(bankDetailOrganizer));

const cardFormOrganizer = new FormOrganizer<CardSnapshot>()
  .fieldValidator("amount", requiredValidator())
  .fieldValidator("detail", subArrayFieldValidator(cardDetailOrganizer));

const SnapshotDetailForm = ({
  value,
  onChange,
  lock
}: {
  value: BankDetailItem;
  onChange: (v: BankDetailItem) => void;
  lock: ComponentPropsWithoutRef<typeof PriceFormRow>["lock"];
}) => {
  const errors = useMemo(
    () => bankDetailOrganizer.getErrors(value),
    [value]
  );
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
      <PriceFormRow
        label="金額"
        lock={lock}
        value={value.price}
        onChange={v => onChange({ ...value, price: v })}
        error={errors.price}
      />
    </>
  );
};

const CardSnapshotDetailForm = ({
  value,
  onChange,
  lock
}: {
  value: CardDetailItem;
  onChange: (v: CardDetailItem) => void;
  lock: ComponentPropsWithoutRef<typeof PriceFormRow>["lock"];
}) => {
  const errors = useMemo(
    () => cardDetailOrganizer.getErrors(value),
    [value]
  );
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
      <PriceFormRow
        label="金額"
        lock={lock}
        value={value.price}
        onChange={v => onChange({ ...value, price: v })}
        error={errors.price}
      />
      <MockPulldownFormRow
        label="カテゴリ"
        value={value.category}
        onChange={v => onChange({ ...value, category: v })}
        options={CATEGORY_OPTIONS}
        error={null}
      />
    </>
  );
};

const SnapshotForm = ({
  defaultValue,
  onDelete,
  onSubmit
}: {
  defaultValue: BankSnapshot;
  onDelete?: () => void;
  onSubmit: (v: BankSnapshot) => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const { validValue, errors } = useMemo(
    () => bankFormOrganizer.getValidValue(value),
    [value]
  );
  return (
    <div style={{ textAlign: "left" }}>
      <MockFormFrame validValue={validValue} onSubmit={onSubmit}>
        <MockDateTimeFormRow
          label="日時"
          value={value.timestamp}
          onChange={v => setValue(vv => ({ ...vv, timestamp: v }))}
          error={errors.timestamp}
        />
        <PriceFormRow
          label="金額"
          value={value.amount}
          lock="plus"
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
          props={{ lock: null }}
          Item={SnapshotDetailForm}
        />
        {onDelete ? (
          <p>
            <MockActionButton action={{ type: "button", onClick: onDelete }}>
              このログを削除
            </MockActionButton>
          </p>
        ) : null}
      </MockFormFrame>
    </div>
  );
};

export const CardSnapshotForm = ({
  defaultValue,
  onDelete,
  onSubmit
}: {
  defaultValue: CardSnapshot;
  onDelete?: () => void;
  onSubmit: (v: CardSnapshot) => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const { validValue, errors } = useMemo(
    () => cardFormOrganizer.getValidValue(value),
    [value]
  );
  return (
    <div style={{ textAlign: "left" }}>
      <MockFormFrame validValue={validValue} onSubmit={onSubmit}>
        <MockDateTimeFormRow
          label="日時"
          value={value.timestamp}
          onChange={v => setValue(vv => ({ ...vv, timestamp: v }))}
          error={errors.timestamp}
        />
        <PriceFormRow
          label="金額"
          value={value.amount}
          lock="minus"
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
            date: value.timestamp,
            category: ""
          })}
          props={{ lock: null }}
          Item={CardSnapshotDetailForm}
        />
        {onDelete ? (
          <p>
            <MockActionButton action={{ type: "button", onClick: onDelete }}>
              このログを削除
            </MockActionButton>
          </p>
        ) : null}
      </MockFormFrame>
    </div>
  );
};

export default SnapshotForm;
