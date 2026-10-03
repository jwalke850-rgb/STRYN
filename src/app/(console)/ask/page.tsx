import { PageHeader } from "@/components/ui";
import { AskBox } from "./ask-box";

export const maxDuration = 300;

export default function Ask() {
  return (
    <>
      <PageHeader eyebrow="Ask the Archive" title="Search everything, conversationally" />
      <AskBox />
    </>
  );
}
