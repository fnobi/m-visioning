import { useMemo, useState } from "react";
import {
  MockFormFrame,
  MockNumberFormRow,
  MockPulldownFormRow,
  MockStringFormRow
} from "~/common/components/mock-form-ui";
import FormOrganizer from "~/common/lib/FormOrganizer";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { requiredValidator } from "~/common/lib/form-validator";
import AppCommonPopup from "~/app/components/AppCommonPopup";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";

const formOrganizer = new FormOrganizer<MoneyCardAccount>()
  .fieldValidator("label", requiredValidator())
  .fieldValidator("bankId", requiredValidator())
  .fieldValidator("startDay", requiredValidator())
  .fieldValidator("order", requiredValidator());

const CardAccountFormPopup = ({
  defaultValue,
  bankList,
  onSubmit,
  onClose
}: {
  defaultValue: MoneyCardAccount;
  bankList: TypedCollectionList<MoneyBankAccount>;
  onSubmit: (v: MoneyCardAccount) => void;
  onClose: () => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const { validValue, errors } = useMemo(
    () => formOrganizer.getValidValue(value),
    [value]
  );

  const bankOptions = useMemo(
    () => bankList.map(({ id, data }) => ({ value: id, label: data.label })),
    [bankList]
  );

  return (
    <AppCommonPopup title="カード情報" onClose={onClose}>
      <div style={{ textAlign: "left" }}>
        <MockFormFrame
          validValue={validValue}
          onSubmit={onSubmit}
          onCancel={onClose}
        >
          <MockStringFormRow
            label="名前"
            value={value.label}
            onChange={v => setValue(vv => ({ ...vv, label: v }))}
            error={errors.label}
          />
          <MockPulldownFormRow
            label="口座"
            options={bankOptions}
            value={value.bankId}
            onChange={v =>
              setValue(vv => ({
                ...vv,
                bankId: v
              }))
            }
            error={errors.bankId}
          />
          <MockNumberFormRow
            label="開始日"
            value={value.startDay}
            min={0}
            onChange={v =>
              setValue(vv => ({
                ...vv,
                startDay: v
              }))
            }
            error={errors.startDay}
          />
          <MockNumberFormRow
            label="順序"
            value={value.order}
            min={0}
            onChange={v =>
              setValue(vv => ({
                ...vv,
                order: v
              }))
            }
            error={errors.order}
          />
        </MockFormFrame>
      </div>
    </AppCommonPopup>
  );
};

export default CardAccountFormPopup;
