import { POST as handleAccept } from "@/app/api/client/terms-accept/route";

export async function POST(req: Request) {
  return handleAccept();
}
