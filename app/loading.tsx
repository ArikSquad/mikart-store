import { StoreSkeleton } from "@/components/store/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-ink-800 p-8">
      <div className="mx-auto max-w-[984px]">
        <div className="mb-6 h-[108px] animate-pulse rounded-[14px] bg-ink-900" />
        <StoreSkeleton />
      </div>
    </div>
  );
}
