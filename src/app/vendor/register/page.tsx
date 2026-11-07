import { redirect } from "next/navigation";

export default function VendorRegisterPage() {
  redirect("/auth/register?role=VENDOR");
}
