import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { zipSync } from "fflate";

export const runtime = "nodejs";

export async function GET() {
  const directory = join(process.cwd(), "wordpress-plugin", "rankboost-connector");
  const [plugin, readme] = await Promise.all([
    readFile(join(directory, "rankboost-connector.php")),
    readFile(join(directory, "README.md")),
  ]);
  const archive = zipSync({
    "rankboost-connector/rankboost-connector.php": plugin,
    "rankboost-connector/README.md": readme,
  });
  return new Response(new Uint8Array(archive), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="rankboost-connector.zip"',
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
