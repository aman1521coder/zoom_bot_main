import { useState } from "react";
import axios from "../api";
import { CalendarDays, Lock, Video } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-900 via-indigo-900 to-black px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.5)] transition-all duration-500 ease-in-out animate-fadeIn"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
          <Video className="w-6 h-6 text-indigo-300" />
          Schedule Zoom Bot Join
        </h2>

        <div className="space-y-6">
          {/* Meeting ID */}
          <div className="relative">
            <label className="block mb-1 text-sm font-medium text-indigo-200">
              Meeting ID
            </label>
            <div className="relative">
              <Video className="absolute left-3 top-2.5 text-indigo-300 h-5 w-5" />
              <input
                type="text"
                placeholder="Enter Meeting ID"
                className="w-full pl-10 pr-4 py-2.5 bg-white/20 text-white placeholder-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.meetingId}
                onChange={(e) =>
                  setForm({ ...form, meetingId: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Passcode */}
          <div className="relative">
            <label className="block mb-1 text-sm font-medium text-indigo-200">
              Passcode (optional)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-indigo-300 h-5 w-5" />
              <input
                type="text"
                placeholder="Enter Passcode"
                className="w-full pl-10 pr-4 py-2.5 bg-white/20 text-white placeholder-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.passcode}
                onChange={(e) =>
                  setForm({ ...form, passcode: e.target.value })
                }
              />
            </div>
          </div>

          {/* Scheduled Time */}
          <div className="relative">
            <label className="block mb-1 text-sm font-medium text-indigo-200">
              Scheduled Time
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-2.5 text-indigo-300 h-5 w-5" />
              <input
                type="datetime-local"
                className="w-full pl-10 pr-4 py-2.5 bg-white/20 text-white placeholder-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.scheduledTime}
                onChange={(e) =>
                  setForm({ ...form, scheduledTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition duration-200 text-white font-semibold shadow-lg hover:shadow-xl"
          >
            Schedule Now
          </button>
          
        </div>
        <a
  href="http://localhost:5000/api/auth/zoom"
  className="mb-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-in-out"
>
  <Video className="w-5 h-5" />
  Connect Zoom Account
</a>

      </form>
    </div>
  );
}
