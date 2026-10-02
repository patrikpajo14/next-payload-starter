# Starter Site

A bilingual (Croatian, English) marketing and articles website whose every piece of content is edited by editors in the CMS. It doubles as a starter template that demonstrates how the website and the CMS connect.

## Language

**Editor**:
A person who creates and changes site content in the CMS admin.
_Avoid_: Admin, author, content manager

**Visitor**:
A person browsing the public website.
_Avoid_: User, customer

**Locale**:
A language version of the site content: Croatian (default) or English.
_Avoid_: Language, translation

### Pages and content

**Page**:
A public screen of the site: the Homepage, an Article List, or an Article's own page.
_Avoid_: View, screen, route

**Homepage**:
The landing Page, built from an ordered list of Sections that Editors choose, order, and edit.
_Avoid_: Home, landing page

**Section**:
A self-contained, reorderable part of the Homepage with its own content (Hero, Products Slider, Solutions, FAQ, Banner).
_Avoid_: Block, widget, component

**Article**:
A piece of written content with a title, excerpt, cover image, and rich-text body, published at its own Page. Every Article belongs to exactly one Category.
_Avoid_: Post, blog post, news item

**Category**:
A named group of Articles whose title and optional SEO Name are set per Locale. A Category with an SEO Name has its own Article List Page.
_Avoid_: Tag, topic, section

**SEO Name**:
The URL segment of a Category in one Locale, such as `clanci` in Croatian and `articles` in English.
_Avoid_: Slug, path

**Article List**:
The Page that lists the Articles of one Category, newest first, split into numbered pages.
_Avoid_: Archive, index, blog page

**Standalone Article**:
An Article whose Category has no SEO Name, so it is served directly under the Locale (`/hr/politika-privatnosti`). Used for the privacy policy and the Contact Page.
_Avoid_: Static page, fixed page

**Draft**:
An Article (or other content) that Editors can see but Visitors cannot until it is published.
_Avoid_: Unpublished, hidden

**Published**:
Content that Visitors can see on the public website.
_Avoid_: Live, public

### Site chrome

**Header**:
The navigation shown at the top of every Page, with Editor-managed links.
_Avoid_: Navbar, menu

**Footer**:
The text and links shown at the bottom of every Page, Editor-managed.
_Avoid_: Bottom bar

### Contact

**Contact Page**:
A Standalone Article that shows the Contact Form. It has no fixed route of its own.
_Avoid_: Contact route

**Contact Form**:
The form on the Contact Page where a Visitor sends a message to the site owner.
_Avoid_: Enquiry form, feedback form

**Contact Submission**:
A message a Visitor sent through the Contact Form, kept for Editors to read.
_Avoid_: Lead, inquiry, ticket
