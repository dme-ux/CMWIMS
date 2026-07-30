import bcrypt from "bcryptjs";

/** Hash a plaintext password (cost 10). */
export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);

/** Compare plaintext against a stored hash. */
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
