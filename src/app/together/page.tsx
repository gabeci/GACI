import { MobileShell } from "@/components/mobile-shell";
import { ScreenPlaceholder } from "@/components/screen-placeholder";

export default function TogetherPage() {
  return (
    <MobileShell>
      <ScreenPlaceholder
        title="Together"
        description="Optional Feed/Story/DM segmented placeholder, available only when the user opens this tab."
      />
    </MobileShell>
  );
}
