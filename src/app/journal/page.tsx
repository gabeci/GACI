import { MobileShell } from "@/components/mobile-shell";
import { ScreenPlaceholder } from "@/components/screen-placeholder";

export default function JournalPage() {
  return (
    <MobileShell>
      <ScreenPlaceholder
        title="Journal"
        description="Instagram-like feed placeholder for private check-in entries from the core loop."
      />
    </MobileShell>
  );
}
