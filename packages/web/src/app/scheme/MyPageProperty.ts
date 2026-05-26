import {
  parseArray,
  parseObject,
  parseString
} from "~/common/lib/parser-helper";

type MyPageProperty = {
  favPlanList: string[];
};

export const parseMyPageProperty = (src: unknown) =>
  parseObject<MyPageProperty>(src, ({ favPlanList }) => ({
    favPlanList: parseArray(favPlanList, parseString)
  }));

export default MyPageProperty;
