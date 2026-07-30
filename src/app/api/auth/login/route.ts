import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const { username, password, remember } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Enter your username and password to continue." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        isActive: true,
      },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Those credentials don't match. Check and try again." },
        { status: 401 }
      );
    }

    const session = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role as any,
    };
    const token = await signToken(session, !!remember);
    await setSessionCookie(token, !!remember);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await prisma.auditLog.create({
      data: { userId: user.id, action: "LOGIN", entity: "User", entityId: user.id },
    });

    return NextResponse.json({ user: session });
  } catch (e) {
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
