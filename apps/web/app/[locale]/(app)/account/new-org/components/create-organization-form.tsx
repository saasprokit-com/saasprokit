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
import { generateSlug } from "@repo/utils/slug";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { startTransition, useActionState, useRef } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { useActionResult } from "@/hooks/use-action-result";
import { initialFormState } from "@/lib/forms";
import { createOrganizationAction } from "../actions";
import { type CreateOrgInput, createOrgSchema } from "../schemas";

function SlugPreview({ control }: { control: Control<CreateOrgInput> }) {
  const slug = useWatch({ control, name: "slug" });
  return (
    <FormDescription>
      Your workspace will be available at{" "}
      <span className="font-mono text-foreground">/{slug || "your-slug"}</span>
    </FormDescription>
  );
}

interface CreateOrganizationFormProps {
  errors: ActionErrorMessages;
}

export function CreateOrganizationForm({
  errors,
}: CreateOrganizationFormProps) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const slugTouched = useRef(false);

  const [state, formAction, isPending] = useActionState(
    createOrganizationAction,
    initialFormState
  );

  const form = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  useActionFieldErrors(form, state);

  useActionResult(state, {
    onError: (error) => toast.error(error ?? errors.createOrganization),
    onSuccess: (data) => {
      toast.success("Workspace created successfully!");
      router.push(`/${locale}/${data?.slug}`);
    },
  });

  const onSubmit = (values: CreateOrgInput) => {
    startTransition(() => formAction(values));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Details</CardTitle>
        <CardDescription>
          Choose a name and URL for your workspace.
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
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!slugTouched.current) {
                          form.setValue("slug", generateSlug(e.target.value), {
                            shouldValidate: form.formState.isSubmitted,
                          });
                        }
                      }}
                      placeholder="Acme Inc."
                    />
                  </FormControl>
                  <FormDescription>
                    The display name for your workspace.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      onChange={(e) => {
                        slugTouched.current = true;
                        field.onChange(e);
                      }}
                      placeholder="acme-inc"
                    />
                  </FormControl>
                  <SlugPreview control={form.control} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button disabled={isPending} type="submit">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Workspace
              </Button>
              <Button
                disabled={isPending}
                onClick={() => {
                  form.reset();
                  slugTouched.current = false;
                }}
                type="button"
                variant="outline"
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
