import type { Payload } from "payload";
import { describe, expect, it, vi } from "vitest";

import { notifyContactSubmission } from "@/lib/contact-notification";
import { emailAdapter } from "@/lib/email-adapter";

const submission = {
  firstName: "Ana",
  lastName: "Horvat",
  email: "ana@example.com",
  phone: "091 234 5678",
  address: "Ilica 1",
  postalCode: "10000",
  message: "Pozdrav!",
  visitorLocale: "hr",
} as const;

function fakePayload(sendEmail = vi.fn().mockResolvedValue(undefined)) {
  const error = vi.fn();
  const warn = vi.fn();
  const payload = { sendEmail, logger: { error, warn } } as unknown as Payload;
  return { payload, sendEmail, error, warn };
}

describe("notifyContactSubmission", () => {
  it("sends one email to the configured address", async () => {
    const { payload, sendEmail } = fakePayload();

    await notifyContactSubmission(payload, submission, { CONTACT_NOTIFY_EMAIL: "owner@example.com" });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const message = sendEmail.mock.calls[0]![0];
    expect(message.to).toBe("owner@example.com");
    expect(message.text).toContain("Ana Horvat");
    expect(message.text).toContain("Pozdrav!");
  });

  it("sends nothing and does not throw when CONTACT_NOTIFY_EMAIL is missing", async () => {
    const { payload, sendEmail } = fakePayload();

    await expect(notifyContactSubmission(payload, submission, {})).resolves.toBeUndefined();

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("logs the error and does not throw when the email fails", async () => {
    const failure = new Error("resend is down");
    const { payload, error } = fakePayload(vi.fn().mockRejectedValue(failure));

    await expect(
      notifyContactSubmission(payload, submission, { CONTACT_NOTIFY_EMAIL: "owner@example.com" }),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith({ err: failure }, expect.stringContaining("notification"));
  });
});

describe("emailAdapter", () => {
  it("is off without RESEND_API_KEY, so development needs no provider", () => {
    expect(emailAdapter({})).toBeUndefined();
  });

  it("is on with RESEND_API_KEY", () => {
    expect(emailAdapter({ RESEND_API_KEY: "re_test" })).toBeTypeOf("function");
  });
});
