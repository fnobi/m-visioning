import { percent } from "~/common/lib/css-util";
import { formatDateTimeLabel } from "~/common/lib/date-util";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import MockActionButton from "~/common/components/MockActionButton";
import type BoardPost from "~/app/scheme/BoardPost";

const PostListCell = ({
  post,
  onDelete
}: {
  post: BoardPost;
  onDelete: () => void;
}) => {
  const { myId } = useAuthorizedUser();
  return (
    <div>
      <p style={{ wordBreak: "break-word" }}>{post.body}</p>
      <p style={{ fontSize: percent(80) }}>
        {post.nickname}&nbsp;|&nbsp;
        {post.createdAt ? formatDateTimeLabel(post.createdAt.toDate()) : null}
        {post.userId === myId ? (
          <>
            &nbsp;|&nbsp;
            <MockActionButton action={{ type: "button", onClick: onDelete }}>
              削除
            </MockActionButton>
          </>
        ) : null}
      </p>
    </div>
  );
};

export default PostListCell;
