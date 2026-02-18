
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";


import "../index.css";
import { Layout } from "@/shared/components/layout";

export interface RouterAppContext {

}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "odise",
      },
      {
        name: "description",
        content: "odise is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {

  return (
    <>
      <HeadContent />
      <Layout>
        <Outlet />
      </Layout>
      {/* <TanStackRouterDevtools position="bottom-left" /> */}
      {/* <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" /> */}
    </>
  );
}
