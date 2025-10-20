import { useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import styled from "@emotion/styled";
import { buildTransform } from "css-transform-builder";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import MockActionButton from "~/common/components/MockActionButton";
import type PageEntry from "~/common/lib/PageEntry";
import { firebaseAuth } from "~/common/lib/firebase-app";
import {
  alphaColor,
  percent,
  PRIMITIVE_COLOR,
  px
} from "~/common/lib/css-util";
import { pcStyle, spStyle } from "~/app/lib/emotion-mixin";
import AuthFrame from "~/app/components/AuthFrame";
import {
  PAGE_BANK_LIST,
  PAGE_BANK_SNAPSHOT_LIST,
  PAGE_CARD_LIST,
  PAGE_CARD_SNAPSHOT_LIST,
  PAGE_PLAN_LIST,
  PAGE_TOP
} from "~/app/lib/page-path";

type TabEntry = { label: string; page: PageEntry };

const TABS = [
  {
    label: "短期シミュレーション",
    page: PAGE_TOP
  },
  {
    label: "入出金予定一覧",
    page: PAGE_PLAN_LIST
  },
  {
    label: "銀行口座一覧",
    page: PAGE_BANK_LIST
  },
  {
    label: "カード一覧",
    page: PAGE_CARD_LIST
  },
  {
    label: "口座ログ一覧",
    page: PAGE_BANK_SNAPSHOT_LIST
  },
  {
    label: "カードログ一覧",
    page: PAGE_CARD_SNAPSHOT_LIST
  }
] as const satisfies TabEntry[];

const MENU_HEIGHT = 48;

const MenuMat = styled.div<{ flag: boolean }>(({ flag }) =>
  spStyle({
    position: "fixed",
    left: 0,
    top: 0,
    width: percent(100),
    height: percent(100),
    backgroundColor: alphaColor(PRIMITIVE_COLOR.BLACK, 0.8),
    opacity: flag ? 1 : 0,
    pointerEvents: flag ? "auto" : "none",
    transition: "opacity 0.2s"
  })
);

const MenuRoot = styled.div<{ flag: boolean }>(
  {
    position: "fixed",
    left: 0,
    top: px(MENU_HEIGHT),
    bottom: 0,
    padding: px(16, 16),
    backgroundColor: "#eeeeee"
  },
  ({ flag }) =>
    spStyle({
      transform: buildTransform(t => t.translateX(flag ? 0 : -100, "%")),
      transition: "transform 0.2s"
    }),
  pcStyle({})
);

const NaviBar = styled.div({
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  height: px(MENU_HEIGHT),
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  backgroundColor: "#888888"
});

const NaviToggleButton = styled.div(
  {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: px(MENU_HEIGHT)
  },
  pcStyle({
    display: "none"
  })
);

const MVisionFrame = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [menuFlag, setMenuFlag] = useState(false);
  return (
    <AuthFrame>
      <div style={{ height: px(MENU_HEIGHT) }} />
      <MockStaticLayout>{children}</MockStaticLayout>
      <MenuMat flag={menuFlag} />
      <MenuRoot flag={menuFlag}>
        {TABS.map(({ label, page }) => (
          <p key={page.href}>
            <MockActionButton
              action={
                page.href === router.asPath ? null : { type: "page-link", page }
              }
            >
              {label}
            </MockActionButton>
          </p>
        ))}
        <hr />
        <p>
          <MockActionButton
            action={{
              type: "button",
              onClick: () => signOut(firebaseAuth())
            }}
          >
            ログアウト
          </MockActionButton>
        </p>
      </MenuRoot>
      <NaviBar>
        <NaviToggleButton>
          <MockActionButton
            action={{
              type: "button",
              onClick: () => setMenuFlag(f => !f)
            }}
          >
            {menuFlag ? "❌️" : "@"}
          </MockActionButton>
        </NaviToggleButton>
      </NaviBar>
    </AuthFrame>
  );
};

export default MVisionFrame;
