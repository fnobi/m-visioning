import styled from "@emotion/styled";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { em } from "~/common/lib/css-util";
import MockActionButton from "~/common/components/MockActionButton";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import AppCommonPopup from "~/app/ui/AppCommonPopup";

const WrapperList = styled.div({
  textAlign: "left",
  p: {
    marginTop: em(0.5)
  }
});

const BankSelectPopup = ({
  defaultValue,
  bankList,
  onCreate,
  onSubmit,
  onClose
}: {
  defaultValue: string;
  bankList: TypedCollectionList<MoneyBankAccount> | null;
  onCreate: (v: Partial<MoneyBankAccount>) => void;
  onSubmit: (v: string) => void;
  onClose: () => void;
}) => (
  <AppCommonPopup title="銀行選択" onClose={onClose}>
    <WrapperList>
      {(bankList || []).map(({ id, data }) => (
        <p key={id}>
          <MockActionButton
            action={
              id === defaultValue
                ? null
                : { type: "button", onClick: () => onSubmit(id) }
            }
          >
            {data.label}
          </MockActionButton>
        </p>
      ))}
      <p>
        <MockActionButton
          action={{
            type: "button",
            onClick: () => {
              if (!bankList) {
                return;
              }
              onCreate({ order: bankList.length + 1 });
            }
          }}
        >
          新規作成
        </MockActionButton>
      </p>
    </WrapperList>
  </AppCommonPopup>
);

export default BankSelectPopup;
