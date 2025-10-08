import { parseObject, parseString } from "~/common/lib/parser-helper";
import type TimestampMock from "~/common/scheme/TimestampMock";
import { parseTimestampMock } from "~/common/scheme/TimestampMock";

type BoardPost = {
  createdAt: TimestampMock | null;
  nickname: string;
  body: string;
  userId: string;
};

export const parseBoardPost = (src: unknown) =>
  parseObject<BoardPost>(src, ({ createdAt, nickname, body, userId }) => ({
    createdAt: parseTimestampMock(createdAt),
    nickname: parseString(nickname),
    body: parseString(body),
    userId: parseString(userId)
  }));

export default BoardPost;
