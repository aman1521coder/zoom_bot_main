export default function Header({ title = "Zoom AI Bot" }) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>
    </header>
  );
}
