export async function throwHttpError(response: Response): Promise<never> {
  let message: string;
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") {
      message = body.detail;
    } else if (Array.isArray(body?.detail)) {
      message = body.detail.map((d: { msg: string }) => d.msg).join(", ");
    } else {
      message = `HTTP ${response.status}`;
    }
  } catch {
    message = `HTTP ${response.status}`;
  }
  throw new Error(message);
}
