import { FaSackDollar, FaRegCreditCard } from "react-icons/fa6";

export const BankIcon = () => <FaSackDollar />;

export const CardIcon = () => <FaRegCreditCard />;

const CommonIconSvg = ({ icon }: { icon: "bank" | "card" }) => {
  switch (icon) {
    case "card":
      return <CardIcon />;
    default:
      return <BankIcon />;
  }
};

export default CommonIconSvg;
