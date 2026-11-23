import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function VendorRegisterPage({ searchParams }: PageProps) {
  const query = new URLSearchParams();
  query.set("role", "vendor");

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "role" && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => query.append(key, v));
        } else {
          query.set(key, value);
        }
      }
    }
  }

  redirect(`/auth/register?${query.toString()}`);
}
