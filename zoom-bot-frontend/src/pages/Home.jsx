import Header from "../components/Header";
import ScheduleForm from "../components/ScheduleForm";
import MeetingList from "../components/MeetingList";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-200 via-blue-200 to-white p-8">
      <Header />
      <div className="max-w-4xl mx-auto space-y-8">
        <ScheduleForm onSchedule={() => window.location.reload()} />
        <MeetingList />
      </div>
    </div>
  );
}
