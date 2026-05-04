import { useEffect, useState } from "react";

const routes = new Set(["home", "learn", "archive", "admin"]);

function readRoute() {
  const route = window.location.hash.replace("#", "") || "home";
  return routes.has(route) ? route : "home";
}

export function useHashRoute() {
  const [route, setRouteState] = useState(readRoute);

  useEffect(() => {
    const onHashChange = () => setRouteState(readRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function setRoute(nextRoute) {
    window.location.hash = nextRoute;
  }

  return [route, setRoute];
}
