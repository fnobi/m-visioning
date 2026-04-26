import { type Metadata, type Viewport } from "next";
import { type ReactNode } from "react";
import { BASE_URL, SITE_ORIGIN } from "~/common/lib/constants";
import Providers from "~/app/Providers";
import ASSETS_FAVICON from "~/assets/meta/favicon.ico";
import ASSETS_OGP from "~/assets/meta/ogp.png";

const DEFAULT_TITLE = "m-visioning";
const DEFAULT_DESCRIPTION = "自由に感想を書いてください。";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: [],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    images: [SITE_ORIGIN + ASSETS_OGP.src]
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [SITE_ORIGIN + ASSETS_OGP.src]
  },
  icons: {
    icon: ASSETS_FAVICON.src
  }
};

export const viewport: Viewport = {
  width: "device-width"
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="ja">
    <body>
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
