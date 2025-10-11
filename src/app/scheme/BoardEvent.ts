import { parseObject, parseString } from "~/common/lib/parser-helper";
import type TimestampMock from "~/common/scheme/TimestampMock";
import { parseTimestampMock } from "~/common/scheme/TimestampMock";

type BoardEvent = {
  createdAt: TimestampMock | null;
  title: string;
};

export const parseBoardEvent = (src: unknown) =>
  parseObject<BoardEvent>(src, ({ createdAt, title }) => ({
    createdAt: parseTimestampMock(createdAt),
    title: parseString(title)
  }));

export default BoardEvent;
