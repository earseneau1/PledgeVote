import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, CheckCircle2, UserRound } from "lucide-react";
import { useState } from "react";
import type { AttendanceSession, AttendanceRecord, User } from "@shared/schema";

interface AttendanceSessionResponse {
  session: AttendanceSession;
  creator?: Pick<User, "firstName" | "lastName" | "email"> | null;
}

interface AttendanceSummaryRecord {
  id: string;
  userId: string;
  response: 'present' | 'excused' | 'absent';
  note: string | null;
  recordedAt: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface AttendanceSummary {
  counts: Record<string, number>;
  records: AttendanceSummaryRecord[];
}

export default function AttendanceSessionPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const { data: sessionDetails, isLoading, error } = useQuery<AttendanceSessionResponse>({
    queryKey: [`/api/attendance/${id}`],
    enabled: !!id,
  });

  const { data: myRecord } = useQuery<AttendanceRecord | null>({
    queryKey: [`/api/attendance/${id}/my-record`],
    enabled: !!id,
  });

  const { data: summary } = useQuery<AttendanceSummary>({
    queryKey: [`/api/attendance/${id}/summary`],
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'scheduled' | 'open' | 'closed') => {
      await apiRequest('PATCH', `/api/attendance/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/attendance/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/status/open'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/status/scheduled'] });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (response: 'present' | 'excused' | 'absent') => {
      const res = await apiRequest('POST', `/api/attendance/${id}/mark`, { response, note: note.trim() || undefined });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance updated",
        description: "Your attendance response has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/attendance/${id}/my-record`] });
      queryClient.invalidateQueries({ queryKey: [`/api/attendance/${id}/summary`] });
      setNote("");
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update attendance",
        variant: "destructive",
      });
    },
  });

  if (!id) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-muted-foreground">
          Loading attendance session...
        </main>
      </div>
    );
  }

  if (error || !sessionDetails) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
          <p className="text-lg font-semibold text-foreground">Attendance session not found.</p>
          <Button variant="outline" onClick={() => setLocation('/attendance')}>
            Go back to attendance dashboard
          </Button>
        </main>
      </div>
    );
  }

  const { session, creator } = sessionDetails;
  const meetingDate = new Date(session.meetingDate);
  const formattedDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(meetingDate);
  const myResponse = myRecord?.response;
  const counts = summary?.counts ?? { total: 0, present: 0, excused: 0, absent: 0 };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize w-fit">
              {session.status}
            </Badge>
            <h1 className="text-3xl font-bold text-foreground">{session.title}</h1>
            <p className="text-muted-foreground">{session.description || 'No description provided.'}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CalendarDays size={16} />
                {formattedDate}
              </span>
              <span className="flex items-center gap-2">
                <UserRound size={16} />
                Organised by {creator?.firstName} {creator?.lastName}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => updateStatusMutation.mutate('scheduled')}
              disabled={updateStatusMutation.isPending}
            >
              Scheduled
            </Button>
            <Button
              onClick={() => updateStatusMutation.mutate('open')}
              disabled={updateStatusMutation.isPending}
            >
              Open
            </Button>
            <Button
              variant="destructive"
              onClick={() => updateStatusMutation.mutate('closed')}
              disabled={updateStatusMutation.isPending}
            >
              Close
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-sm text-muted-foreground">Present</p>
              <p className="text-3xl font-bold text-foreground">{counts.present ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-sm text-muted-foreground">Excused</p>
              <p className="text-3xl font-bold text-foreground">{counts.excused ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-sm text-muted-foreground">Absent</p>
              <p className="text-3xl font-bold text-foreground">{counts.absent ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mark attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myResponse && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="text-success" size={16} />
                You have marked yourself as <span className="font-semibold text-foreground">{myResponse}</span>.
              </div>
            )}

            <Textarea
              placeholder="Add an optional note (e.g., reason for absence)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1"
                onClick={() => markAttendanceMutation.mutate('present')}
                disabled={markAttendanceMutation.isPending}
              >
                I'm present
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => markAttendanceMutation.mutate('excused')}
                disabled={markAttendanceMutation.isPending}
              >
                Excused
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => markAttendanceMutation.mutate('absent')}
                disabled={markAttendanceMutation.isPending}
              >
                Absent
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(summary?.records ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No responses yet.</p>
            ) : (
              <div className="space-y-3">
                {(summary?.records ?? []).map((record) => (
                  <div
                    key={record.id}
                    className="border border-border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {record.firstName} {record.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{record.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="capitalize">{record.response}</Badge>
                      {record.note && (
                        <span className="text-xs text-muted-foreground max-w-sm">{record.note}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
