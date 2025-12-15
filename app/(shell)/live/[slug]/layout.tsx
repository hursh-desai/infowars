"use client";

export default function LiveDebateLayout({
  children,
  panel,
}: {
  children: React.ReactNode;
  panel: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
        {/* Desktop Panel - Always visible */}
        <div className="hidden lg:block w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-700">
          {panel}
        </div>
      </div>
      {/* Mobile Panel - Overlay when route matches */}
      <div className="lg:hidden">
        {panel}
      </div>
    </div>
  );
}

