import styled from "@emotion/styled";
import { type ComponentPropsWithoutRef } from "react";
import { em, percent, PRIMITIVE_COLOR } from "~/common/css-util";
import PopupBase from "~/components/PopupBase";

const ScrollWrapper = styled.div<{ maxHeight: string }>(({ maxHeight }) => ({
  position: "relative",
  maxHeight,
  overflowY: "auto",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start"
}));

const PopupBody = styled.div({
  backgroundColor: PRIMITIVE_COLOR.WHITE,
  padding: em(1),
  textAlign: "center"
});

const MockPopup = ({
  children,
  maxHeight = percent(100),
  ...props
}: ComponentPropsWithoutRef<typeof PopupBase> & { maxHeight?: string }) => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <PopupBase {...props}>
    <ScrollWrapper maxHeight={maxHeight}>
      <PopupBody>{children}</PopupBody>
    </ScrollWrapper>
  </PopupBase>
);

export default MockPopup;
