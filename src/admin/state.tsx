import React, { createContext, useContext, useEffect, useState } from "react";

const AdminContext = createContext<{ notify: (message: string) => void }>(
  null!,
);
export const useAdmin = () => useContext(AdminContext);

// Administration has no customer session, profile lookup or shopping cart provider.
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [notice, notify] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => notify(""), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  return (
    <AdminContext.Provider value={{ notify }}>
      {children}
      {notice && (
        <div className="kv-toast" role="status">
          {notice}
          <button aria-label="Dismiss notification" onClick={() => notify("")}>
            ×
          </button>
        </div>
      )}
    </AdminContext.Provider>
  );
}
