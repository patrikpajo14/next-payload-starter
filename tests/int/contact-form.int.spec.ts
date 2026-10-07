import { describe, expect, it } from "vitest";

import { validateContactForm } from "@/lib/contact-form";

const valid = {
  firstName: "Ana",
  lastName: "Horvat",
  email: "",
  phone: "+385 91 234-5678",
  address: "Ilica 1",
  postalCode: "10000",
  message: "Pozdrav!",
  consent: "on",
};

describe("validateContactForm", () => {
  it("accepts a complete form, with the email optional", () => {
    const result = validateContactForm(valid, "hr");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toMatchObject({ firstName: "Ana", postalCode: "10000" });
  });

  it("trims values", () => {
    const result = validateContactForm({ ...valid, firstName: "  Ana  " }, "hr");

    expect(result.ok && result.data.firstName).toBe("Ana");
  });

  it.each(["firstName", "lastName", "phone", "address", "postalCode", "message", "consent"])(
    "requires %s",
    (field) => {
      const result = validateContactForm({ ...valid, [field]: "" }, "en");

      expect(result.ok).toBe(false);
      if (!result.ok) expect(Object.keys(result.errors)).toEqual([field]);
    },
  );

  it("rejects letters in the phone number", () => {
    const result = validateContactForm({ ...valid, phone: "09x123" }, "en");

    expect(!result.ok && result.errors.phone).toBe("Use only digits, spaces, + and -.");
  });

  it.each(["1000", "100000", "1000a"])("rejects the postal code %s", (postalCode) => {
    const result = validateContactForm({ ...valid, postalCode }, "en");

    expect(!result.ok && result.errors.postalCode).toBe("Enter a five-digit postal code.");
  });

  it("rejects a malformed email but accepts a well-formed one", () => {
    expect(validateContactForm({ ...valid, email: "nope" }, "en").ok).toBe(false);
    expect(validateContactForm({ ...valid, email: "ana@example.com" }, "en").ok).toBe(true);
  });

  it("words errors in the Visitor's Locale", () => {
    const hr = validateContactForm({ ...valid, firstName: "" }, "hr");
    const en = validateContactForm({ ...valid, firstName: "" }, "en");

    expect(!hr.ok && hr.errors.firstName).toBe("Ovo polje je obavezno.");
    expect(!en.ok && en.errors.firstName).toBe("This field is required.");
  });
});
