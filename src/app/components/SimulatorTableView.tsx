import styled from "@emotion/styled";
import { Fragment } from "react";
import MockActionButton from "~/common/components/MockActionButton";
import { em } from "~/common/lib/css-util";
import type CommonActionParameter from "~/common/scheme/CommonActionParameter";
import { formatDateLabel } from "~/common/lib/date-util";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import { type SimulatorRow } from "~/app/lib/useSimulatorRows";

const TableCell = styled.p<{ isArchive: boolean; align?: "left" | "right" }>(
  ({ isArchive, align = "left" }) => ({
    opacity: isArchive ? 0.5 : 1,
    textAlign: align
  })
);

const SimulatorTableView = ({
  lastSnapshot,
  rows,
  calcRowAction
}: {
  lastSnapshot: BankSnapshot | null;
  rows: SimulatorRow[];
  calcRowAction: (a: SimulatorRow["action"]) => CommonActionParameter | null;
}) => (
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
    {rows.map(({ date, id, label, price, amount, isArchive, action }) => (
      <Fragment key={[date, id].join("_")}>
        <TableCell isArchive={isArchive}>{formatDateLabel(date)}</TableCell>
        <TableCell isArchive={isArchive}>
          <MockActionButton action={calcRowAction(action)}>
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
    ))}
  </div>
);

export default SimulatorTableView;
