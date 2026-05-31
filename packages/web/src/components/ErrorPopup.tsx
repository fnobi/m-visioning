import styled from "@emotion/styled";
import { type AppErrorParameter } from "~/feature/AppErrorParameter";
import MockPopup from "~/components/MockPopup";

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
