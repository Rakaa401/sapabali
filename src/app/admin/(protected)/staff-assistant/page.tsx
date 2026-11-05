import StaffAssistantForm from "@/components/staff-assistant/StaffAssistantForm";
import { getDestinations } from "@/lib/destinations/queries";

export default async function StaffAssistantPage() {
  const destinations = await getDestinations();

  const options = destinations
    .filter((d) => d.status === "published")
    .map((d) => ({ id: d.id, name: d.name }));

  return (
    <main>
      <StaffAssistantForm destinations={options} />
    </main>
  );
}