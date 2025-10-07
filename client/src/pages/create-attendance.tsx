import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const attendanceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  meetingDate: z.string().min(1, "Meeting date is required"),
  status: z.enum(['scheduled', 'open', 'closed']).default('open'),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

export default function CreateAttendance() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      title: "",
      description: "",
      meetingDate: new Date().toISOString().slice(0, 16),
      status: 'open',
    },
  });

  const createAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceFormData) => {
      const payload = {
        ...data,
        meetingDate: new Date(data.meetingDate).toISOString(),
      };
      await apiRequest('POST', '/api/attendance', payload);
    },
    onSuccess: () => {
      toast({
        title: "Attendance session created",
        description: "Members can now mark their attendance.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/status/open'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/status/scheduled'] });
      setLocation('/attendance');
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to create attendance session",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AttendanceFormData) => {
    createAttendanceMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Attendance Session</h1>
          <p className="text-muted-foreground">Capture attendance for meetings, events, and more.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Weekly Chapter Meeting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add context or agenda items..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meetingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting date *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setLocation('/attendance')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAttendanceMutation.isPending}>
                    Create session
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
