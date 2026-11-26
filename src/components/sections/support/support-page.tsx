"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Compass, HeartHandshake, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SunOrnament } from "@/components/brand/sun-ornament";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/helpers/cn";
import type { SupportContent, SupportIcon } from "@/interfaces";

const TOPIC_ICONS: Record<SupportIcon, typeof Compass> = {
  compass: Compass,
  calendar: CalendarDays,
  message: MessageCircle,
  clock: Clock3,
  heart: HeartHandshake,
  mail: Mail,
};

const TOPIC_ICON_TONE: Record<SupportIcon, string> = {
  compass: "text-accent",
  calendar: "text-muted-blue",
  message: "text-muted-blue",
  clock: "text-accent",
  heart: "text-accent",
  mail: "text-accent",
};

/** Figma fields: 44px tall, 2px radius, 12px uppercase labels. Applied to the shared Input without changing it. */
const FIELD_STYLE =
  "gap-2 [&_label]:text-xs [&_label]:uppercase [&_label]:tracking-label [&_input]:h-11 [&_input]:rounded-field [&_input]:px-3 [&_input]:placeholder:text-muted-blue";

const BOOKING_TOPIC_ID = "existing-booking";

const SIDE_CARD = "rounded-card p-6";

export function SupportPage({ content }: { content: SupportContent }) {
  const [topicId, setTopicId] = useState(content.topics[0]?.id);
  const { form, next, inspiration, tips } = content;
  const NextIcon = TOPIC_ICONS.clock;
  const HeartIcon = TOPIC_ICONS.heart;
  const MailIcon = TOPIC_ICONS.mail;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: POST to the support endpoint (not defined yet) with `topicId` and the form fields, then show real
    // success/error feedback. Nothing is sent and no success message is shown until that exists.
  }

  return (
    <div className="bg-surface">
      <section className="border-b border-border-soft bg-surface-blue">
        <Container className="flex flex-col items-center py-14 text-center sm:py-20">
          <SunOrnament className="mb-5 h-6 w-24" />
          <p className="text-xs font-semibold uppercase tracking-eyebrow-lg text-muted">{content.eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-medium text-primary sm:text-display-sm">{content.title}</h1>
          <p className="mt-5 max-w-[672px] text-base leading-[26px] text-body">{content.intro}</p>
        </Container>
      </section>

      <Container className="py-12">
        <section aria-labelledby="support-topics">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-blue">{content.topicsEyebrow}</p>
          <h2 id="support-topics" className="pt-1 font-display text-3xl font-medium text-primary sm:text-heading">
            {content.topicsTitle}
          </h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {content.topics.map((topic) => {
              const Icon = TOPIC_ICONS[topic.icon];
              const selected = topic.id === topicId;
              return (
                <li key={topic.id} className="flex">
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTopicId(topic.id)}
                    className={cn(
                      "flex min-h-28 w-full items-center gap-2 rounded-card border px-3 py-4 text-left transition-colors",
                      selected ? "border-primary bg-surface-blue" : "border-border bg-card hover:border-border-strong",
                    )}
                  >
                    <Icon aria-hidden className={cn("size-5 shrink-0 self-start", TOPIC_ICON_TONE[topic.icon])} />
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold text-primary">{topic.title}</span>
                      <span className="pt-1 text-xs leading-[19.5px] text-body">{topic.description}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-labelledby="support-form-title" className="rounded-card bg-card p-5 shadow-card sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-blue">{form.eyebrow}</p>
            <h2 id="support-form-title" className="pt-1 font-display text-3xl font-medium text-primary sm:text-heading-sm">
              {form.title}
            </h2>
            <p className="pt-2 text-sm leading-[22.75px] text-body">{form.description}</p>

            <form onSubmit={handleSubmit} className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={form.firstName} srOnlyLabel={false} name="firstName" autoComplete="given-name" placeholder={form.firstNamePlaceholder} className={FIELD_STYLE} />
                <Input label={form.lastName} srOnlyLabel={false} name="lastName" autoComplete="family-name" placeholder={form.lastNamePlaceholder} className={FIELD_STYLE} />
                <Input
                  label={form.email}
                  srOnlyLabel={false}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={form.emailPlaceholder}
                  className={cn(FIELD_STYLE, "sm:col-span-2")}
                />
                {topicId === BOOKING_TOPIC_ID ? (
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label
                      htmlFor="bookingReference"
                      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-label text-primary"
                    >
                      {form.bookingReference}
                      <span className="font-normal normal-case tracking-normal text-muted-blue">{form.optional}</span>
                    </label>
                    <input
                      id="bookingReference"
                      name="bookingReference"
                      type="text"
                      placeholder={form.bookingReferencePlaceholder}
                      className="h-11 w-full rounded-field border border-border bg-card px-3 text-base text-primary sm:text-sm placeholder:text-muted-blue focus:border-accent"
                    />
                  </div>
                ) : null}
                <Textarea
                  label={form.message}
                  name="message"
                  required
                  placeholder={form.messagePlaceholder}
                  className="sm:col-span-2"
                />
              </div>
              <div className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs leading-[19.5px] text-body">
                  <ShieldCheck aria-hidden className="size-[15px] shrink-0 text-muted-blue" />
                  {form.privacyNote}
                </p>
                <Button type="submit" size="sm" className="gap-2 px-3 text-sm tracking-widest">
                  {form.submit}
                  <ArrowRight aria-hidden className="size-4" />
                </Button>
              </div>
            </form>
          </section>

          <aside className="flex flex-col gap-4">
            <section className={cn(SIDE_CARD, "bg-primary")}>
              <NextIcon aria-hidden className="size-6 text-accent" />
              <h2 className="pt-4 font-display text-title-xs font-medium text-white">{next.title}</h2>
              <div className="flex flex-col gap-4 pt-4 text-sm leading-[22.75px] text-white/75">
                {next.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section className={cn(SIDE_CARD, "bg-card shadow-card")}>
              <HeartIcon aria-hidden className="size-6 text-accent" />
              <h2 className="pt-4 font-display text-title-xs font-medium text-primary">{inspiration.title}</h2>
              <p className="pt-2 text-sm leading-[22.75px] text-body">{inspiration.body}</p>
              <Link
                href={inspiration.href}
                className="mt-3 inline-flex items-center gap-2 rounded-field text-sm font-semibold uppercase tracking-label text-primary hover:opacity-70"
              >
                {inspiration.cta}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </section>

            <section className={cn(SIDE_CARD, "border border-border bg-card")}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-primary">
                <MailIcon aria-hidden className="size-4 text-accent" />
                {tips.title}
              </h2>
              <ul className="flex flex-col gap-2 pt-3 text-sm leading-[22.75px] text-body">
                {tips.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </Container>
    </div>
  );
}
