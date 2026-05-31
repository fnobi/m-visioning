import { type ReactNode } from "react";
import MockPopup from "~/components/MockPopup";
import { px, vh } from "~/common/css-util";
import { zIndexFromKey } from "~/feature/emotion-mixin";

const AppCommonPopup = ({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children?: ReactNode;
}) => (
  <MockPopup
    onClose={onClose}
    maxHeight={`calc(${vh(100)} - ${px(150)})`}
    zIndex={zIndexFromKey("popup")}
  >
    <p>{title}</p>
    {children}
  </MockPopup>
);

export default AppCommonPopup;
