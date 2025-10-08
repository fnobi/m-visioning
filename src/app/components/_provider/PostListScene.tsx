import { useCallback, useState } from "react";
import MockActionButton from "~/common/components/MockActionButton";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import MockLoadingPopup from "~/common/components/MockLoadingPopup";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import { percent } from "~/common/lib/css-util";
import { formatDateTimeLabel } from "~/common/lib/date-util";
import ErrorScene from "~/app/components/ErrorScene";
import { useBoardPostList } from "~/app/lib/database/board-post-database";
import ErrorPopup from "~/app/components/ErrorPopup";
import useAsyncHandler from "~/app/lib/useAsyncHandler";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import PostFormPopup from "~/app/components/PostFormPopup";
import type BoardPost from "~/app/scheme/BoardPost";
import { parseBoardPost } from "~/app/scheme/BoardPost";

const PostListScene = () => {
  const [formFlag, setFormFlag] = useState(false);
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const [operationError, setOperationError] =
    useState<AppErrorParameter | null>(null);
  const { isLoading, runAsyncHandler } = useAsyncHandler({
    onError: setOperationError
  });
  const { boarPostList, createPost } = useBoardPostList({
    onError: setStatusError
  });

  const handlePostSubmit = useCallback(
    (v: BoardPost) =>
      runAsyncHandler(() => createPost(v)).then(() => setFormFlag(false)),
    [createPost, runAsyncHandler]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  if (!boarPostList) {
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
        {boarPostList.map(({ id, data }) => (
          <div key={id}>
            <p>{data.body}</p>
            <p style={{ fontSize: percent(80) }}>
              {data.nickname}&nbsp;|&nbsp;
              {data.createdAt
                ? formatDateTimeLabel(data.createdAt.toDate())
                : null}
            </p>
          </div>
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
