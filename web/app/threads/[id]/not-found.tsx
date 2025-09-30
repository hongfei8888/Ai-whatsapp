export default function ThreadNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
      <h2 className="text-xl font-semibold">Thread not found</h2>
      <p className="text-sm text-muted-foreground">We could not locate this conversation. It may have been removed.</p>
    </div>
  );
}
