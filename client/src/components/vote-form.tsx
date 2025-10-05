import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

interface VoteFormProps {
  onSubmit: (data: VoteFormData & { options?: string[] }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<VoteFormData>;
}

export function VoteForm({ onSubmit, onCancel, isSubmitting = false, initialData }: VoteFormProps) {
  const [options, setOptions] = useState(['', '']);

  const form = useForm<VoteFormData>({
    resolver: zodResolver(voteSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      type: initialData?.type || "yes_no",
      startDate: initialData?.startDate || new Date().toISOString().slice(0, 16),
      endDate: initialData?.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      allowRealTimeResults: initialData?.allowRealTimeResults ?? true,
      requiresQuorum: initialData?.requiresQuorum ?? false,
      sendNotifications: initialData?.sendNotifications ?? true,
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

  const handleSubmit = (data: VoteFormData) => {
    const validOptions = options.filter(opt => opt.trim());
    onSubmit({
      ...data,
      options: data.type !== 'yes_no' ? validOptions : undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        
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
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground"
            data-testid="button-create-vote"
          >
            {isSubmitting ? (
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
  );
}
