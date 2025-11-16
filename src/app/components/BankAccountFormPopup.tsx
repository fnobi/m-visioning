import { useMemo, useState } from "react";
import {
  MockFormFrame,
  MockNumberFormRow,
  MockStringFormRow
} from "~/common/components/mock-form-ui";
import FormOrganizer from "~/common/lib/FormOrganizer";
import { requiredValidator } from "~/common/lib/form-validator";
import AppCommonPopup from "~/app/components/AppCommonPopup";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";

const formOrganizer = new FormOrganizer<MoneyBankAccount>()
  .fieldValidator("label", requiredValidator())
  .fieldValidator("order", requiredValidator());

const BankAccountFormPopup = ({
  defaultValue,
  onSubmit,
  onClose
}: {
  defaultValue: MoneyBankAccount;
  onSubmit: (v: MoneyBankAccount) => void;
  onClose: () => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const { validValue, errors } = useMemo(
    () => formOrganizer.getValidValue(value),
    [value]
  );

  return (
    <AppCommonPopup title="口座情報" onClose={onClose}>
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

export default BankAccountFormPopup;
