import { type AppProps } from "next/app";
import { Global, css } from "@emotion/react";
import emotionReset from "emotion-reset";
import { globalStyle } from "~/feature/emotion-mixin";
import DefaultMetaSettings from "~/components/DefaultMetaSettings";
import LayoutRoot from "~/components/_provider/LayoutRoot";

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
