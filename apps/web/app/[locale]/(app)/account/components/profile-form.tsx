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
import { type ProfileFormValues, profileSchema } from "../schemas";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateProfileAction } from "../actions";

type ProfileFormProps = {
  errors: ActionErrorMessages;
  user: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image?: string | null;
  };
};

export function ProfileForm({ errors, user }: ProfileFormProps) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
    },
  });

  const isPending = form.formState.isSubmitting;

  const onSubmit = async (values: ProfileFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);

    const result = await updateProfileAction(formData);

    if (result.success) {
      toast.success("Profile updated successfully");
    } else {
      toast.error(result.error || errors.updateProfile);
    }
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
