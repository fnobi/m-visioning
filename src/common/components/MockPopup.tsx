import styled from "@emotion/styled";
import { type ComponentPropsWithoutRef } from "react";
import { em, percent, PRIMITIVE_COLOR } from "~/common/lib/css-util";
import PopupBase from "~/common/components/PopupBase";

const ScrollWrapper = styled.div({
  position: "relative",
  maxHeight: percent(100),
  overflowY: "auto",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start"
});

const PopupBody = styled.div({
  backgroundColor: PRIMITIVE_COLOR.WHITE,
  padding: em(1),
  textAlign: "center"
});

const MockPopup = ({
  children,
  ...props
}: ComponentPropsWithoutRef<typeof PopupBase>) => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <PopupBase {...props}>
    <ScrollWrapper>
      <PopupBody>{children}</PopupBody>
    </ScrollWrapper>
  </PopupBase>
);

export default MockPopup;
