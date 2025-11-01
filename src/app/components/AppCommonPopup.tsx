import { type ReactNode } from "react";
import MockPopup from "~/common/components/MockPopup";
import { px, vh } from "~/common/lib/css-util";

const AppCommonPopup = ({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children?: ReactNode;
}) => (
  <MockPopup onClose={onClose} maxHeight={`calc(${vh(100)} - ${px(150)})`}>
    <p>{title}</p>
    {children}
  </MockPopup>
);

export default AppCommonPopup;
