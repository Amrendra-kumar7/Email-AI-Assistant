"use client";

import { useEffect, useState } from "react";

export default function EmailDetailPage({ params }: { params: { id: string } }) {
  const [email, setEmail] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiReply, setAiReply] = useState<string>("");
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmail() {
      try {
        // 1. Fetch email details
        const res = await fetch(`/api/gmail/${params.id}`);
        const data = await res.json();
        setEmail(data);

        // 2. Call AI API to generate insights
        const aiRes = await fetch(`/api/ai/insights`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: data.subject, body: data.body }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          setAiInsights(aiData);
        }
      } catch (err) {
        console.error("Error fetching email:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmail();
  }, [params.id]);

  // ✅ Generate AI reply and save to DB
  const generateReply = async () => {
    if (!email) return;
    setIsGeneratingReply(true);
    try {
      const res = await fetch("/api/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: email.id, // 🔑 pass emailId
          emailContent: `${email.subject}\n\n${email.body}`,
          insights: aiInsights,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiReply(data.reply);
      }
    } catch (error) {
      console.error("Error generating reply:", error);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  // ✅ Send reply via Gmail API
  const sendReply = async () => {
    if (!aiReply || !email) return;

    setIsReplying(true);
    try {
      const res = await fetch("/api/gmail/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: email.threadId,
          to: email.from,
          subject: email.subject?.startsWith("Re:")
            ? email.subject
            : `Re: ${email.subject}`,
          body: aiReply,
        }),
      });

      if (res.ok) {
        alert("Reply sent successfully!");
        setAiReply("");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  if (loading) return <p className="p-4">Loading email...</p>;
  if (!email) return <p className="p-4">Email not found</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Email header */}
      <h1 className="text-2xl font-bold">{email.subject}</h1>
      <p className="text-sm text-gray-500">
        From: {email.from} | {email.date}
      </p>

      {/* Email body */}
      <div
        className="prose border p-4 rounded-xl bg-white shadow"
        dangerouslySetInnerHTML={{ __html: email.body }}
      />

      {/* AI Insights Section */}
      {aiInsights && (
        <div className="mt-4 p-4 bg-gray-50 border rounded-xl shadow-sm">
          <h3 className="font-semibold mb-2">🤖 AI Insights</h3>
          <p>
            <strong>Summary:</strong> {aiInsights.summary}
          </p>
          <p>
            <strong>Sentiment:</strong> {aiInsights.sentiment}
          </p>
          <p>
            <strong>Urgency:</strong> {aiInsights.urgency}
          </p>

          <button
            onClick={generateReply}
            disabled={isGeneratingReply}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isGeneratingReply ? "Generating..." : "Generate AI Reply"}
          </button>
        </div>
      )}

      {/* AI Reply Section */}
      {aiReply && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-2">✉️ AI Generated Reply</h3>
          <textarea
            value={aiReply}
            onChange={(e) => setAiReply(e.target.value)}
            className="w-full h-40 p-3 border rounded-md mb-3"
            placeholder="AI generated reply will appear here..."
          />
          <div className="flex gap-2">
            <button
              onClick={sendReply}
              disabled={isReplying}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300"
            >
              {isReplying ? "Sending..." : "Send Reply"}
            </button>
            <button
              onClick={() => setAiReply("")}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
