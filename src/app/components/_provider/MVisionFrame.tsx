import { Fragment, type ReactNode } from "react";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import MockActionButton from "~/common/components/MockActionButton";
import type PageEntry from "~/common/lib/PageEntry";
import { firebaseAuth } from "~/common/lib/firebase-app";
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

const MVisionFrame = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  return (
    <AuthFrame>
      <MockStaticLayout>
        <p>
          {TABS.map(({ label, page }) => (
            <Fragment key={page.href}>
              <MockActionButton
                action={
                  page.href === router.asPath
                    ? null
                    : { type: "page-link", page }
                }
              >
                {label}
              </MockActionButton>
              &nbsp;
            </Fragment>
          ))}
        </p>
        {children}
        <p>
          <MockActionButton
            action={{ type: "button", onClick: () => signOut(firebaseAuth()) }}
          >
            ログアウト
          </MockActionButton>
        </p>
      </MockStaticLayout>
    </AuthFrame>
  );
};

export default MVisionFrame;
