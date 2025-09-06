"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Email = {
  id: string;
  subject?: string;
  from?: string;
  date?: string;
  snippet?: string;
  body?: string; // include body to send to AI API
};

type AiInsights = {
  summary: string;
  sentiment: string;
  urgency: string;
};

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [insightsMap, setInsightsMap] = useState<Record<string, AiInsights>>({});
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    async function fetchEmails() {
      try {
        const res = await fetch("/api/gmail");
        const data: Email[] = await res.json();
        setEmails(data);

        // Fetch AI insights for each email
        const insightsResponses = await Promise.all(
          data.map(async (email) => {
            if (!email.body) return { emailId: email.id, insights: null };
            try {
              const aiRes = await fetch("/api/ai/insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject: email.subject, body: email.body }),
              });
              const aiData = await aiRes.json();
              return { emailId: email.id, insights: aiData };
            } catch (err) {
              console.error("Error fetching AI insights:", err);
              return { emailId: email.id, insights: null };
            }
          })
        );

        // Store insights in a map for easy access
        const map: Record<string, AiInsights> = {};
        insightsResponses.forEach(({ emailId, insights }) => {
          if (insights) map[emailId] = insights;
        });
        setInsightsMap(map);
      } catch (err) {
        console.error("Error fetching emails:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEmails();
  }, []);

  if (loading) return <p className="p-4">Loading emails...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">📧 AI Email Assistant</h1>
      <p className="text-gray-500">Your smart inbox with AI insights & replies</p>

      <div className="space-y-3">
        {emails.slice(0, visibleCount).map((email) => (
          <Link
            href={`/emails/${email.id}`}
            key={email.id}
            className="block rounded-xl border p-4 shadow hover:bg-gray-50 transition"
          >
            <h2 className="text-lg font-semibold">{email.subject || "(No Subject)"}</h2>
            <p className="text-sm text-gray-500">
              From: {email.from} | {email.date}
            </p>
            <p className="text-gray-700 italic">{email.snippet}</p>

            {/* ✅ Show AI Insights if available */}
            {insightsMap[email.id] && (
              <div className="mt-2 p-2 bg-gray-50 border rounded-md text-sm">
                <p><strong>Summary:</strong> {insightsMap[email.id].summary}</p>
                <p><strong>Sentiment:</strong> {insightsMap[email.id].sentiment}</p>
                <p><strong>Urgency:</strong> {insightsMap[email.id].urgency}</p>
              </div>
            )}
          </Link>
        ))}
      </div>

      {visibleCount < emails.length && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + 5)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
