import { useCallback, useState } from "react";
import MockActionButton from "~/common/components/MockActionButton";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import MockLoadingPopup from "~/common/components/MockLoadingPopup";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import PostListCell from "~/app/components/PostListCell";
import ErrorScene from "~/app/components/ErrorScene";
import { useBoardPostList } from "~/app/lib/database/board-post-database";
import ErrorPopup from "~/app/components/ErrorPopup";
import useAsyncHandler from "~/app/lib/useAsyncHandler";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import PostFormPopup from "~/app/components/PostFormPopup";
import type BoardPost from "~/app/scheme/BoardPost";
import { parseBoardPost } from "~/app/scheme/BoardPost";

const PostListScene = ({ boardId }: { boardId: string }) => {
  const [formFlag, setFormFlag] = useState(false);
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const [operationError, setOperationError] =
    useState<AppErrorParameter | null>(null);
  const { isLoading, runAsyncHandler } = useAsyncHandler({
    onError: setOperationError
  });
  const { boardPostList, createPostItem, deletePostItem } = useBoardPostList({
    boardId,
    onError: setStatusError
  });

  const handlePostSubmit = useCallback(
    (v: BoardPost) =>
      runAsyncHandler(() => createPostItem(v)).then(() => setFormFlag(false)),
    [createPostItem, runAsyncHandler]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  if (!boardPostList) {
    return <MockLoadingScene />;
  }

  return (
    <>
      <MockStaticLayout title="post list">
        <p>
          <MockActionButton
            action={{ type: "button", onClick: () => setFormFlag(true) }}
          >
            新規投稿
          </MockActionButton>
        </p>
        {boardPostList.map(({ id, data }) => (
          <PostListCell
            key={id}
            post={data}
            onDelete={() => deletePostItem(id)}
          />
        ))}
      </MockStaticLayout>
      {formFlag ? (
        <PostFormPopup
          defaultValue={parseBoardPost(null)}
          onClose={() => setFormFlag(false)}
          onSubmit={handlePostSubmit}
        />
      ) : null}
      {isLoading ? <MockLoadingPopup /> : null}
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
