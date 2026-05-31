import { type ReactNode } from "react";
import { formatDateLabel } from "~/common/date-util";
import MockActionButton from "~/components/MockActionButton";
import type useMonthCursor from "~/feature/useMonthCursor";

const MonthCursorNavi = ({
  monthCursor,
  children
}: {
  monthCursor: ReturnType<typeof useMonthCursor>;
  children?: ReactNode;
}) => {
  if (!monthCursor.monthStartDate) {
    return null;
  }
  return (
    <div>
      <p>
        {formatDateLabel(monthCursor.minTimestamp, true)}&nbsp;-&nbsp;
        {formatDateLabel(monthCursor.maxTimestamp - 1, true)}
      </p>
      <p>
        <MockActionButton
          action={{
            type: "button",
            onClick: () => monthCursor.incrementMonthCode(-1)
          }}
        >
          &lt;前へ
        </MockActionButton>
        ・{children ? <>{children}・</> : null}
        <MockActionButton
          action={{
            type: "button",
            onClick: () => monthCursor.incrementMonthCode(1)
          }}
        >
          次へ&gt;
        </MockActionButton>
      </p>
    </div>
  );
};

export default MonthCursorNavi;
