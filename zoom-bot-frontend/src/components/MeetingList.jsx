import { useEffect, useState } from "react";
import axios from "../api";

export default function MeetingList() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    axios.get("/api/schedule").then((res) => setMeetings(res.data));
  }, []);

  return (
    <div className="mt-8 space-y-4">
      {meetings.map((m, i) => (
        <div key={i} className="p-4 bg-white/20 backdrop-blur rounded shadow">
          <p>
            <strong>Meeting ID:</strong> {m.meetingId}
          </p>
          <p>
            <strong>Time:</strong> {new Date(m.scheduledTime).toLocaleString()}
          </p>
          <p>
            <strong>Status:</strong> {m.status}
          </p>
        </div>
      ))}
    </div>
  );
}
