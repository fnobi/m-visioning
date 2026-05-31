import styled from "@emotion/styled";
import { type ReactNode, useRef } from "react";
import { alphaColor, percent, PRIMITIVE_COLOR } from "~/common/css-util";

type StyleProps = {
  position?: "fixed" | "absolute";
  verticalAlign?: "center" | "flex-end";
  zIndex?: number;
};

const Wrapper = styled.div<StyleProps>(
  ({ position = "fixed", verticalAlign = "center", zIndex }) => ({
    position,
    left: 0,
    top: 0,
    width: percent(100),
    height: percent(100),
    backgroundColor: alphaColor(PRIMITIVE_COLOR.BLACK, 0.6),
    display: "flex",
    justifyContent: "center",
    alignItems: verticalAlign,
    zIndex
  })
);

const PopupBase = ({
  children,
  onClose,
  position,
  verticalAlign,
  zIndex
}: {
  children?: ReactNode;
  onClose?: () => void;
} & StyleProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  return (
    <Wrapper
      ref={wrapperRef}
      position={position}
      verticalAlign={verticalAlign}
      zIndex={zIndex}
      onClick={e => {
        if (onClose && e.target === wrapperRef.current) {
          onClose();
        }
      }}
    >
      {children}
    </Wrapper>
  );
};

export default PopupBase;
