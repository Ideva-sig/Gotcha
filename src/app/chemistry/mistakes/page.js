import { Redirect } from "@/components/Redirect";

export const metadata = { title: "错题本" };
export default function ChemistryMistakesRedirect() {
  return <Redirect to="/mistakes/#chemistry" />;
}
