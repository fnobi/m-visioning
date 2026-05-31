import styled from "@emotion/styled";
import { em } from "~/common/css-util";
import { type TypedCollectionList } from "@m-visioning/core/util/DataStoreAgent";
import type MoneyCardAccount from "@m-visioning/core/schema/MoneyCardAccount";
import MockActionButton from "~/components/MockActionButton";
import AppCommonPopup from "~/components/AppCommonPopup";

const WrapperList = styled.div({
  textAlign: "left",
  p: {
    marginTop: em(0.5)
  }
});

const CardSelectPopup = ({
  defaultValue,
  cardList,
  onCreate,
  onSubmit,
  onClose
}: {
  defaultValue: string | null;
  cardList: TypedCollectionList<MoneyCardAccount> | null;
  onCreate: (v: Partial<MoneyCardAccount>) => void;
  onSubmit: (v: string) => void;
  onClose: () => void;
}) => (
  <AppCommonPopup title="カード選択" onClose={onClose}>
    <WrapperList>
      {(cardList || []).map(({ id, data }) => (
        <p key={id}>
          <MockActionButton
            action={
              id === defaultValue
                ? null
                : {
                    type: "button",
                    onClick: () => onSubmit(id)
                  }
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
              if (!cardList) {
                return;
              }
              onCreate({ order: cardList.length + 1 });
            }
          }}
        >
          新規作成
        </MockActionButton>
      </p>
    </WrapperList>
  </AppCommonPopup>
);

export default CardSelectPopup;
