import { useEffect, useMemo, useState } from "react";

const routes = new Set(["home", "learning", "history", "portfolio", "admin"]);

function readRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "") || "home";
  const route = raw.split("?")[0];
  return routes.has(route) ? route : "home";
}

export function useHashRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return useMemo(
    () => ({
      route,
      go(nextRoute) {
        window.location.hash = nextRoute === "home" ? "#home" : `#${nextRoute}`;
      }
    }),
    [route]
  );
}
