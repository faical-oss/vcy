"use client";

import { User } from "lucide-react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** UI only. TODO: post to the newsletter provider once the endpoint is known. */
export function NewsletterForm() {
  const onSubmit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 sm:flex-row sm:items-end xl:max-w-[576px]" noValidate>
      <Input name="name" label="Your name" srOnlyLabel={false} placeholder="Your name" autoComplete="name" icon={<User className="size-3.5" />} className="min-w-0 flex-1" />
      <Input name="email" type="email" label="Your email address" srOnlyLabel={false} placeholder="Your email address" autoComplete="email" className="min-w-0 flex-1" />
      <Button type="submit" size="lg" className="w-full shrink-0 sm:w-auto">
        Subscribe
      </Button>
    </form>
  );
}
