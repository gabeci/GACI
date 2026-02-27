import { ReactNode } from "react";
import { BottomTabs } from "@/components/bottom-tabs";

type MobileShellProps = {
  children: ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-sm">
      <main className="flex-1 p-6">{children}</main>
      <BottomTabs />
    </div>
  );
}
