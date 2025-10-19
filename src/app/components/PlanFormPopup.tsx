import { useMemo, useState } from "react";
import MockPopup from "~/common/components/MockPopup";
import {
  MockFormFrame,
  MockNumberFormRow,
  MockStringFormRow
} from "~/common/components/mock-form-ui";
import FormOrganizer from "~/common/lib/FormOrganizer";
import type MoneyPlan from "~/app/scheme/MoneyPlan";

const formOrganizer = new FormOrganizer<MoneyPlan>();

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
        </MockFormFrame>
      </div>
    </MockPopup>
  );
};

export default PlanFormPopup;
