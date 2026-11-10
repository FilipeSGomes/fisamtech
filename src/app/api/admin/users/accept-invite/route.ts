import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { acceptInvite } from "@/lib/super-admin/identity/users";
import { jsonError } from "@/lib/super-admin/http";

const schema = z.object({
  token: z.string().min(20),
  name: z.string().min(2),
  password: z.string().min(12),
});

/** Public endpoint — token is the secret. */
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const userId = await acceptInvite(body);
    return NextResponse.json({ userId });
  } catch (error) {
    return jsonError(error);
  }
}
