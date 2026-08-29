import { createHash, randomBytes } from "node:crypto";
import { customAlphabet } from "nanoid";
const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 24);
export function generateClientId() {
    return `qs_${nano()}`;
}
export function generateClientSecret() {
    return `qss_${randomBytes(24).toString("base64url")}`;
}
export function hashSecret(secret) {
    return createHash("sha256").update(secret).digest("hex");
}
export function timingSafeEqualHex(a, b) {
    if (a.length !== b.length)
        return false;
    let out = 0;
    for (let i = 0; i < a.length; i++)
        out |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return out === 0;
}
//# sourceMappingURL=credentials.js.map