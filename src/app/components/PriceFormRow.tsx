import styled from "@emotion/styled";
import { useMemo } from "react";
import { FormCommonRowWrapper } from "~/common/components/mock-form-ui";
import { em, percent, px } from "~/common/lib/css-util";
import { type ValidationErrorType } from "~/common/lib/form-validator";
import { parseNumber } from "~/common/lib/parser-helper";
import { THEME_COLOR } from "~/app/lib/emotion-mixin";

const InputRow = styled.div<{ minus: boolean }>(({ minus }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-end",
  gap: em(0.5),
  color: minus ? THEME_COLOR.MINUS : "inherit",
  borderBottom: `solid ${px(1)} ${THEME_COLOR.DARK}`,
  input: {
    border: "none",
    display: "block",
    boxSizing: "border-box",
    width: percent(100),
    font: "inherit",
    color: "inherit"
  }
}));

const PriceFormRow = ({
  label,
  value,
  minus = false,
  onChange,
  error
}: {
  label: string;
  value: number;
  minus?: boolean;
  onChange: (v: number) => void;
  error: ValidationErrorType | null;
}) => {
  const normalizedValue = useMemo(
    () => (minus ? -1 : 1) * value,
    [minus, value]
  );
  const handleChange = (v: number) => onChange((minus ? -1 : 1) * v);
  return (
    <FormCommonRowWrapper label={label} error={error}>
      <InputRow minus={minus}>
        {minus ? <span>-</span> : null}
        <div style={{ flexGrow: 1 }}>
          <input
            type="number"
            value={normalizedValue}
            min={0}
            onChange={e => handleChange(parseNumber(e.target.value))}
          />
        </div>
        <span>円</span>
      </InputRow>
    </FormCommonRowWrapper>
  );
};

export default PriceFormRow;
