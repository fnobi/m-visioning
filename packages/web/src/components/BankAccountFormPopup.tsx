import { useMemo, useState } from "react";
import FormOrganizer from "@m-visioning/core/util/FormOrganizer";
import { requiredValidator } from "@m-visioning/core/util/form-validator";
import type MoneyBankAccount from "@m-visioning/core/schema/MoneyBankAccount";
import {
  MockFormFrame,
  MockNumberFormRow,
  MockStringFormRow
} from "~/components/mock-form-ui";
import AppCommonPopup from "~/components/AppCommonPopup";

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
