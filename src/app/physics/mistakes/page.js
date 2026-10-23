import { Redirect } from "@/components/Redirect";

export const metadata = { title: "错题本" };
export default function PhysicsMistakesRedirect() {
  return <Redirect to="/mistakes/#physics" />;
}
