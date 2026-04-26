"use client";

import { type ReactNode } from "react";
import { Global, css } from "@emotion/react";
import emotionReset from "emotion-reset";
import { globalStyle } from "~/app/core/emotion-mixin";
import LayoutRoot from "~/app/ui/_provider/LayoutRoot";

const Providers = ({ children }: { children: ReactNode }) => (
  <>
    <Global styles={css(emotionReset, globalStyle)} />
    <LayoutRoot>{children}</LayoutRoot>
  </>
);

export default Providers;
