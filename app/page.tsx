"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

type Email = {
  id: string;
  from?: string;
  snippet?: string;
  body?: string;
};

type AiInsights = {
  sentiment: "Positive" | "Negative" | "Neutral";
  urgency: "High" | "Medium" | "Low";
};

export default function Dashboard() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [insightsMap, setInsightsMap] = useState<Record<string, AiInsights>>({});
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    normal: 0,
    positive: 0,
    negative: 0,
  });

  const router = useRouter();

  useEffect(() => {
    async function fetchEmailsAndInsights() {
      try {
        // Fetch emails
        const res = await fetch("/api/gmail");
        const data: Email[] = await res.json();

        // Limit to 5 latest emails
        const limitedEmails = data.slice(0, 5);
        setEmails(limitedEmails);

        // Fetch AI insights only for 5 emails
        const insightsResponses = await Promise.all(
          limitedEmails.map(async (email) => {
            if (!email.body) return { emailId: email.id, insights: null };
            try {
              const aiRes = await fetch("/api/ai/insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject: email.snippet, body: email.body }),
              });
              const aiData = await aiRes.json();
              return { emailId: email.id, insights: aiData };
            } catch {
              return { emailId: email.id, insights: null };
            }
          })
        );

        const map: Record<string, AiInsights> = {};
        insightsResponses.forEach(({ emailId, insights }) => {
          if (insights) map[emailId] = insights;
        });
        setInsightsMap(map);

        // Compute stats for limited emails
        let urgent = 0,
          normal = 0,
          positive = 0,
          negative = 0;

        Object.values(map).forEach((i) => {
          if (i.urgency === "High") urgent++;
          else normal++;

          if (i.sentiment === "Positive") positive++;
          else if (i.sentiment === "Negative") negative++;
        });

        setStats({
          total: limitedEmails.length,
          urgent,
          normal,
          positive,
          negative,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEmailsAndInsights();
  }, []);

  if (loading)
    return (
      <p className="p-6 text-gray-500 font-medium text-lg">Loading dashboard...</p>
    );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">📊 AI Email Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Urgent Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600">{stats.urgent}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Normal Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">{stats.normal}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Positive Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-500">{stats.positive}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Negative Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-500">{stats.negative}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Emails */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5" /> Recent Emails
        </h2>

        <Card>
          <CardContent className="divide-y">
            {emails.map((email) => (
              <div
                key={email.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-medium">{email.from}</p>
                  <p className="text-sm text-gray-600">{email.snippet}</p>
                </div>

                {insightsMap[email.id]?.urgency === "High" ? (
                  <Badge variant="destructive">Urgent</Badge>
                ) : (
                  <Badge>Normal</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end mt-4">
          <Button onClick={() => router.push("/emails")}>
            View All Emails Analysis
          </Button>
        </div>
      </div>
    </main>
  );
}
