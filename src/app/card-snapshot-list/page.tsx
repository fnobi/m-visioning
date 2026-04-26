import { Suspense } from "react";
import PageCardSnapshotListClient from "~/app/card-snapshot-list/PageCardSnapshotListClient";

const PageCardSnapshotList = () => (
  <Suspense>
    <PageCardSnapshotListClient />
  </Suspense>
);

export default PageCardSnapshotList;
