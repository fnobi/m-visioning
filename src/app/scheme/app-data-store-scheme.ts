import { type DataStoreScheme } from "~/common/lib/DataStoreAgent";
import type CommonPermission from "~/common/scheme/CommonPermission";
import { parseCommonPermission } from "~/common/scheme/CommonPermission";
import type BoardPost from "~/app/scheme/BoardPost";
import { parseBoardPost } from "~/app/scheme/BoardPost";
import type BoardEvent from "~/app/scheme/BoardEvent";
import { parseBoardEvent } from "~/app/scheme/BoardEvent";

export const ownerDataStoreScheme: DataStoreScheme<
  CommonPermission,
  { userId: string }
> = {
  name: "admins",
  parse: parseCommonPermission,
  documentId: ({ userId }) => userId
};

export const boardEventDataStoreScheme: DataStoreScheme<
  BoardEvent,
  { boardId: string }
> = {
  name: "boardEvents",
  parse: parseBoardEvent,
  documentId: ({ boardId }) => boardId
};

export const boardPostDataStoreScheme: DataStoreScheme<
  BoardPost,
  { postId: string },
  { boardId: string }
> = {
  name: "boardPosts",
  parse: parseBoardPost,
  documentId: ({ postId }) => postId,
  parentCollection: boardEventDataStoreScheme
};
