import { formatDateLabel } from "~/common/lib/date-util";
import MockActionButton from "~/common/components/MockActionButton";
import type useMonthCursor from "~/app/lib/useMonthCursor";

const MonthCursorNavi = ({
  monthCursor
}: {
  monthCursor: ReturnType<typeof useMonthCursor>;
}) => {
  if (!monthCursor.monthStartDate) {
    return null;
  }
  return (
    <div>
      <p>{formatDateLabel(monthCursor.monthStartDate, true)}-</p>
      <p>
        <MockActionButton
          action={{
            type: "button",
            onClick: () => monthCursor.incrementMonthCode(-1)
          }}
        >
          &lt;前へ
        </MockActionButton>
        ・
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
