import { createClient } from "@/app/actions";
import { ClientProfileForm } from "@/components/client-form";
import { Card, PageHeader } from "@/components/ui";

export default function NewClient() {
  return (
    <>
      <PageHeader eyebrow="Client Console" title="New client or prospect" />
      <Card>
        <ClientProfileForm action={createClient} submit="Create" />
      </Card>
    </>
  );
}
