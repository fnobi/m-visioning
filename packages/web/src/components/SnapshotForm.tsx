import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useMemo,
  useState
} from "react";
import FormOrganizer from "@m-visioning/core/util/FormOrganizer";
import {
  type ValidationErrorType,
  requiredValidator,
  subArrayFieldValidator
} from "@m-visioning/core/util/form-validator";
import type CardSnapshot from "@m-visioning/core/scheme/CardSnapshot";
import type BankSnapshot from "@m-visioning/core/scheme/BankSnapshot";
import { SPENDING_CATEGORIES } from "@m-visioning/core/scheme/SpendingCategory";
import {
  MockArrayFormRow,
  MockDateTimeFormRow,
  MockFormFrame,
  MockPulldownFormRow,
  MockStringFormRow
} from "~/components/mock-form-ui";
import MockActionButton from "~/components/MockActionButton";
import PriceFormRow from "~/components/PriceFormRow";

const CATEGORY_OPTIONS = SPENDING_CATEGORIES.map(c => ({
  value: c.value,
  label: c.label
}));

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
  const errors = useMemo(() => bankDetailOrganizer.getErrors(value), [value]);
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
  const errors = useMemo(() => cardDetailOrganizer.getErrors(value), [value]);
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

// ---- 共通基底フォーム ----

type SnapshotFormChildrenContext<T> = {
  value: T;
  setValue: (fn: (v: T) => T) => void;
  errors: Record<keyof T, ValidationErrorType | null>;
};

const SnapshotForm = <T extends BankSnapshot | CardSnapshot>({
  defaultValue,
  lock,
  organizer,
  onDelete,
  onSubmit,
  children
}: {
  defaultValue: T;
  lock: "plus" | "minus";
  organizer: FormOrganizer<T>;
  onDelete?: () => void;
  onSubmit: (v: T) => void;
  children?: (ctx: SnapshotFormChildrenContext<T>) => ReactNode;
}) => {
  const [value, setValue] = useState<T>(defaultValue);
  const { validValue, errors } = useMemo(
    () => organizer.getValidValue(value),
    [organizer, value]
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
          lock={lock}
          value={value.amount}
          onChange={v => setValue(vv => ({ ...vv, amount: v }))}
          error={errors.amount}
        />
        {children?.({ value, setValue, errors })}
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

// ---- 銀行用ラッパー ----

export const BankSnapshotForm = ({
  defaultValue,
  onDelete,
  onSubmit
}: {
  defaultValue: BankSnapshot;
  onDelete?: () => void;
  onSubmit: (v: BankSnapshot) => void;
}) => (
  <SnapshotForm
    defaultValue={defaultValue}
    lock="plus"
    organizer={bankFormOrganizer}
    onDelete={onDelete}
    onSubmit={onSubmit}
  >
    {({ value, setValue, errors }) => (
      <MockArrayFormRow
        label="内訳"
        value={value.detail}
        onChange={v => setValue(vv => ({ ...vv, detail: v }))}
        error={errors.detail}
        makeNew={() => ({ label: "", price: 0, date: value.timestamp })}
        props={{ lock: null }}
        Item={SnapshotDetailForm}
      />
    )}
  </SnapshotForm>
);

// ---- カード用ラッパー ----

export const CardSnapshotForm = ({
  defaultValue,
  onDelete,
  onSubmit
}: {
  defaultValue: CardSnapshot;
  onDelete?: () => void;
  onSubmit: (v: CardSnapshot) => void;
}) => (
  <SnapshotForm
    defaultValue={defaultValue}
    lock="minus"
    organizer={cardFormOrganizer}
    onDelete={onDelete}
    onSubmit={onSubmit}
  >
    {({ value, setValue, errors }) => (
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
    )}
  </SnapshotForm>
);
