import { type ReactNode, createElement } from "react";
import { SITE_ORIGIN } from "~/common/constants";
import MetaSettings, { type MetaOptions } from "~/common/MetaSettings";
import { PAGE_TOP } from "~/feature/page-path";
import ASSETS_OGP from "~/assets/meta/ogp.png";
import ASSETS_FAVICON from "~/assets/meta/favicon.ico";

const DEFAULT_TITLE = "m-visioning";
const DEFAULT_DESCRIPTION = "自由に感想を書いてください。";
const DEFAULT_KEYWORDS: string[] = [];

export const makePageMetaTitle = (...pageTitle: string[]) =>
  [...pageTitle, DEFAULT_TITLE].join(" | ");

const DefaultMetaSettings = ({ children }: { children?: ReactNode }) => {
  const options: MetaOptions = {
    page: PAGE_TOP,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    shareImageUrl: SITE_ORIGIN + ASSETS_OGP.src,
    keywords: DEFAULT_KEYWORDS,
    faviconUrl: ASSETS_FAVICON.src,
    viewport: "width=device-width"
  };
  return createElement(MetaSettings, options, children);
};

export default DefaultMetaSettings;
