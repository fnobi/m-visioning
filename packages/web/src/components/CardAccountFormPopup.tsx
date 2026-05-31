import { useMemo, useState } from "react";
import FormOrganizer from "@m-visioning/core/util/FormOrganizer";
import { type TypedCollectionList } from "@m-visioning/core/util/DataStoreAgent";
import { requiredValidator } from "@m-visioning/core/util/form-validator";
import type MoneyCardAccount from "@m-visioning/core/scheme/MoneyCardAccount";
import type MoneyBankAccount from "@m-visioning/core/scheme/MoneyBankAccount";
import {
  MockFormFrame,
  MockNumberFormRow,
  MockPulldownFormRow,
  MockStringFormRow
} from "~/components/mock-form-ui";
import AppCommonPopup from "~/components/AppCommonPopup";

const formOrganizer = new FormOrganizer<MoneyCardAccount>()
  .fieldValidator("label", requiredValidator())
  .fieldValidator("bankId", requiredValidator())
  .fieldValidator("startDay", requiredValidator())
  .fieldValidator("paymentDay", requiredValidator())
  .fieldValidator("paymentMonthOffset", requiredValidator())
  .fieldValidator("order", requiredValidator());

const CardAccountFormPopup = ({
  defaultValue,
  bankList,
  onSubmit,
  onClose
}: {
  defaultValue: MoneyCardAccount;
  bankList: TypedCollectionList<MoneyBankAccount> | null;
  onSubmit: (v: MoneyCardAccount) => void;
  onClose: () => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const { validValue, errors } = useMemo(
    () => formOrganizer.getValidValue(value),
    [value]
  );

  const bankOptions = useMemo(
    () =>
      (bankList || []).map(({ id, data }) => ({
        value: id,
        label: data.label
      })),
    [bankList]
  );
  const paymentMonthOffset = useMemo(
    () => [
      { value: 1, label: "翌月" },
      { value: 2, label: "翌々月" }
    ],
    []
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
          <MockPulldownFormRow
            label="支払月"
            value={value.paymentMonthOffset}
            options={paymentMonthOffset}
            onChange={v =>
              setValue(vv => ({
                ...vv,
                paymentMonthOffset: v
              }))
            }
            error={errors.paymentDay}
          />
          <MockNumberFormRow
            label="支払日"
            value={value.paymentDay}
            min={0}
            onChange={v =>
              setValue(vv => ({
                ...vv,
                paymentDay: v
              }))
            }
            error={errors.paymentDay}
          />
          <MockNumberFormRow
            label="最低利用額予想"
            value={value.minAmount}
            min={0}
            onChange={v =>
              setValue(vv => ({
                ...vv,
                minAmount: v
              }))
            }
            error={errors.minAmount}
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
