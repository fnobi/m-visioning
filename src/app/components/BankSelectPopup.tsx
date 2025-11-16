import { useState } from "react";
import styled from "@emotion/styled";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { MockFormFrame } from "~/common/components/mock-form-ui";
import { em } from "~/common/lib/css-util";
import MockActionButton from "~/common/components/MockActionButton";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import AppCommonPopup from "~/app/components/AppCommonPopup";

const WrapperList = styled.div({
  textAlign: "left",
  p: {
    marginTop: em(0.5)
  }
});

const BankSelectPopup = ({
  defaultValue,
  bankList,
  onDetail,
  onCreate,
  onSubmit,
  onClose
}: {
  defaultValue: string;
  bankList: TypedCollectionList<MoneyBankAccount>;
  onDetail: (id: string, data: MoneyBankAccount) => void;
  onCreate: (v: Partial<MoneyBankAccount>) => void;
  onSubmit: (v: string) => void;
  onClose: () => void;
}) => {
  const [selected, setSelected] = useState(defaultValue);

  return (
    <AppCommonPopup title="銀行選択" onClose={onClose}>
      <MockFormFrame
        validValue={selected}
        onCancel={onClose}
        onSubmit={onSubmit}
      >
        <WrapperList>
          {bankList.map(({ id, data }) => (
            <p key={id}>
              <input
                type="radio"
                checked={selected === id}
                onChange={e => {
                  if (e.target.checked) {
                    setSelected(id);
                  }
                }}
              />
              &nbsp;
              <MockActionButton
                action={{ type: "button", onClick: () => onDetail(id, data) }}
              >
                {data.label}
              </MockActionButton>
            </p>
          ))}
          <p>
            <MockActionButton
              action={{
                type: "button",
                onClick: () => onCreate({ order: bankList.length + 1 })
              }}
            >
              新規作成
            </MockActionButton>
          </p>
        </WrapperList>
      </MockFormFrame>
    </AppCommonPopup>
  );
};

export default BankSelectPopup;
