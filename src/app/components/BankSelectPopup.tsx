import { useState } from "react";
import styled from "@emotion/styled";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { MockFormFrame } from "~/common/components/mock-form-ui";
import { em } from "~/common/lib/css-util";
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
  onSubmit,
  onClose
}: {
  defaultValue: string;
  bankList: TypedCollectionList<MoneyBankAccount>;
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
              <label>
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
                {data.label}
              </label>
            </p>
          ))}
        </WrapperList>
      </MockFormFrame>
    </AppCommonPopup>
  );
};

export default BankSelectPopup;
