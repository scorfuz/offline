export function getHealthResponse(): { status: string; timestamp: string } {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
}
