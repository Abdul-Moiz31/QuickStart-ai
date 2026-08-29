import { config } from "dotenv";
import { resolve } from "node:path";
import { ensurePgvector, prisma } from "@quickstart-ai/db";
config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), ".env") });
async function main() {
    await ensurePgvector();
    console.log("pgvector extension + indexes ready");
    await prisma.$disconnect();
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=ensure.js.map