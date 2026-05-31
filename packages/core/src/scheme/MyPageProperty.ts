import {
  parseArray,
  parseObject,
  parseString
} from "@m-visioning/core/util/parser-helper";

type MyPageProperty = {
  favPlanList: string[];
};

export const parseMyPageProperty = (src: unknown) =>
  parseObject<MyPageProperty>(src, ({ favPlanList }) => ({
    favPlanList: parseArray(favPlanList, parseString)
  }));

export default MyPageProperty;
