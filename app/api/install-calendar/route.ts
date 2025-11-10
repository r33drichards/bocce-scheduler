import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "bocce-calendar.mobileconfig");
    const fileContent = await readFile(filePath);

    return new Response(fileContent.buffer.slice(fileContent.byteOffset, fileContent.byteOffset + fileContent.byteLength), {
      headers: {
        "Content-Type": "application/x-apple-aspen-config",
        "Content-Disposition":
          'attachment; filename="bocce-calendar.mobileconfig"',
      },
    });
  } catch {
    return new Response("Configuration file not found", { status: 404 });
  }
}
