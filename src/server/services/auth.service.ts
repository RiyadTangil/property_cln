import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";
import type { AuthenticateDto } from "@/server/dto/auth.dto";

export const AuthService = {
  async authenticate(dto: AuthenticateDto) {
    const login = dto.login.trim();
    const password = dto.password;

    if (!login || !password) {
      throw new ServiceError(400, "Username/email and password are required.");
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: login }, { username: login }],
      },
    });

    if (!user || user.password !== password) {
      throw new ServiceError(401, "These credentials do not match our records.");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },

  async getUserById(userId: number): Promise<SessionUser | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        theme: true,
        navLayout: true,
        sidebarColor: true,
      },
    });
  },
};
