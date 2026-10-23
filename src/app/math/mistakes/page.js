import { Redirect } from "@/components/Redirect";

export const metadata = { title: "错题本" };
export default function MathMistakesRedirect() {
  return <Redirect to="/mistakes/#math" />;
}
