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
import type MoneyPlan from "~/app/scheme/MoneyPlan";

const formOrganizer = new FormOrganizer<MoneyPlan>();

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
  onSubmit,
  onClose
}: {
  defaultValue: MoneyPlan;
  onSubmit: (v: MoneyPlan) => void;
  onClose: () => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const { validValue, errors } = useMemo(
    () => formOrganizer.getValidValue(value),
    [value]
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
          </FormCommonRowWrapper>{" "}
          <div>{JSON.stringify(value.from)}</div>
          <div>{JSON.stringify(value.to)}</div>
        </MockFormFrame>
      </div>
    </MockPopup>
  );
};

export default PlanFormPopup;
