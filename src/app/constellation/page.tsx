import { MobileShell } from "@/components/mobile-shell";
import { ScreenPlaceholder } from "@/components/screen-placeholder";

export default function ConstellationPage() {
  return (
    <MobileShell>
      <ScreenPlaceholder
        title="Constellation"
        description="Graph placeholder for visualizing emotion-meaning-action patterns over time."
      />
    </MobileShell>
  );
}
