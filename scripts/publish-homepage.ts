// Publishes a Homepage saved before the Homepage had Drafts.
//
//   pnpm publish-homepage
//
// Turning Drafts on gives that row a draft status (or none), and Visitors read
// only a published Homepage, so both Locales would show no Sections until an
// Editor publishes. This does it once, for every Locale at the same time (the
// status is shared). A Homepage that is already published is left alone, so it
// is safe to run again and cannot overwrite a newer Draft.
import config from "@payload-config";
import { getPayload } from "payload";

const payload = await getPayload({ config });

// Saved content, whatever its status: a Visitor's read would hide it.
const homepage = await payload.findGlobal({ slug: "homepage", overrideAccess: true });

if (homepage._status === "published") {
  console.log("The Homepage is already published. Nothing to do.");
} else {
  await payload.updateGlobal({
    slug: "homepage",
    data: { _status: "published" },
    overrideAccess: true,
  });
  console.log("Published the Homepage in every Locale.");
}
process.exit(0);
