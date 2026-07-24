"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Loader2 } from "lucide-react";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { initialFormState } from "@/lib/forms";
import { updateProfileAction } from "../actions";
import { type ProfileFormValues, profileSchema } from "../schemas";

interface ProfileFormProps {
  errors: ActionErrorMessages;
  user: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image?: string | null;
  };
}

export function ProfileForm({ errors, user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialFormState
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
    },
  });

  useActionFieldErrors(form, state);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Profile updated successfully");
      // Re-sync the form to the saved values so isDirty clears and the
      // submit button disables until the next edit.
      form.reset(form.getValues());
    } else if (state.status === "error" && state.error) {
      toast.error(state.error || errors.updateProfile);
    }
  }, [state, form, errors]);

  const onSubmit = (values: ProfileFormValues) => {
    startTransition(() => formAction(values));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your name and avatar. Your email is fixed for security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Email</FormLabel>
              <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm">
                {user.email}
              </div>
              <FormDescription>
                Your email cannot be changed. Contact support if you need to
                update it.
              </FormDescription>
            </div>

            <Button
              className="w-full"
              disabled={isPending || !form.formState.isDirty}
              type="submit"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
