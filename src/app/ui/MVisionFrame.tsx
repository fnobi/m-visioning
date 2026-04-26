import { useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import styled from "@emotion/styled";
import { buildTransform } from "css-transform-builder";
import {
  FaListCheck,
  FaArrowRightToBracket,
  FaChevronRight,
  FaChevronLeft
} from "react-icons/fa6";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import MockActionButton from "~/common/components/MockActionButton";
import type PageEntry from "~/common/lib/PageEntry";
import { firebaseAuth } from "~/common/lib/firebase-app";
import {
  alphaColor,
  em,
  percent,
  PRIMITIVE_COLOR,
  px
} from "~/common/lib/css-util";
import { BankIcon, CardIcon } from "~/app/ui/CommonIconSvg";
import { pcStyle, spStyle, THEME_COLOR } from "~/app/core/emotion-mixin";
import AuthFrame from "~/app/ui/AuthFrame";
import {
  PAGE_CARD_SNAPSHOT_LIST,
  PAGE_PLAN_LIST,
  PAGE_TOP
} from "~/app/core/page-path";

type TabEntry = { label: string; icon: ReactNode; page: PageEntry };

const TABS = [
  {
    label: "口座予測",
    icon: <BankIcon />,
    page: PAGE_TOP
  },
  {
    label: "カード予測",
    icon: <CardIcon />,
    page: PAGE_CARD_SNAPSHOT_LIST
  },
  {
    label: "入出金予定一覧",
    icon: <FaListCheck />,
    page: PAGE_PLAN_LIST
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

const MenuItem = styled.p({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: em(0.4),
  marginBottom: em(0.8)
});

const NaviBar = styled.div({
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  height: px(MENU_HEIGHT),
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  backgroundColor: "#5577cc",
  borderBottom: `solid ${px(1)} ${THEME_COLOR.DARK}`
});

const NaviToggleButton = styled.div(
  {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: px(MENU_HEIGHT),
    color: THEME_COLOR.WHITE
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
      <MenuMat flag={menuFlag} onClick={() => setMenuFlag(false)} />
      <MenuRoot flag={menuFlag}>
        {TABS.map(({ label, icon, page }) => (
          <MenuItem key={page.href}>
            {icon}
            <MockActionButton
              action={page.test(router) ? null : { type: "page-link", page }}
            >
              {label}
            </MockActionButton>
          </MenuItem>
        ))}
        <hr />
        <MenuItem>
          <FaArrowRightToBracket />
          <MockActionButton
            action={{
              type: "button",
              onClick: () => signOut(firebaseAuth())
            }}
          >
            ログアウト
          </MockActionButton>
        </MenuItem>
      </MenuRoot>
      <NaviBar>
        <NaviToggleButton>
          <MockActionButton
            action={{
              type: "button",
              onClick: () => setMenuFlag(f => !f)
            }}
          >
            {menuFlag ? <FaChevronLeft /> : <FaChevronRight />}
          </MockActionButton>
        </NaviToggleButton>
      </NaviBar>
    </AuthFrame>
  );
};

export default MVisionFrame;
