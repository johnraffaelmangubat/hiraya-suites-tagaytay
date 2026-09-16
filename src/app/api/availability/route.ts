catch (error) {
  console.error(
    "Availability could not be loaded:",
    error
  );

  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
