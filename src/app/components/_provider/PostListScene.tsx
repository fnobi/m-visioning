import { useCallback, useMemo, useState } from "react";
import MockActionButton from "~/common/components/MockActionButton";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import MockLoadingPopup from "~/common/components/MockLoadingPopup";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import PostListCell from "~/app/components/PostListCell";
import ErrorScene from "~/app/components/ErrorScene";
import {
  useBoardPostList,
  useBoardPostMoreLoader
} from "~/app/lib/database/board-post-database";
import ErrorPopup from "~/app/components/ErrorPopup";
import useAsyncHandler from "~/app/lib/useAsyncHandler";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import PostFormPopup from "~/app/components/PostFormPopup";
import type BoardPost from "~/app/scheme/BoardPost";
import { parseBoardPost } from "~/app/scheme/BoardPost";

const PostListScene = ({
  title,
  boardId
}: {
  title: string;
  boardId: string;
}) => {
  const { myId } = useAuthorizedUser();
  const [formFlag, setFormFlag] = useState(false);
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const [operationError, setOperationError] =
    useState<AppErrorParameter | null>(null);
  const { isLoading: isOperating, runAsyncHandler } = useAsyncHandler({
    onError: setOperationError
  });
  const { boardPostList: latestMyPost } = useBoardPostList({
    boardId,
    userId: myId,
    limit: 1,
    onError: setStatusError
  });

  const {
    boardPostList,
    isLoading: isLoadingPostList,
    hasNext,
    loadMore,
    createItem,
    deleteItem
  } = useBoardPostMoreLoader({
    boardId
  });

  const defaultNickname = useMemo(() => {
    if (!latestMyPost) {
      return "";
    }
    const [first] = latestMyPost;
    return first.data.nickname;
  }, [latestMyPost]);

  const handlePostSubmit = useCallback(
    (v: BoardPost) =>
      runAsyncHandler(() => createItem(v)).then(() => setFormFlag(false)),
    [createItem, runAsyncHandler]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  if (!boardPostList) {
    return <MockLoadingScene />;
  }

  return (
    <>
      <MockStaticLayout title={title}>
        <p>
          <MockActionButton
            action={{ type: "button", onClick: () => setFormFlag(true) }}
          >
            新規投稿
          </MockActionButton>
        </p>
        {boardPostList.map(({ id, data }) => (
          <PostListCell key={id} post={data} onDelete={() => deleteItem(id)} />
        ))}
        {hasNext ? (
          <p>
            <MockActionButton
              action={
                isLoadingPostList ? null : { type: "button", onClick: loadMore }
              }
            >
              もっと読む
            </MockActionButton>
          </p>
        ) : null}
      </MockStaticLayout>
      {formFlag ? (
        <PostFormPopup
          defaultValue={parseBoardPost({ nickname: defaultNickname })}
          onClose={() => setFormFlag(false)}
          onSubmit={handlePostSubmit}
        />
      ) : null}
      {isOperating ? <MockLoadingPopup /> : null}
      {operationError ? (
        <ErrorPopup
          error={operationError}
          onClose={() => setOperationError(null)}
        />
      ) : null}
    </>
  );
};

export default PostListScene;
