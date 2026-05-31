import { useCallback, useMemo, useState } from "react";
import { requiredValidator } from "@m-visioning/core/util/form-validator";
import { type TypedCollectionList } from "@m-visioning/core/util/DataStoreAgent";
import FormOrganizer from "@m-visioning/core/util/FormOrganizer";
import type MoneyPlan from "@m-visioning/core/scheme/MoneyPlan";
import type MoneyBankAccount from "@m-visioning/core/scheme/MoneyBankAccount";
import type MoneyCardAccount from "@m-visioning/core/scheme/MoneyCardAccount";
import { parseMoneyPlanRepeat } from "@m-visioning/core/scheme/MoneyPlan";
import { SPENDING_CATEGORIES } from "@m-visioning/core/scheme/SpendingCategory";
import {
  MockDateFormRow,
  MockFormFrame,
  MockPulldownFormRow,
  MockStringFormRow
} from "~/components/mock-form-ui";
import AppCommonPopup from "~/components/AppCommonPopup";
import PriceFormRow from "~/components/PriceFormRow";

const formOrganizer = new FormOrganizer<MoneyPlan>()
  .fieldValidator("label", requiredValidator())
  .fieldValidator("year", requiredValidator())
  .fieldValidator("month", requiredValidator())
  .fieldValidator("day", requiredValidator());

type PlanFlowType =
  | "bank-input"
  | "bank-transfer"
  | "card-output"
  | "bank-output";

const PLAN_FLOW_TYPE_LABEL: Record<PlanFlowType, string> = {
  "bank-input": "収入",
  "bank-output": "口座支払",
  "card-output": "カード支払",
  "bank-transfer": "振替"
};

const PlanFormPopup = ({
  defaultValue,
  bankList,
  cardList,
  onSubmit,
  onClose
}: {
  defaultValue: MoneyPlan;
  bankList: TypedCollectionList<MoneyBankAccount> | null;
  cardList: TypedCollectionList<MoneyCardAccount> | null;
  onSubmit: (v: MoneyPlan) => void;
  onClose: () => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const { validValue, errors } = useMemo(
    () => formOrganizer.getValidValue(value),
    [value]
  );

  const planFlowType = useMemo(() => {
    if (value.from.type === "input") {
      return "bank-input";
    }
    if (value.to.type === "bank") {
      return "bank-transfer";
    }
    if (value.from.type === "card" && value.to.type === "output") {
      return "card-output";
    }
    return "bank-output";
  }, [value.from.type, value.to.type]);

  const bankOptions = useMemo(
    () =>
      (bankList || []).map(({ id, data }) => ({
        value: id,
        label: data.label
      })),
    [bankList]
  );
  const cardOptions = useMemo(
    () =>
      (cardList || []).map(({ id, data }) => ({
        value: id,
        label: data.label
      })),
    [cardList]
  );
  const repeatOptions = useMemo(
    () => [
      { value: "year", label: "年" },
      { value: "month", label: "月" },
      { value: "week", label: "週" }
    ],
    []
  );

  const categoryOptions = useMemo(
    () => SPENDING_CATEGORIES.map(({ value, label }) => ({ value, label })),
    []
  );

  const handleChangeFlowType = useCallback((t: PlanFlowType) => {
    switch (t) {
      case "bank-input":
        return setValue(vv => ({
          ...vv,
          from: { type: "input" },
          to: {
            type: "bank",
            bankId: vv.to.type === "bank" ? vv.to.bankId : ""
          }
        }));
      case "bank-transfer":
        return setValue(vv => ({
          ...vv,
          from: {
            type: "bank",
            bankId: vv.from.type === "bank" ? vv.from.bankId : ""
          },
          to: {
            type: "bank",
            bankId: vv.to.type === "bank" ? vv.to.bankId : ""
          }
        }));
      case "card-output":
        return setValue(vv => ({
          ...vv,
          from: {
            type: "card",
            cardId: vv.from.type === "card" ? vv.from.cardId : ""
          },
          to: {
            type: "output"
          }
        }));
      default:
        return setValue(vv => ({
          ...vv,
          from: {
            type: "bank",
            bankId: vv.from.type === "bank" ? vv.from.bankId : ""
          },
          to: { type: "output" }
        }));
    }
  }, []);

  return (
    <AppCommonPopup title="入出金予定" onClose={onClose}>
      <div style={{ textAlign: "left" }}>
        <MockFormFrame validValue={validValue} onSubmit={onSubmit}>
          <MockStringFormRow
            label="内容"
            value={value.label}
            onChange={v => setValue(vv => ({ ...vv, label: v }))}
            error={errors.label}
          />
          <PriceFormRow
            label="金額"
            value={value.price}
            onChange={v => setValue(vv => ({ ...vv, price: v }))}
            lock="plus"
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
            label="カテゴリ"
            value={value.category}
            onChange={v => setValue(vv => ({ ...vv, category: v }))}
            options={categoryOptions}
            error={null}
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
          <MockPulldownFormRow
            label="種別"
            options={Object.entries(PLAN_FLOW_TYPE_LABEL).map(([k, v]) => ({
              value: k,
              label: v
            }))}
            noBlank
            value={planFlowType}
            onChange={v => handleChangeFlowType(v as PlanFlowType)}
            error={null}
          />
          {planFlowType === "bank-output" ||
          planFlowType === "bank-transfer" ? (
            <MockPulldownFormRow
              label={planFlowType === "bank-transfer" ? "振込元" : "口座"}
              options={bankOptions}
              value={value.from.type === "bank" ? value.from.bankId : ""}
              onChange={v =>
                setValue(vv => ({
                  ...vv,
                  from: { type: "bank", bankId: v }
                }))
              }
              error={errors.from}
            />
          ) : null}
          {planFlowType === "card-output" ? (
            <MockPulldownFormRow
              label="カード"
              options={cardOptions}
              value={value.from.type === "card" ? value.from.cardId : ""}
              onChange={v =>
                setValue(vv => ({
                  ...vv,
                  from: { type: "card", cardId: v }
                }))
              }
              error={errors.from}
            />
          ) : null}
          {planFlowType === "bank-input" || planFlowType === "bank-transfer" ? (
            <MockPulldownFormRow
              label={planFlowType === "bank-transfer" ? "振込先" : "口座"}
              options={bankOptions}
              value={value.to.type === "bank" ? value.to.bankId : ""}
              onChange={v =>
                setValue(vv => ({
                  ...vv,
                  to: { type: "bank", bankId: v }
                }))
              }
              error={errors.to}
            />
          ) : null}
        </MockFormFrame>
      </div>
    </AppCommonPopup>
  );
};

export default PlanFormPopup;
