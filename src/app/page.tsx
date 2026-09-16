import StaycationSite from "@/components/staycation-site";
import { todayInManila } from "@/lib/stay";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <StaycationSite initialToday={todayInManila()} />;
}
