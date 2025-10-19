import { useMemo, useState } from "react";
import styled from "@emotion/styled";
import MockPopup from "~/common/components/MockPopup";
import {
  FormCommonRowWrapper,
  MockFormFrame,
  MockNumberFormRow,
  MockStringFormRow
} from "~/common/components/mock-form-ui";
import FormOrganizer from "~/common/lib/FormOrganizer";
import { parseNumber } from "~/common/lib/parser-helper";
import MockActionButton from "~/common/components/MockActionButton";
import { em, percent } from "~/common/lib/css-util";
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
  type CardMoneyNode
} from "~/app/scheme/MoneyPlan";

const formOrganizer = new FormOrganizer<MoneyPlan>()
  .fieldValidator("label", requiredValidator())
  .fieldValidator("day", requiredValidator());

const DateInputRow = styled.div({
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
});

const DateInputUnit = styled.div<{ cols: number }>(({ cols }) => ({
  width: em(cols),
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
}));

const DateInputCell = styled.input({
  width: percent(100),
  textAlign: "center"
});

const DateNumPair = ({
  value,
  onChange,
  getNew,
  cols,
  postfix
}: {
  value: number;
  onChange: (v: number) => void;
  getNew: () => number;
  cols: number;
  postfix: string;
}) => (
  <>
    <DateInputUnit cols={cols}>
      {value ? (
        <DateInputCell
          type="number"
          value={value}
          onChange={e => onChange(parseNumber(e.target.value))}
        />
      ) : (
        <MockActionButton
          action={{
            type: "button",
            onClick: () => onChange(getNew())
          }}
        >
          *
        </MockActionButton>
      )}
    </DateInputUnit>
    <span>{postfix}</span>
  </>
);

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
          <FormCommonRowWrapper label="日付" error={null}>
            <DateInputRow>
              <DateNumPair
                value={value.year}
                onChange={v =>
                  setValue(vv => ({
                    ...vv,
                    year: v
                  }))
                }
                postfix="年"
                cols={3}
                getNew={() => new Date().getFullYear()}
              />
              <DateNumPair
                value={value.month}
                onChange={v =>
                  setValue(vv => ({
                    ...vv,
                    month: v
                  }))
                }
                postfix="月"
                cols={2}
                getNew={() => new Date().getMonth() + 1}
              />
              <DateNumPair
                value={value.day}
                onChange={v =>
                  setValue(vv => ({
                    ...vv,
                    day: v
                  }))
                }
                postfix="日"
                cols={2}
                getNew={() => new Date().getDate()}
              />
            </DateInputRow>
          </FormCommonRowWrapper>
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
