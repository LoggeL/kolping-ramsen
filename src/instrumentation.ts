export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAnalyticsRetention } = await import(
      "./lib/analytics-retention"
    );
    await startAnalyticsRetention();
  }
}
