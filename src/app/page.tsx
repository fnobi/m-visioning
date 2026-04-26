import { Suspense } from "react";
import PageIndexClient from "~/app/PageIndexClient";

const PageIndex = () => (
  <Suspense>
    <PageIndexClient />
  </Suspense>
);

export default PageIndex;
