import { useMemo, useState } from "react";
import MockPopup from "~/common/components/MockPopup";
import {
  FormCommonRowWrapper,
  MockDateFormRow,
  MockFormFrame,
  MockNumberFormRow,
  MockPulldownFormRow,
  MockStringFormRow
} from "~/common/components/mock-form-ui";
import FormOrganizer from "~/common/lib/FormOrganizer";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { requiredValidator } from "~/common/lib/form-validator";
import { matchMoneyNode } from "~/app/components/BankTableScene";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import {
  type BankMoneyNode,
  type ToMoneyNode,
  type FromMoneyNode,
  type CardMoneyNode,
  parseMoneyPlanRepeat
} from "~/app/scheme/MoneyPlan";

const formOrganizer = new FormOrganizer<MoneyPlan>()
  .fieldValidator("label", requiredValidator())
  .fieldValidator("year", requiredValidator())
  .fieldValidator("month", requiredValidator())
  .fieldValidator("day", requiredValidator());

const PlanFormPopup = ({
  defaultValue,
  bankList,
  cardList,
  onSubmit,
  onClose
}: {
  defaultValue: MoneyPlan;
  bankList: TypedCollectionList<MoneyBankAccount>;
  cardList: TypedCollectionList<MoneyCardAccount>;
  onSubmit: (v: MoneyPlan) => void;
  onClose: () => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const { validValue, errors } = useMemo(
    () => formOrganizer.getValidValue(value),
    [value]
  );

  const bankOptions = useMemo(
    () =>
      bankList.map<{ id: string; label: string; data: BankMoneyNode }>(
        ({ id, data }) => ({
          id: `bank_${id}`,
          label: `口座: ${data.label}`,
          data: { type: "bank", bankId: id }
        })
      ),
    [bankList]
  );
  const cardOptions = useMemo(
    () =>
      cardList.map<{ id: string; label: string; data: CardMoneyNode }>(
        ({ id, data }) => ({
          id: `card_${id}`,
          label: `カード: ${data.label}`,
          data: { type: "card", cardId: id }
        })
      ),
    [cardList]
  );
  const fromOptions = useMemo(
    (): { id: string; label: string; data: FromMoneyNode }[] => [
      { id: "input", label: "収入", data: { type: "input" } },
      ...bankOptions,
      ...cardOptions
    ],
    [bankOptions, cardOptions]
  );
  const toOptions = useMemo(
    (): { id: string; label: string; data: ToMoneyNode }[] => [
      { id: "output", label: "支出", data: { type: "output" } },
      ...bankOptions
    ],
    [bankOptions]
  );

  const repeatOptions = useMemo(
    () => [
      { value: "year", label: "年" },
      { value: "month", label: "月" }
    ],
    []
  );

  return (
    <MockPopup onClose={onClose}>
      <div style={{ textAlign: "left" }}>
        <MockFormFrame validValue={validValue} onSubmit={onSubmit}>
          <MockStringFormRow
            label="内容"
            value={value.label}
            onChange={v => setValue(vv => ({ ...vv, label: v }))}
            error={errors.label}
          />
          <MockNumberFormRow
            label="金額"
            value={value.price}
            onChange={v => setValue(vv => ({ ...vv, price: v }))}
            error={errors.price}
          />
          <MockDateFormRow
            label="日付"
            error={errors.year || errors.month || errors.day}
            value={[value.year, value.month, value.day]}
            onChange={v => {
              const [y, m, d] = v;
              setValue(vv => ({ ...vv, year: y, month: m, day: d }));
            }}
          />
          <MockPulldownFormRow
            label="繰り返し"
            value={value.repeat || "none"}
            onChange={v =>
              setValue(vv => ({ ...vv, repeat: parseMoneyPlanRepeat(v) }))
            }
            options={repeatOptions}
            error={errors.repeat}
          />
          <FormCommonRowWrapper label="from" error={null}>
            {fromOptions.map(({ id, label, data }) => (
              <p key={id}>
                <label>
                  <input
                    type="radio"
                    name="from"
                    checked={matchMoneyNode(value.from, data)}
                    onChange={e => {
                      if (e.target.checked) {
                        setValue(v => ({
                          ...v,
                          from: data
                        }));
                      }
                    }}
                  />
                  {label}
                </label>
              </p>
            ))}
          </FormCommonRowWrapper>
          <FormCommonRowWrapper label="to" error={null}>
            {toOptions.map(({ id, label, data }) => (
              <p key={id}>
                <label>
                  <input
                    type="radio"
                    name="to"
                    checked={matchMoneyNode(value.to, data)}
                    onChange={e => {
                      if (e.target.checked) {
                        setValue(v => ({
                          ...v,
                          to: data
                        }));
                      }
                    }}
                  />
                  {label}
                </label>
              </p>
            ))}
          </FormCommonRowWrapper>
        </MockFormFrame>
      </div>
    </MockPopup>
  );
};

export default PlanFormPopup;
