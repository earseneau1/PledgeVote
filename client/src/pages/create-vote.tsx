import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Hash, Trash2, Plus } from "lucide-react";

const voteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(['yes_no', 'multiple_choice', 'ranked_choice']),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  allowRealTimeResults: z.boolean().default(true),
  requiresQuorum: z.boolean().default(false),
  sendNotifications: z.boolean().default(true),
});

type VoteFormData = z.infer<typeof voteSchema>;

export default function CreateVote() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [options, setOptions] = useState(['', '']);
  const queryClient = useQueryClient();

  const form = useForm<VoteFormData>({
    resolver: zodResolver(voteSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "yes_no",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      allowRealTimeResults: true,
      requiresQuorum: false,
      sendNotifications: true,
    },
  });

  const createVoteMutation = useMutation({
    mutationFn: async (data: VoteFormData) => {
      const voteData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        options: data.type !== 'yes_no' ? options.filter(opt => opt.trim()) : null,
        status: 'active',
      };

      return await apiRequest('POST', '/api/votes', voteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/votes/active'] });
      toast({
        title: "Vote Created",
        description: "Your vote has been created successfully and is now active.",
      });
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create vote",
        variant: "destructive",
      });
    },
  });

  const watchedType = form.watch("type");

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const onSubmit = (data: VoteFormData) => {
    if (data.type !== 'yes_no') {
      const validOptions = options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        toast({
          title: "Error",
          description: "Please provide at least 2 options for this vote type.",
          variant: "destructive",
        });
        return;
      }
    }

    createVoteMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Vote</h1>
          <p className="text-muted-foreground">Start a new voting session for your chapter</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vote Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Vote Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vote Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Approve Spring Formal Budget Amendment"
                          {...field}
                          data-testid="input-vote-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Vote Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide context and details about this vote..."
                          rows={4}
                          {...field}
                          data-testid="textarea-vote-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Vote Type Selection */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vote Type *</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => field.onChange('yes_no')}
                            className={`px-4 py-3 rounded-lg border-2 font-medium transition-all text-center ${
                              field.value === 'yes_no'
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-white text-foreground hover:border-primary'
                            }`}
                            data-testid="button-vote-type-yes-no"
                          >
                            <CheckCircle size={20} className="mx-auto mb-2" />
                            <span className="block text-sm">Yes / No</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange('multiple_choice')}
                            className={`px-4 py-3 rounded-lg border-2 font-medium transition-all text-center ${
                              field.value === 'multiple_choice'
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-white text-foreground hover:border-primary'
                            }`}
                            data-testid="button-vote-type-multiple-choice"
                          >
                            <Hash size={20} className="mx-auto mb-2" />
                            <span className="block text-sm">Multiple Choice</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange('ranked_choice')}
                            className={`px-4 py-3 rounded-lg border-2 font-medium transition-all text-center ${
                              field.value === 'ranked_choice'
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-white text-foreground hover:border-primary'
                            }`}
                            data-testid="button-vote-type-ranked-choice"
                          >
                            <Hash size={20} className="mx-auto mb-2" />
                            <span className="block text-sm">Ranked Choice</span>
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Options (for Multiple Choice/Ranked) */}
                {watchedType !== 'yes_no' && (
                  <div className="space-y-2">
                    <FormLabel>Options</FormLabel>
                    <div className="space-y-2">
                      {options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            data-testid={`input-option-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeOption(index)}
                            disabled={options.length <= 2}
                            className="hover:bg-destructive/10 text-destructive"
                            data-testid={`button-remove-option-${index}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="text-primary"
                      data-testid="button-add-option"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Option
                    </Button>
                  </div>
                )}

                {/* Voting Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date & Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            data-testid="input-start-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date & Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            data-testid="input-end-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Settings Checkboxes */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="allowRealTimeResults"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-real-time-results"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Allow members to see real-time results</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requiresQuorum"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-requires-quorum"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Require quorum of 2/3 members to pass</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sendNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-send-notifications"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Send email notifications to eligible voters</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/')}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createVoteMutation.isPending}
                    className="bg-primary text-primary-foreground"
                    data-testid="button-create-vote"
                  >
                    {createVoteMutation.isPending ? (
                      <>Creating...</>
                    ) : (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Create Vote
                      </>
                    )}
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
