import { definePublisher } from "./publisher.mjs";

/** Shared DevsLab identity. Product names, capabilities and policies stay with consumers. */
export const DEVSLAB_PUBLISHER = definePublisher({
  id: "https://devslab.kr/#organization",
  name: "DevsLab",
  alternateName: ["데브스랩", "devslab"],
  url: "https://devslab.kr/",
  sameAs: ["https://github.com/devslab-kr", "https://devslab-kr.github.io/"],
  defaultLabel: "데브스랩(DevsLab)",
  labels: { ko: "데브스랩(DevsLab)", en: "DevsLab" },
});

/** Shared copyright naming; consumers do not assemble their own publisher label. */
export function devslabCopyright({ year, locale = "ko" }) {
  if (!Number.isInteger(year) || year < 1970 || year > 9999) throw new RangeError("Copyright year must be a calendar year");
  const label = locale.toLowerCase().split("-")[0] === "ko"
    ? `${DEVSLAB_PUBLISHER.alternateName[0]} ${DEVSLAB_PUBLISHER.name}`
    : DEVSLAB_PUBLISHER.name;
  return `© ${year} ${label}`;
}
