import { ReactNode } from "react";
import { BottomTabs } from "@/components/bottom-tabs";

type MobileShellProps = {
  children: ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-sm">
      <main className="flex-1 px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-6">{children}</main>
      <BottomTabs />
    </div>
  );
}
