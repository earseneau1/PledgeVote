import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, CheckCircle2, ClipboardList } from "lucide-react";
import type { AttendanceSession, AttendanceRecord, User } from "@shared/schema";

interface AttendanceSummary {
  counts: Record<string, number>;
  records: Array<{
    id: string;
    response: 'present' | 'excused' | 'absent';
  }>;
}

interface AttendanceCardProps {
  session: AttendanceSession & {
    creator?: Pick<User, "firstName" | "lastName"> | null;
  };
}

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "full",
  timeStyle: "short",
});

export function AttendanceCard({ session }: AttendanceCardProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth() as { user: User | undefined };

  const { data: myRecord } = useQuery<AttendanceRecord | null>({
    queryKey: [`/api/attendance/${session.id}/my-record`],
    enabled: !!session.id,
  });

  const { data: summary } = useQuery<AttendanceSummary>({
    queryKey: [`/api/attendance/${session.id}/summary`],
    enabled: !!session.id,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (response: "present" | "excused" | "absent") => {
      const res = await apiRequest('POST', `/api/attendance/${session.id}/mark`, {
        response,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/attendance/${session.id}/my-record`] });
      queryClient.invalidateQueries({ queryKey: [`/api/attendance/${session.id}/summary`] });
    },
  });

  const meetingDateLabel = useMemo(() => formatter.format(new Date(session.meetingDate)), [session.meetingDate]);

  const response = myRecord?.response;
  const counts = summary?.counts ?? { total: 0, present: 0, excused: 0, absent: 0 };

  const organiserName = session.creator
    ? `${session.creator.firstName ?? ''} ${session.creator.lastName ?? ''}`.trim() || 'Chapter leadership'
    : 'Chapter leadership';

  return (
    <Card className="hover-lift overflow-hidden" data-testid={`card-attendance-${session.id}`}>
      {response && (
        <div className="bg-secondary/10 px-4 py-2 flex items-center gap-2">
          <CheckCircle2 className="text-secondary" size={16} />
          <span className="text-sm font-medium text-secondary-foreground capitalize">
            You marked {response}
          </span>
        </div>
      )}

      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
                {session.status}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <CalendarDays size={14} />
                {meetingDateLabel}
              </Badge>
            </div>
            <h4 className="text-lg font-semibold text-foreground" data-testid={`text-attendance-title-${session.id}`}>
              {session.title}
            </h4>
            <p className="text-sm text-muted-foreground" data-testid={`text-attendance-description-${session.id}`}>
              {session.description || 'No description provided'}
            </p>
            <p className="text-xs text-muted-foreground">Organised by {organiserName}</p>
          </div>
          <Link href={`/attendance/${session.id}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ClipboardList size={14} />
              View Details
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Present</p>
            <p className="text-lg font-semibold text-foreground">{counts.present ?? 0}</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Excused</p>
            <p className="text-lg font-semibold text-foreground">{counts.excused ?? 0}</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Absent</p>
            <p className="text-lg font-semibold text-foreground">{counts.absent ?? 0}</p>
          </div>
        </div>

        {session.status === 'open' && user?.id && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1"
              data-testid={`button-attendance-present-${session.id}`}
              disabled={markAttendanceMutation.isPending}
              onClick={() => markAttendanceMutation.mutate('present')}
            >
              I'm Present
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              data-testid={`button-attendance-excused-${session.id}`}
              disabled={markAttendanceMutation.isPending}
              onClick={() => markAttendanceMutation.mutate('excused')}
            >
              Excused
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              data-testid={`button-attendance-absent-${session.id}`}
              disabled={markAttendanceMutation.isPending}
              onClick={() => markAttendanceMutation.mutate('absent')}
            >
              Absent
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
