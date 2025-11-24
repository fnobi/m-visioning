import styled from "@emotion/styled";
import { FaChevronDown } from "react-icons/fa6";
import MockActionButton from "~/common/components/MockActionButton";
import {
  alphaColor,
  buttonReset,
  em,
  percent,
  px
} from "~/common/lib/css-util";
import CommonIconSvg from "~/app/components/CommonIconSvg";
import { THEME_COLOR } from "~/app/lib/emotion-mixin";

const Wrapper = styled.div({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center"
});

const ButtonUnit = styled.button(buttonReset, {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: em(0.3, 0.6),
  gap: em(0.3),
  border: `solid ${px(1)} ${alphaColor(THEME_COLOR.DARK, 0.5)}`,
  borderRadius: px(99999),
  lineHeight: 1
});

const MainIcon = styled.div({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: percent(110)
});

const SubIcon = styled.div({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: percent(70)
});

const PickableTitle = ({
  children,
  type,
  onOpen,
  onEdit
}: {
  children: string;
  type: "bank" | "card";
  onOpen: () => void;
  onEdit: () => void;
}) => (
  <Wrapper>
    <ButtonUnit type="button" onClick={onOpen}>
      <MainIcon>
        <CommonIconSvg icon={type} />
      </MainIcon>
      <span>{children}</span>
      <SubIcon>
        <FaChevronDown />
      </SubIcon>
    </ButtonUnit>
    &nbsp;
    <MockActionButton
      action={{
        type: "button",
        onClick: onEdit
      }}
    >
      edit
    </MockActionButton>
  </Wrapper>
);

export default PickableTitle;
