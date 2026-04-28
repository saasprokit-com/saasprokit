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
import { useRef } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

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

  const form = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: CreateOrgInput) {
    const result = await createOrganizationAction(values);

    if (!result.success) {
      // Slug conflict — show as field error on the slug input
      if (result.error?.includes("slug") || result.error?.includes("already")) {
        form.setError("slug", { message: result.error });
        return;
      }
      toast.error(result.error || errors.createOrganization);
      return;
    }

    toast.success("Workspace created successfully!");
    router.push(`/${locale}/${result.data?.slug}`);
  }

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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Workspace
              </Button>
              <Button
                disabled={isSubmitting}
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
