import styled from "@emotion/styled";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { em } from "~/common/lib/css-util";
import MockActionButton from "~/common/components/MockActionButton";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import AppCommonPopup from "~/app/ui/AppCommonPopup";

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
