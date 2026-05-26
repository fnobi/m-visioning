import styled from "@emotion/styled";
import MockPopup from "~/common/components/MockPopup";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";

const TitleLine = styled.h2({
  fontWeight: "bold"
});

const ErrorPopup = ({
  error,
  onClose
}: {
  error: AppErrorParameter;
  onClose?: () => void;
}) => (
  <MockPopup onClose={onClose}>
    <TitleLine>ERROR</TitleLine>
    <p>{error.type}</p>
  </MockPopup>
);

export default ErrorPopup;
