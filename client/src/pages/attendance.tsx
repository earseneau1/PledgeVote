import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { NavigationHeader } from "@/components/navigation-header";
import { AttendanceCard } from "@/components/attendance-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, UsersRound } from "lucide-react";
import type { AttendanceSession, User } from "@shared/schema";

type AttendanceWithCreator = AttendanceSession & {
  creator?: Pick<User, "firstName" | "lastName"> | null;
};

export default function Attendance() {
  const { data: openSessions } = useQuery<AttendanceWithCreator[]>({
    queryKey: ['/api/attendance/status/open'],
  });

  const { data: scheduledSessions } = useQuery<AttendanceWithCreator[]>({
    queryKey: ['/api/attendance/status/scheduled'],
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Attendance Sessions</h1>
            <p className="text-muted-foreground">Track member participation for meetings and events</p>
          </div>
          <Link href="/create-attendance">
            <Button className="bg-primary text-primary-foreground" data-testid="button-new-attendance">
              <CalendarPlus size={16} className="mr-2" />
              New Attendance Session
            </Button>
          </Link>
        </div>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Open Sessions</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <UsersRound size={14} />
              Members can submit their attendance while sessions are open.
            </p>
          </div>

          {openSessions && openSessions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {openSessions.map((session) => (
                <AttendanceCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center space-y-3">
                <CalendarPlus className="mx-auto text-muted-foreground" size={36} />
                <p className="text-lg font-semibold text-foreground">No open sessions right now</p>
                <p className="text-sm text-muted-foreground">
                  Create a new attendance session to start capturing participation.
                </p>
                <Link href="/create-attendance">
                  <Button className="bg-primary text-primary-foreground">Create session</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Upcoming</h2>
          {scheduledSessions && scheduledSessions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {scheduledSessions.map((session) => (
                <AttendanceCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No scheduled sessions.
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
