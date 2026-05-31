import styled from "@emotion/styled";
import { useMemo } from "react";
import { em, percent, px } from "~/common/css-util";
import { type ValidationErrorType } from "@m-visioning/core/util/form-validator";
import { parseNumber } from "@m-visioning/core/util/parser-helper";
import { THEME_COLOR } from "~/feature/emotion-mixin";
import { FormCommonRowWrapper } from "~/components/mock-form-ui";

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
  lock,
  onChange,
  error
}: {
  label: string;
  value: number;
  lock: "plus" | "minus" | null;
  onChange: (v: number) => void;
  error: ValidationErrorType | null;
}) => {
  const normalizedValue = useMemo(() => {
    // 0は空文字に正規化
    if (!value) {
      return "";
    }
    return (lock === "minus" ? -1 : 1) * value;
  }, [lock, value]);
  const handleChange = (v: number) => onChange((lock === "minus" ? -1 : 1) * v);
  return (
    <FormCommonRowWrapper label={label} error={error}>
      <InputRow minus={value < 0}>
        {lock === "minus" ? <span>-</span> : null}
        <div style={{ flexGrow: 1 }}>
          <input
            type="number"
            value={normalizedValue}
            min={lock ? 0 : undefined}
            onChange={e => handleChange(parseNumber(e.target.value))}
          />
        </div>
        <span>円</span>
      </InputRow>
    </FormCommonRowWrapper>
  );
};

export default PriceFormRow;
