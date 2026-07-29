import { LivingHero } from "@/components/LivingHero";
import { PlayableElevator } from "@/components/game/PlayableElevator";
import { SiteSections } from "@/components/site/SiteSections";

export default function HomePage() {
  return (
    <main>
      <LivingHero />
      <PlayableElevator />
      <SiteSections />
    </main>
  );
}
