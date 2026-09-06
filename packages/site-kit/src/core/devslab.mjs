import { definePublisher } from "./publisher.mjs";

/** Shared DevsLab identity. Product names, capabilities and policies stay with consumers. */
export const DEVSLAB_PUBLISHER = definePublisher({
  id: "https://devslab.kr/#organization",
  name: "DevsLab",
  alternateName: "데브스랩",
  url: "https://devslab.kr/",
  sameAs: ["https://github.com/devslab-kr", "https://devslab-kr.github.io/"],
  defaultLabel: "데브스랩(DevsLab)",
  labels: { ko: "데브스랩(DevsLab)", en: "DevsLab" },
});
