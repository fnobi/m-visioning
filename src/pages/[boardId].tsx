import { type GetStaticPaths, type GetStaticProps } from "next";
import PageEntry from "~/common/lib/PageEntry";
import { parseString } from "~/common/lib/parser-helper";
import MetaSettings from "~/common/lib/MetaSettings";
import PostListScene from "~/app/components/_provider/PostListScene";
import { PAGE_TOP } from "~/app/lib/page-path";
import {
  fetchBoardEventItem,
  fetchBoardEventList
} from "~/app/lib/database/board-event-database";
import { makePageMetaTitle } from "~/app/components/DefaultMetaSettings";

type Props = {
  boardId: string;
  title: string;
};

const PageBoard = ({ boardId, title }: Props) => (
  <MetaSettings title={makePageMetaTitle(title)} page={PAGE_TOP.child(boardId)}>
    <PostListScene boardId={boardId} />
  </MetaSettings>
);

export const getStaticProps: GetStaticProps<Props> = async context => {
  const { boardId = null } = context.params || {};
  const boardEvent = await fetchBoardEventItem(parseString(boardId));
  return {
    props: {
      boardId: parseString(boardId),
      title: boardEvent ? boardEvent.title : ""
    }
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const list = await fetchBoardEventList({});
  return {
    paths: PageEntry.makeStaticPaths(
      PAGE_TOP,
      list.map(({ id }) => id)
    ),
    fallback: false
  };
};

export default PageBoard;
