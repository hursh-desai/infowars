"use client";

import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";

export default function ShellLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 pb-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      <MobileNav />

      {/* Modal Slot */}
      {modal}
    </div>
  );
}

