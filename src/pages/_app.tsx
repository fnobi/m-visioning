import { type AppProps } from "next/app";
import { Global, css } from "@emotion/react";
import emotionReset from "emotion-reset";
import { globalStyle } from "~/app/core/emotion-mixin";
import DefaultMetaSettings from "~/app/ui/DefaultMetaSettings";
import LayoutRoot from "~/app/ui/_provider/LayoutRoot";

const MyApp = ({ Component, pageProps }: AppProps) => (
  <>
    <DefaultMetaSettings />
    <Global styles={css(emotionReset, globalStyle)} />
    <LayoutRoot>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...pageProps} />
    </LayoutRoot>
    {/* <GTagSnippet trackingId="XX-XXXXXXXXX-XX" basePath={BASE_PATH} /> */}
  </>
);

export default MyApp;
