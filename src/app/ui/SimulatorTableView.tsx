import styled from "@emotion/styled";
import { Fragment, useCallback } from "react";
import MockActionButton from "~/common/components/MockActionButton";
import { em } from "~/common/lib/css-util";
import type CommonActionParameter from "~/common/scheme/CommonActionParameter";
import { formatDateLabel } from "~/common/lib/date-util";
import { parseString } from "~/common/lib/parser-helper";
import { PAGE_CARD_SNAPSHOT_LIST } from "~/app/core/page-path";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import { type SimulatorRow } from "~/app/core/useSimulatorRows";

const TableCell = styled.p<{ isArchive: boolean; align?: "left" | "right" }>(
  ({ isArchive, align = "left" }) => ({
    opacity: isArchive ? 0.5 : 1,
    textAlign: align
  })
);

const SimulatorTableView = ({
  lastSnapshot,
  rows,
  onClickRow
}: {
  lastSnapshot: BankSnapshot | null;
  rows: SimulatorRow[];
  onClickRow: (s: SimulatorRow["source"]) => void;
}) => {
  const calcAction = useCallback(
    ({
      source,
      cardLink
    }: Pick<
      SimulatorRow,
      "source" | "cardLink"
    >): CommonActionParameter | null => {
      if (cardLink) {
        return {
          type: "page-link",
          page: PAGE_CARD_SNAPSHOT_LIST.withQuery({
            card: cardLink.cardId,
            month: parseString(cardLink.monthCode)
          })
        };
      }
      if (source) {
        return {
          type: "button",
          onClick: () => onClickRow(source)
        };
      }
      return null;
    },
    [onClickRow]
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: em(4, "auto", 6, 6)
      }}
    >
      {lastSnapshot ? (
        <>
          <TableCell isArchive />
          <TableCell isArchive />
          <TableCell isArchive />
          <TableCell isArchive align="right">
            {lastSnapshot.amount}
          </TableCell>
        </>
      ) : null}
      {rows.map(
        ({ date, id, label, price, amount, isArchive, source, cardLink }) => (
          <Fragment key={[date, id].join("_")}>
            <TableCell isArchive={isArchive}>{formatDateLabel(date)}</TableCell>
            <TableCell isArchive={isArchive}>
              <MockActionButton action={calcAction({ source, cardLink })}>
                {label}
              </MockActionButton>
            </TableCell>
            <TableCell isArchive={isArchive} align="right">
              {price}
            </TableCell>
            <TableCell isArchive={isArchive} align="right">
              {amount}
            </TableCell>
          </Fragment>
        )
      )}
    </div>
  );
};

export default SimulatorTableView;
