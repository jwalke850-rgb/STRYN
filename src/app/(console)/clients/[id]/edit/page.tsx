import { notFound } from "next/navigation";
import { deleteClient, updateClientProfile } from "@/app/actions";
import { db } from "@/lib/db";
import { ClientProfileForm } from "@/components/client-form";
import { Card, PageHeader } from "@/components/ui";

export default async function EditClient(props: PageProps<"/clients/[id]/edit">) {
  const { id } = await props.params;
  const client = await db().get("clients", id);
  if (!client) notFound();
  return (
    <>
      <PageHeader eyebrow="Client Console" title={`Edit ${client.name}`} />
      <Card>
        <ClientProfileForm action={updateClientProfile.bind(null, id)} client={client} submit="Save profile" />
      </Card>
      <Card title="Danger zone" className="mt-6">
        <form action={deleteClient.bind(null, id)}>
          <button className="text-sm text-bad hover:underline">Delete client and all sessions, commitments and journal entries</button>
        </form>
      </Card>
    </>
  );
}
