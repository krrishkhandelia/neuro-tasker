import TaskDashboard from "@/components/features/TaskDashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans">
      {/* Header */}
      <nav className="w-full p-6 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg"></div>
          <span className="text-xl font-bold tracking-tight">NeuroTasker</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-6 py-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900">
            Overwhelmed? <br />
            <span className="text-green-600">Let&apos;s just do one thing.</span>
          </h1>
          <p className="text-lg text-gray-500">
            AI-powered task decomposition for neurodivergent minds.
            Your privacy is protected locally.
          </p>
        </div>

        {/* The Dashboard Component */}
        <TaskDashboard />
      </div>
    </main>
  );
}