import { parseBoolean, parseObject } from "@m-visioning/core/util/parser-helper";

type CommonPermission = { valid: boolean };

export const parseCommonPermission = (src: unknown) =>
  parseObject<CommonPermission>(src, ({ valid }) => ({
    valid: parseBoolean(valid)
  }));

export default CommonPermission;
