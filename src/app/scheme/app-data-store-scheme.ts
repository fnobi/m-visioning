import { type DataStoreScheme } from "~/common/lib/DataStoreAgent";
import type CommonPermission from "~/common/scheme/CommonPermission";
import { parseCommonPermission } from "~/common/scheme/CommonPermission";
import type BoardPost from "~/app/scheme/BoardPost";
import { parseBoardPost } from "~/app/scheme/BoardPost";

export const ownerDataStoreScheme: DataStoreScheme<
  CommonPermission,
  { userId: string }
> = {
  name: "admins",
  parse: parseCommonPermission,
  documentId: ({ userId }) => userId
};

export const boardPostDataStoreScheme: DataStoreScheme<
  BoardPost,
  { postId: string }
> = {
  name: "boardPosts",
  parse: parseBoardPost,
  documentId: ({ postId }) => postId
};
