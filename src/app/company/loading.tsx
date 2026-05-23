export default function CompanyLoading() {
  return (
    <div className="relative min-h-[60vh]">
      <div className="fixed top-0 left-0 z-[60] h-0.5 w-full">
        <div className="h-full bg-[#0F569D] animate-progress-bar" />
      </div>
    </div>
  );
}
