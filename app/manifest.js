import { defaultDescription, siteName } from "@/lib/seo";

export default function manifest() {
  return {
    name: `${siteName} - AI Study Workspace`,
    short_name: siteName,
    description: defaultDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#635bff",
    icons: [
      {
        src: "/icon.svg",
        sizes: "64x64",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
