import { useMemo, useState } from "react";
import {
  MockFormFrame,
  MockStringFormRow,
  MockTextFormRow
} from "~/common/components/mock-form-ui";
import MockPopup from "~/common/components/MockPopup";
import FormOrganizer from "~/common/lib/FormOrganizer";
import {
  requiredValidator,
  stringMaxLengthValidator
} from "~/common/lib/form-validator";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import MockLoadingPopup from "~/common/components/MockLoadingPopup";
import type BoardPost from "~/app/scheme/BoardPost";
import AutoLoginPopup from "~/app/components/AutoLoginPopup";

const postFormOrganizer = new FormOrganizer<BoardPost>()
  .fieldValidator("nickname", requiredValidator())
  .fieldValidator("nickname", stringMaxLengthValidator(10));

const PostFormPopup = ({
  defaultValue,
  onClose,
  onSubmit
}: {
  defaultValue: BoardPost;
  onClose: () => void;
  onSubmit: (v: BoardPost) => void;
}) => {
  const { isAuthLoading, myId } = useAuthorizedUser();
  const [nickname, setNickname] = useState(defaultValue.nickname);
  const [body, setBody] = useState(defaultValue.body);

  const { validValue, errors } = useMemo(
    () =>
      postFormOrganizer.getValidValue({
        nickname,
        body,
        createdAt: null,
        userId: myId || ""
      }),
    [myId, body, nickname]
  );

  if (isAuthLoading) {
    return <MockLoadingPopup />;
  }

  if (!myId) {
    return <AutoLoginPopup />;
  }

  return (
    <MockPopup onClose={onClose}>
      <MockFormFrame validValue={validValue} onSubmit={onSubmit}>
        <MockStringFormRow
          label="お名前"
          value={nickname}
          onChange={setNickname}
          error={errors.nickname}
        />
        <MockTextFormRow
          label="本文"
          value={body}
          onChange={setBody}
          error={errors.body}
        />
      </MockFormFrame>
    </MockPopup>
  );
};

export default PostFormPopup;
