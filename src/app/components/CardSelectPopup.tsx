import { useState } from "react";
import styled from "@emotion/styled";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { MockFormFrame } from "~/common/components/mock-form-ui";
import { em } from "~/common/lib/css-util";
import MockActionButton from "~/common/components/MockActionButton";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import AppCommonPopup from "~/app/components/AppCommonPopup";

const WrapperList = styled.div({
  textAlign: "left",
  p: {
    marginTop: em(0.5)
  }
});

const CardSelectPopup = ({
  defaultValue,
  cardList,
  onDetail,
  onSubmit,
  onClose
}: {
  defaultValue: string;
  cardList: TypedCollectionList<MoneyCardAccount>;
  onDetail: (id: string, data: MoneyCardAccount) => void;
  onSubmit: (v: string) => void;
  onClose: () => void;
}) => {
  const [selected, setSelected] = useState(defaultValue);

  return (
    <AppCommonPopup title="カード選択" onClose={onClose}>
      <MockFormFrame
        validValue={selected}
        onCancel={onClose}
        onSubmit={onSubmit}
      >
        <WrapperList>
          {cardList.map(({ id, data }) => (
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
                action={{
                  type: "button",
                  onClick: () => onDetail(id, data)
                }}
              >
                {data.label}
              </MockActionButton>
            </p>
          ))}
        </WrapperList>
      </MockFormFrame>
    </AppCommonPopup>
  );
};

export default CardSelectPopup;
