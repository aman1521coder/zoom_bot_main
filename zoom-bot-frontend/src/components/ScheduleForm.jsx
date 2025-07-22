import { useState } from "react";
import axios from "../api";

export default function ScheduleForm({ onSchedule }) {
  const [form, setForm] = useState({
    meetingId: "",
    passcode: "",
    scheduledTime: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("/api/schedule", form);
    setForm({ meetingId: "", passcode: "", scheduledTime: "" });
    onSchedule();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-md space-y-4"
    >
      <input
        type="text"
        placeholder="Meeting ID"
        className="w-full p-2 rounded bg-white/30"
        value={form.meetingId}
        onChange={(e) => setForm({ ...form, meetingId: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Passcode"
        className="w-full p-2 rounded bg-white/30"
        value={form.passcode}
        onChange={(e) => setForm({ ...form, passcode: e.target.value })}
      />
      <input
        type="datetime-local"
        className="w-full p-2 rounded bg-white/30"
        value={form.scheduledTime}
        onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
        required
      />
      <button className="w-full bg-indigo-500 text-white p-2 rounded">
        Schedule Bot Join
      </button>
    </form>
  );
}
